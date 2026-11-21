(ns loom.task-test
  "阶段6：roundtrip 属性测试在此生长。
  纪律：测试名即通用语言，写成业务句子。"
  (:require [clojure.test :refer [deftest testing is]]))

(deftest ^:pending 创建任务后按-id-读回字段无损
  (testing "随机合法任务经 create-task! 入库后读回字段无损"
    (throw (ex-info "待实现：阶段6（生成器用 malli 派生，跑 200 条）" {:stage 6}))))

(deftest ^:pending 非法状态值在写路径被拦下
  (testing "status 不在枚举内的任务无法落库"
    (throw (ex-info "待实现：阶段6" {:stage 6}))))
