(ns loom.db
  "存储模型：领域词汇的第二种说法。
  纪律：snake_case、裸字符串状态、CHECK 兜底是刻意的——两套词汇的交汇点
  只允许出现在映射层（见 DDD 指南 3.11/3.12）。")

;; L3 不变量在此落库（对照 DDD 指南 3.12 的不变量落点表）：
;; - 标题长度 / 状态枚举 / estimate ≥ 0   → CHECK
;; - end_ts > start_ts                    → CHECK
;; - 全局至多一个活跃计时                  → 部分唯一索引 uniq_active_timer
(def ddl
  ["CREATE TABLE IF NOT EXISTS tasks (
      id           TEXT PRIMARY KEY,
      title        TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 120),
      status       TEXT NOT NULL CHECK (status IN ('todo','doing','done','archived')),
      estimate_min INTEGER CHECK (estimate_min >= 0),
      created_at   INTEGER NOT NULL,
      updated_at   INTEGER NOT NULL)"
   "CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)"
   "CREATE TABLE IF NOT EXISTS time_entries (
      id       TEXT PRIMARY KEY,
      task_id  TEXT NOT NULL REFERENCES tasks(id),
      start_ts INTEGER NOT NULL,
      end_ts   INTEGER,
      CHECK (end_ts IS NULL OR end_ts > start_ts))"
   "CREATE UNIQUE INDEX uniq_active_timer ON time_entries(end_ts) WHERE end_ts IS NULL"])

;; ── 阶段3 起在此追加（取消 deps.edn 对应依赖门后）──
;; (defn datasource [] ...)
;; (defn ensure-schema! [db] (run! #(jdbc/execute! db [%]) ddl))
;; (def snake-kebab-opts {:builder-fn rs/as-unqualified-kebab-maps})
