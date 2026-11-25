(ns loom.schema
  "DDD v0.2 通用语言的机器可读词汇表。

  纪律：领域词只在这里定义；写面、映射、API 与测试引用同一条目。
  本文件只表达单值形状与跨字段规则。执行段不重叠、关系图无环等跨行规则
  必须由事务写面保证，不能伪装成单个 map 的 malli 校验。
  时间统一为 epoch millis；量纲是 schema 元数据，不进入 DB。"
  (:require [malli.core :as m]
            [malli.registry :as mr]))

(def epoch-ms [:int {:unit :time/millisecond}])
(def non-empty-string [:string {:min 1}])

(def registry
  (mr/registry
   {;; ── 共享标量 ──
    :time/epoch-ms epoch-ms
    :task/id :uuid
    :template/id :uuid
    :segment/id :uuid
    :relation/id :uuid
    :task-set/id :uuid
    :task/title [:string {:min 1 :max 120}]
    :task/interruption-policy
    [:enum :task.interruption/interruptible
           :task.interruption/non-interruptible]

    ;; ── TaskBackground：实例值对象，未知信息可缺省 ──
    :background/attribute
    [:map {:closed true}
     [:attribute/name non-empty-string]
     [:attribute/type {:optional true} :keyword]
     [:attribute/unit {:optional true} :string]
     [:attribute/required? {:optional true} :boolean]]
    :task/background
    [:map {:closed true}
     [:background/constraints {:optional true} [:vector :string]]
     [:background/resources {:optional true} [:vector :string]]
     [:background/target-info {:optional true} :string]
     [:background/expected-outcome {:optional true} :string]
     [:background/outcome-attributes {:optional true}
      [:vector :background/attribute]]]

    ;; ── TaskResult：当前最新快照；observed 与 recorded 不可混用 ──
    :task/result
    [:map {:closed true}
     [:result/values [:map-of :string :any]]
     [:result/observed-at :time/epoch-ms]
     [:result/recorded-at :time/epoch-ms]
     [:result/evidence-refs {:optional true} [:vector :string]]]

    ;; ── TaskInstance：一次真实工作的稳定身份 ──
    :task/instance
    [:and
     [:map {:closed true}
      [:task/id :task/id]
      [:task/template-id {:optional true} [:maybe :template/id]]
      [:task/title :task/title]
      [:task/objective non-empty-string]
      [:task/background :task/background]
      [:task/incidental? :boolean]
      [:task/interruption-policy :task/interruption-policy]
      [:task/resumable? {:optional true} :boolean]
      [:task/created-at :time/epoch-ms]
      [:task/completed? :boolean]
      [:task/completed-at {:optional true} :time/epoch-ms]
      [:task/result {:optional true} :task/result]]
     [:fn {:error/message "completed? 与 completed-at 必须同时表达完成事实"}
      (fn [{:task/keys [completed? completed-at]}]
        (if completed?
          (some? completed-at)
          (nil? completed-at)))]
     [:fn {:error/message "不可打断实例不需要 resumable?；可打断实例必须明确它"}
      (fn [{:task/keys [interruption-policy resumable?]}]
        (if (= :task.interruption/non-interruptible interruption-policy)
          (nil? resumable?)
          (boolean? resumable?)))]]

    ;; ── ExecutionSegment：活跃段 ended-at 为空；不重叠是事务写面规则 ──
    :execution/segment
    [:and
     [:map {:closed true}
      [:segment/id :segment/id]
      [:segment/task-id :task/id]
      [:segment/started-at :time/epoch-ms]
      [:segment/ended-at [:maybe :time/epoch-ms]]
      [:segment/origin [:enum :segment.origin/timer :segment.origin/manual]]]
     [:fn {:error/message "ended-at 必须晚于 started-at（或为空，表示活跃段）"}
      (fn [{:segment/keys [started-at ended-at]}]
        (or (nil? ended-at) (> ended-at started-at)))]]

    ;; ── TaskTemplate：只保存类任务规约，不拥有实例执行事实 ──
    :task/template
    [:map {:closed true}
     [:template/id :template/id]
     [:template/name non-empty-string]
     [:template/default-objective {:optional true} non-empty-string]
     [:template/default-background {:optional true} :task/background]
     [:template/default-interruption-policy {:optional true}
      :task/interruption-policy]
     [:template/default-resumable? {:optional true} :boolean]
     [:template/created-at :time/epoch-ms]
     [:template/confirmed-at :time/epoch-ms]]

    ;; ── TaskRelation：图无环由 LinkPrecedence 事务保证 ──
    :task/relation
    [:and
     [:map {:closed true}
      [:relation/id :relation/id]
      [:relation/from-task-id :task/id]
      [:relation/to-task-id :task/id]
      [:relation/type [:= :relation.type/precedes]]
      [:relation/created-at :time/epoch-ms]]
     [:fn {:error/message "实例不能与自身建立时序关系"}
      (fn [{:relation/keys [from-task-id to-task-id]}]
        (not= from-task-id to-task-id))]]

    ;; ── TaskSet：ExecutionPlan 只是具有名称和当前目的的角色 ──
    :task/set
    [:map {:closed true}
     [:task-set/id :task-set/id]
     [:task-set/name {:optional true} non-empty-string]
     [:task-set/purpose {:optional true} non-empty-string]
     [:task-set/created-at :time/epoch-ms]]
    :task-set/membership
    [:map {:closed true}
     [:membership/task-set-id :task-set/id]
     [:membership/task-id :task/id]
     [:membership/added-at :time/epoch-ms]]}))

(def malli-opts {:registry registry})

(comment
  ;; REPL 探针：活跃 ExecutionSegment 合法，结束早于开始非法。
  (require '[malli.generator :as mg])
  (mg/generate :task/background malli-opts)
  (m/validate :execution/segment
              {:segment/id (random-uuid)
               :segment/task-id (random-uuid)
               :segment/started-at 1732000000000
               :segment/ended-at nil
               :segment/origin :segment.origin/timer}
              malli-opts))
