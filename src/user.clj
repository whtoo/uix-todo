(ns user
  "REPL 工作台。jack-in 后默认落在这里。
  纪律：探索性代码在这里生长，行为冻结后再迁入正式命名空间。")

(defn greet
  [name]
  (str "hello ->> , " name))

(comment
  ;; 每次 REPL 会话的第一个动作：验证热改链路
  (greet "world")

  ;; 阶段 3 之后，这里长这样：
  ;; (require '[loom.task :as task] '[loom.time :as time])
  ;; (task/capture-task! db {:task/id (random-uuid)
  ;;                         :task/title "写第一个实例"
  ;;                         :task/objective "走通 Capture → Start → Pause → Complete"
  ;;                         :task/background {}
  ;;                         :task/incidental? true
  ;;                         :task/interruption-policy :task.interruption/interruptible
  ;;                         :task/resumable? true})
  ;; (time/start-task! db task-id)
  )
