# 领域分析工作表

> 方法链：OOA 抽取 → 生命周期／不变量筛选 → 一致性边界筛选 → Clojure 落点。
> 本表是 ADR 的上游登记，不重复完整领域论证；当前结论来自 `任务聚合Kanban系统-DDD领域设计-v0.2.md`。
> 完整贯穿示例见 `DDD建模示例.md`；真实待决项见 `decisions.md`。

## 1. 工作流程

1. **OOA 抽取**：从真实操作用例抽名词，不从长期方法或页面菜单反推实体。
2. **筛子一 · 生命周期／不变量**：有独立身份和规则的才是实体候选；否则考虑值对象、关系、投影或淘汰。
3. **筛子二 · 一致性边界**：必须一起修改、一起校验的才进入同一聚合；跨行／跨聚合规则显式标为事务写面职责。
4. **Clojure 落位**：registry 加词汇，写面命名空间承载行为，DDL 只兜底可声明表达的约束，测试固定业务语义。

## 2. 当前对象登记

| 名词 | 生命周期／不变量判定 | 结论 | Clojure 落点 |
|---|---|---|---|
| TaskInstance | 一次真实工作；ID 稳定；完成与执行规则有一致性要求 | 实体、独立聚合根 | `:task/instance`；`loom.task`；`tasks` |
| TaskBackground | 属于实例，无独立身份；允许未知 | 值对象 | `:task/background`；实例映射；EDN TEXT 存储 |
| TaskResult | 属于实例的当前结果快照；观察与录入时间必须区分 | 值对象 | `:task/result`；`record-task-result!`；实例结果列 |
| ExecutionSegment | 有 `segment/id`；起止时间与来源有规则；必须引用实例 | 有身份执行记录 | `:execution/segment`；`loom.time`；`execution_segments` |
| TaskTemplate | 类任务规约；至少两个不同实例经人确认后创建 | 实体、独立聚合根 | `:task/template`；后续 `loom.template`；`task_templates` |
| 实例模板归属 | 只改变知识层归属，不改执行和结果 | 实例引用，不是新聚合 | `:task/template-id`；后续 AssignTaskToTemplate |
| TaskRelation | 有 ID；引用两个实例；自环、重复和图环被拒绝 | 有身份关系记录 | `:task/relation`；后续 `loom.composition`；`task_relations` |
| TaskSet | 平级组合，有独立 ID；集合内成员唯一 | 实体、独立聚合根 | `:task/set`；后续 `loom.composition`；`task_sets` |
| TaskSetMembership | 由 `task-set-id + task-id` 共同确定 | 依赖关系记录 | `:task-set/membership`；`task_set_memberships` 复合主键 |
| ExecutionPlan | 有名称与当前目的的 TaskSet 角色；无独立生命周期 | 领域角色，不另建实体 | 复用 `:task/set` 与 `task_sets`，不建 `plans` |
| Kanban | 可从实例与执行段重建，无独立写规则 | 只读投影 | 查询函数；不建 `kanban-column` |
| BehaviorTimeSeries | 从实例、模板、执行段和结果计算 | 只读投影 | 只读查询；不建 Statistics 聚合 |
| 类任务／常态化／控制／组合候选 | 未经人确认不是事实；可接受、修订或否决 | 候选解释 | 后续查询与确认编排；不自动写回事实表 |
| Goal／Advice／Decision／Iteration | 当前切片没有足够真实操作要求独立生命周期 | 暂缓，不进当前模型 | 不建 schema、表或空命名空间 |
| TaskOccurrence | 当前新一次发生直接创建新 TaskInstance | 暂缓 | 只有复用同一实例身份跨多轮执行时再评估 |
| Observation | 当前只需最新结果快照 | 暂缓 | 多次独立观测、驳回或确认历史出现时再评估 |

## 3. 不变量落点登记

| 不变量 | L2 写面 | L3 DDL | 说明 |
|---|---|---|---|
| 标题与目标必填 | Capture／Revise | NOT NULL + CHECK | 快速捕获是否允许目标未知仍是所有者契约决策 |
| 可打断／可接续组合合法 | Capture／Revise／Pause／Resume | 策略组合 CHECK | 不可接续的实际终止流程保持待验证 |
| `ended-at > started-at` | Start／AddSegment | CHECK | 活跃段 ended-at 为空 |
| 同实例执行段不重叠 | 执行事务 | 无简单跨行 CHECK | 不能用单值 malli schema 代替数据库范围查询 |
| 全局至多一个活跃计时（若保留） | 执行事务 | 部分唯一索引 | 属现有技术约束，不从 TaskSet 推导 |
| 完成前无活跃段 | Complete 事务 | 无简单跨行 CHECK | 不允许直接 assoc `completed?` |
| 完成后不新增执行段 | Start／AddSegment | 无简单跨行 CHECK | 当前不隐式 reopen |
| 模板确认至少两个不同实例 | ConfirmTaskTemplate 事务 | 外键只能辅助 | 还需人工确认，不是标题相似自动生成 |
| 关系不自环、不重复 | LinkPrecedence | CHECK + UNIQUE | 图无环仍需事务查询 |
| 关系图无环 | LinkPrecedence 事务 | 无简单图约束 | 无环不自动构成阻塞 |
| 同实例同集合成员唯一 | AddTaskToSet | 复合 PRIMARY KEY | TaskSet 不拥有成员状态 |

## 4. 登记规则

- **否定决策留痕**：为什么 X 不是实体，要写清事实依据，防止后来者反复建表。
- **名词 ≠ 模型**：没有只能由自己维护的规则，就不是独立写模型成员。
- **组合 ≠ 聚合**：TaskSet 组合实例，但不拥有成员执行事实。
- **子域 ≠ 部署单元**：当前四个子域可以在一个 Clojure 单体中演进。
- **读模型不写回**：统计、Kanban 与候选生成不直接修改事实表。
- **全流程门禁**：新模型必须走完“登记 → 两道筛子 → Clojure 落点 → 验证”，不能跳步直接加 schema。
