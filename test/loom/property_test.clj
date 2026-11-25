(ns loom.property-test
  "阶段6：ExecutionSegment 与执行命令的不变量属性测试。
  合法生成器可以从 loom.schema 派生；非法重叠与迁移序列需要专门构造。"
  (:require [clojure.test :refer [deftest testing is]]))

(deftest ^:pending 库内永不存在-end-早于-start-的执行段
  (testing "随机时间对入库后，任意读回均满足 ended-at > started-at 或活跃段为空"
    (throw (ex-info "待实现：阶段6" {:stage 6}))))

(deftest ^:pending 同一实例执行段不得重叠
  (testing "随机重叠补记或恢复命令都被拒绝，已有执行段保持不变"
    (throw (ex-info "待实现：阶段6" {:stage 6}))))

(deftest ^:pending 活跃计时唯一
  (testing "全局活跃段存在时，其他实例 Start 必抛 :time/conflict"
    (throw (ex-info "待实现：阶段6" {:stage 6}))))

(deftest ^:pending 实际投入等于执行段之和
  (testing "暂停与恢复产生多段，实际投入不包含中间等待，也不增加实例频次"
    (throw (ex-info "待实现：阶段6" {:stage 6}))))

(deftest ^:pending 完成后不得新增执行段
  (testing "CompleteTask 后 Start 与 AddExecutionSegment 均被拒绝，当前不隐式 reopen"
    (throw (ex-info "待实现：阶段6" {:stage 6}))))
