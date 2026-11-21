(ns loom.time
  "时间上下文：TimeEntry 聚合的写面。
  ADR-001 语境：Timer 不建模为独立实体，是 end-ts 为空的 TimeEntry。
  若你在阶段3推翻此提案，请先在 doc/decisions.md 记录新 ADR。")

;; ── 映射 ──
(defn row->entry [r]
  (throw (ex-info "待实现：阶段3 数据层任务卡" {:stage 3})))

(defn entry->row [t]
  (throw (ex-info "待实现：阶段3 数据层任务卡" {:stage 3})))

;; ── 写路径 ──
(defn start-timer!
  "不变量（跨聚合）：全局至多一个活跃计时。
  L2：本函数事务内先查 active 再插入，冲突抛 ex-info :time/conflict；
  L3：部分唯一索引 uniq_active_timer 已兜底（loom.db/ddl）。"
  [db task-id]
  (throw (ex-info "待实现：阶段3" {:stage 3})))

(defn stop-timer!
  "结束当前活跃计时（end-ts 落当前时间）。"
  [db]
  (throw (ex-info "待实现：阶段3" {:stage 3})))

(defn active-timer
  "查询当前活跃 TimeEntry（end-ts 为空），无则 nil。"
  [db]
  (throw (ex-info "待实现：阶段3" {:stage 3})))

(defn list-entries
  "支持 task-id / from / to 过滤（统计投影的数据源）。"
  [db filters]
  (throw (ex-info "待实现：阶段3" {:stage 3})))
