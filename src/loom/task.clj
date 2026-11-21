(ns loom.task
  "任务上下文：Task 聚合的写面。所有生命周期变更的唯一入口。
  纪律：禁止调用方散落 (update-in task [:status] ...)——
  绕过本命名空间即绕过不变量（DDD 指南反模式 2）。")

;; ── 映射（ACL，DDD 指南 3.11 第③层）──
(defn row->task
  "存储 → 领域。出口唯一方向。阶段3任务卡。"
  [r]
  (throw (ex-info "待实现：阶段3 数据层任务卡" {:stage 3})))

(defn task->row
  "领域 → 存储。入口唯一方向。阶段3任务卡。"
  [t]
  (throw (ex-info "待实现：阶段3 数据层任务卡" {:stage 3})))

;; ── 写路径 ──
(defn create-task!
  "工厂 + 仓储入口。领域值进，领域值出；存储形态不出本函数。"
  [db {:task/keys [id title estimate-min]}]
  (throw (ex-info "待实现：阶段3" {:stage 3})))

(defn get-task [db id]
  (throw (ex-info "待实现：阶段3" {:stage 3})))

(defn list-tasks
  "支持 status/tag 过滤（:?status=?tag=）。动态 WHERE 见 DDD 指南 build-where 模式。"
  [db filters]
  (throw (ex-info "待实现：阶段3" {:stage 3})))

(defn update-task!
  "changes 为部分字段的 map；updated_at 由本函数刷新。"
  [db id changes]
  (throw (ex-info "待实现：阶段3" {:stage 3})))

(defn delete-task!
  "ADR-002 落点：删除任务时时间条目保留还是级联？决定写在这里，理由写进 doc/decisions.md。"
  [db id]
  (throw (ex-info "待实现：阶段3" {:stage 3})))

(comment
  ;; 阶段3验收通过后，dev 启动装配（REPL 手动执行）：
  #_(require '[malli.instrument :as mi])
  #_(mi/instrument! {:ns ['loom.task 'loom.time]}))
