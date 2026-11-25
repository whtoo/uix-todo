(ns loom.task
  "TaskInstance 聚合写面：捕获、修订、查询与当前 TaskResult。
  Start / Pause / Resume / Complete 由 loom.time 的执行事务协调。
  禁止调用方直接 assoc completed?、template-id 或结果字段绕过写面。")

;; ── 映射（ACL）：存储行与领域 map 的唯一双语地带 ──
(defn row->task
  "存储 → 领域。UUID、布尔、策略枚举、EDN 背景与结果在此转换。"
  [r]
  (throw (ex-info "待实现：阶段3 TaskInstance 映射" {:stage 3})))

(defn task->row
  "领域 → 存储。只转换形状，不在映射层偷偷执行业务流程。"
  [t]
  (throw (ex-info "待实现：阶段3 TaskInstance 映射" {:stage 3})))

;; ── 写路径 ──
(defn capture-task!
  "CaptureTaskInstance：不依赖 Goal 或 TaskTemplate。
  按当前 DDD 契约校验标题、目标、背景、偶然性与打断／接续规则。"
  [db {:task/keys [id template-id title objective background incidental?
                   interruption-policy resumable?]}]
  (throw (ex-info "待实现：阶段3 CaptureTaskInstance" {:stage 3})))

(defn revise-task!
  "ReviseTaskInstance：只修订允许变化的实例字段，不改写执行段和结果历史。"
  [db id changes]
  (throw (ex-info "待实现：阶段3 ReviseTaskInstance" {:stage 3})))

(defn record-task-result!
  "RecordTaskResult：与 CompleteTask 独立；observed-at 与 recorded-at 分别保存。"
  [db task-id result]
  (throw (ex-info "待实现：阶段3 RecordTaskResult" {:stage 3})))

;; ── 查询 ──
(defn get-task [db id]
  (throw (ex-info "待实现：阶段3" {:stage 3})))

(defn list-tasks
  "支持当前读面需要的过滤；Kanban 状态由查询投影，不写 kanban-column。"
  [db filters]
  (throw (ex-info "待实现：阶段3" {:stage 3})))

;; 当前 v0.2 没有 DeleteTaskInstance；ADR-002 只有在删除进入真实用例时才关闭。
(comment
  ;; REPL 探针：实现后先走 Capture → Revise → RecordResult。
  #_(require '[malli.instrument :as mi])
  #_(mi/instrument! {:ns ['loom.task 'loom.time]}))
