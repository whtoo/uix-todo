(ns loom.task-test
  "阶段6：TaskInstance roundtrip 与结果语义测试。
  纪律：测试名即通用语言；本阶段保持 pending，不提前改绿。"
  (:require [clojure.test :refer [deftest testing is]]))

(deftest ^:pending 捕获实例后按-id-读回字段无损
  (testing "随机合法 TaskInstance 经 capture-task! 入库后，目标、背景与执行规则读回无损"
    (throw (ex-info "待实现：阶段6（生成器用 malli 派生，跑 200 条）" {:stage 6}))))

(deftest ^:pending 结果观察时间与录入时间不得混用
  (testing "事后 RecordTaskResult 保留 observed-at 与 recorded-at，完成不推断结果有效"
    (throw (ex-info "待实现：阶段6" {:stage 6}))))

(deftest ^:pending 模板默认值不追溯改写既有实例
  (testing "后续模板切片：ReviseTaskTemplate 后既有实例本地背景和执行规则不变"
    (throw (ex-info "待实现：后续 TaskTemplate 切片" {:stage :template}))))
