(ns loom.property-test
  "阶段6：不变量属性测试。
  生成器从 loom.schema registry 派生（malli.generator）——非法输入从源头被排除。"
  (:require [clojure.test :refer [deftest testing is]]))

(deftest ^:pending 库内永不存在-end-早于-start-的时间条目
  (testing "随机时间对入库后，任意读回均满足 end > start"
    (throw (ex-info "待实现：阶段6" {:stage 6}))))

(deftest ^:pending 活跃计时唯一
  (testing "活跃计时存在时再次 start 必抛 :time/conflict"
    (throw (ex-info "待实现：阶段6" {:stage 6}))))
