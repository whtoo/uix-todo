(ns loom.time
  "TaskInstance 执行写面：Start / Pause / Resume / Complete 与 ExecutionSegment。

  Timer 不是另一份事实；DDD v0.2 提案以 ended-at 为空的 ExecutionSegment 表达活跃计时。
  全局至多一个活跃计时是现有技术约束，由事务与部分唯一索引共同保证。
  同实例段不重叠、Complete 前无活跃段、完成后不新增段都必须在这里检查。")

;; ── 映射 ──
(defn row->segment [r]
  (throw (ex-info "待实现：阶段3 ExecutionSegment 映射" {:stage 3})))

(defn segment->row [segment]
  (throw (ex-info "待实现：阶段3 ExecutionSegment 映射" {:stage 3})))

;; ── 执行命令 ──
(defn start-task!
  "StartTask：创建 origin=timer 的活跃段；重复 Start 的 HTTP 语义见 ADR-003。"
  [db task-id]
  (throw (ex-info "待实现：阶段3 StartTask" {:stage 3})))

(defn pause-task!
  "PauseTask：只允许正在执行且 interruptible 的实例；关闭活跃段，不创建新实例。"
  [db task-id]
  (throw (ex-info "待实现：阶段3 PauseTask" {:stage 3})))

(defn resume-task!
  "ResumeTask：只允许已暂停且 resumable? 的实例；追加新的活跃执行段。"
  [db task-id]
  (throw (ex-info "待实现：阶段3 ResumeTask" {:stage 3})))

(defn complete-task!
  "CompleteTask：不得仍有活跃段；只确认实例结束，不推断结果或计划目的达成。"
  [db task-id]
  (throw (ex-info "待实现：阶段3 CompleteTask" {:stage 3})))

(defn add-execution-segment!
  "AddExecutionSegment：补记 origin=manual；拒绝重叠、非法时间和已完成实例。"
  [db task-id {:segment/keys [id started-at ended-at]}]
  (throw (ex-info "待实现：阶段3 AddExecutionSegment" {:stage 3})))

;; ── 查询 ──
(defn active-segment
  "查询当前全局活跃 ExecutionSegment；没有则返回 nil。"
  [db]
  (throw (ex-info "待实现：阶段3" {:stage 3})))

(defn list-segments
  "支持 task-id / from / to 过滤，是实际投入与中断投影的事实来源。"
  [db filters]
  (throw (ex-info "待实现：阶段3" {:stage 3})))
