(ns loom.db
  "DDD v0.2 存储脚手架：snake_case、裸字符串枚举、0/1 布尔、epoch millis。
  两套词汇的交汇点只允许出现在 loom.task / loom.time 等映射层。

  注意：CREATE ... IF NOT EXISTS 只初始化空库，不是已有数据库迁移工具。
  值对象以 EDN TEXT 整体保存；映射层读取时使用 clojure.edn/read-string，
  禁止使用可执行代码的 clojure.core/read-string。")

;; L3 只兜底可声明表达的规则：
;; - 必填、标题长度、策略组合、完成事实、结果时间与来源枚举 → CHECK / NOT NULL
;; - 全局至多一个活跃计时（现有技术约束）                  → 部分唯一索引
;; - 关系不自环、不重复，成员唯一                          → CHECK / UNIQUE / 复合主键
;;
;; 以下规则仍必须由 L2 事务写面保证，DDL 没有伪装覆盖：
;; - 同一实例执行段不重叠；Complete 时无活跃段；完成后不新增执行段。
;; - ConfirmTaskTemplate 至少两个不同实例并经人确认。
;; - LinkPrecedence 的全图无环检查。
(def ddl
  [;; TaskTemplate 只保存规约；默认值不追溯改写既有实例。
   "CREATE TABLE IF NOT EXISTS task_templates (
      id                            TEXT PRIMARY KEY,
      name                          TEXT NOT NULL CHECK (length(name) >= 1),
      default_objective             TEXT CHECK (default_objective IS NULL OR length(default_objective) >= 1),
      default_background_edn        TEXT,
      default_interruption_policy   TEXT CHECK (default_interruption_policy IS NULL OR default_interruption_policy IN ('interruptible','non-interruptible')),
      default_resumable             INTEGER CHECK (default_resumable IS NULL OR default_resumable IN (0,1)),
      created_at                    INTEGER NOT NULL,
      confirmed_at                  INTEGER NOT NULL,
      CHECK (
        (default_interruption_policy IS NULL AND default_resumable IS NULL)
        OR (default_interruption_policy = 'non-interruptible' AND default_resumable IS NULL)
        OR (default_interruption_policy = 'interruptible' AND default_resumable IN (0,1))
      ))"

   ;; TaskInstance：展示状态不另存 kanban_column；完成事实与结果快照分开。
   "CREATE TABLE IF NOT EXISTS tasks (
      id                     TEXT PRIMARY KEY,
      template_id            TEXT REFERENCES task_templates(id),
      title                  TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 120),
      objective              TEXT NOT NULL CHECK (length(objective) >= 1),
      background_edn         TEXT NOT NULL,
      incidental             INTEGER NOT NULL CHECK (incidental IN (0,1)),
      interruption_policy    TEXT NOT NULL CHECK (interruption_policy IN ('interruptible','non-interruptible')),
      resumable              INTEGER CHECK (resumable IS NULL OR resumable IN (0,1)),
      created_at             INTEGER NOT NULL,
      completed              INTEGER NOT NULL CHECK (completed IN (0,1)),
      completed_at           INTEGER,
      result_values_edn      TEXT,
      result_observed_at     INTEGER,
      result_recorded_at     INTEGER,
      result_evidence_refs_edn TEXT,
      CHECK (
        (interruption_policy = 'non-interruptible' AND resumable IS NULL)
        OR (interruption_policy = 'interruptible' AND resumable IN (0,1))
      ),
      CHECK (
        (completed = 0 AND completed_at IS NULL)
        OR (completed = 1 AND completed_at IS NOT NULL)
      ),
      CHECK (
        (result_observed_at IS NULL
         AND result_recorded_at IS NULL
         AND result_values_edn IS NULL
         AND result_evidence_refs_edn IS NULL)
        OR (result_observed_at IS NOT NULL AND result_recorded_at IS NOT NULL)
      ))"
   "CREATE INDEX IF NOT EXISTS idx_tasks_template ON tasks(template_id)"

   "CREATE TABLE IF NOT EXISTS execution_segments (
      id         TEXT PRIMARY KEY,
      task_id    TEXT NOT NULL REFERENCES tasks(id),
      started_at INTEGER NOT NULL,
      ended_at   INTEGER,
      origin     TEXT NOT NULL CHECK (origin IN ('timer','manual')),
      CHECK (ended_at IS NULL OR ended_at > started_at))"
   "CREATE INDEX IF NOT EXISTS idx_execution_segments_task_start
      ON execution_segments(task_id, started_at)"
   "CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_timer
      ON execution_segments((1)) WHERE ended_at IS NULL"

   ;; ExecutionPlan 不建 plans 表：name + purpose 同时存在即承担该领域角色。
   "CREATE TABLE IF NOT EXISTS task_sets (
      id         TEXT PRIMARY KEY,
      name       TEXT CHECK (name IS NULL OR length(name) >= 1),
      purpose    TEXT CHECK (purpose IS NULL OR length(purpose) >= 1),
      created_at INTEGER NOT NULL)"

   "CREATE TABLE IF NOT EXISTS task_set_memberships (
      task_set_id TEXT NOT NULL REFERENCES task_sets(id),
      task_id     TEXT NOT NULL REFERENCES tasks(id),
      added_at    INTEGER NOT NULL,
      PRIMARY KEY (task_set_id, task_id))"
   "CREATE INDEX IF NOT EXISTS idx_memberships_task
      ON task_set_memberships(task_id)"

   "CREATE TABLE IF NOT EXISTS task_relations (
      id           TEXT PRIMARY KEY,
      from_task_id TEXT NOT NULL REFERENCES tasks(id),
      to_task_id   TEXT NOT NULL REFERENCES tasks(id),
      relation_type TEXT NOT NULL CHECK (relation_type = 'precedes'),
      created_at   INTEGER NOT NULL,
      CHECK (from_task_id <> to_task_id),
      UNIQUE (from_task_id, to_task_id, relation_type))"
   "CREATE INDEX IF NOT EXISTS idx_relations_to_task
      ON task_relations(to_task_id)"])

;; ── 阶段3由所有者实现 ──
;; (defn datasource [] ...)
;; (defn ensure-schema! [db] (run! #(jdbc/execute! db [%]) ddl))
;; (def snake-kebab-opts {:builder-fn rs/as-unqualified-kebab-maps})
