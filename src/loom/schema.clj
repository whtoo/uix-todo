(ns loom.schema
  "通用语言的机器可读词汇表（共享内核）。
  纪律：领域词只在这里定义；其它命名空间引用，不复制、不改写。
  量纲以 schema 元数据存在（:unit），供校验/生成/文档消费，不进 DB。
  2026-11-22 修复：::task/、::time/ 自动解析关键字需要 ns 别名——
  补 loom.task / loom.time require（模板缺失，JVM 读取期报 Invalid token）。"
  (:require [malli.core :as m]
            [malli.registry :as mr]
            [loom.task :as task]
            [loom.time :as time]))

(def registry
  (mr/registry
   {;; ── 任务上下文 ──
    ::task/id       :uuid
    ::task/title    [:and :string [:min 1] [:max 120]]
    ::task/status   [:enum :task.status/todo :task.status/doing
                           :task.status/done :task.status/archived]
    ::task/estimate [:int {:min 0 :unit :time/minute}]
    ::task/task
    [:map {:closed true}
     [:task/id ::task/id]
     [:task/title ::task/title]
     [:task/status ::task/status]
     [:task/estimate-min {:optional true} ::task/estimate]
     [:task/created-at :int]
     [:task/updated-at :int]]

    ;; ── 时间上下文 ──
    ::time/id       :uuid
    ::time/start-ts [:int {:unit :time/millisecond}]
    ::time/end-ts   [:maybe ::time/start-ts]
    ::time/entry
    [:and
     [:map {:closed true}
      [:time/id ::time/id]
      [:time/task-id ::task/id]
      [:time/start-ts ::time/start-ts]
      [:time/end-ts {:optional true} ::time/end-ts]]
     ;; 不变量：end 必须晚于 start（或为空 = 进行中）。可执行文档。
     [:fn {:error/message "end 必须晚于 start（或为空，表示进行中）"}
      (fn [{:time/keys [start-ts end-ts]}]
        (or (nil? end-ts) (> end-ts start-ts)))]]}))

(def malli-opts {:registry registry})

(comment
  ;; REPL 探针：
  (require '[malli.generator :as mg])
  (mg/generate ::time/entry malli-opts)
  (m/validate ::time/entry
              {:time/id (random-uuid)
               :time/task-id (random-uuid)
               :time/start-ts 1732000000000
               :time/end-ts nil}
              malli-opts))
