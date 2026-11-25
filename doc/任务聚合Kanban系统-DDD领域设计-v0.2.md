# 任务聚合 Kanban 系统：当前切片领域设计

> 版本：v0.2（聚焦讨论稿，子域与基本对象修订）
> 基线：用户修订的 v0.1、此前 v0.2 及本轮 TaskTemplate／TaskInstance 讨论
> 范围：任务实例、类任务、执行事实、平级组合、行为观察与 Kanban 呈现
> 原则：以实际可观测对象为事实基准，不从长期方法反推当前实体

## 0. 当前切片为什么存在

当前要验证的不是一套完整开发方法，而是一个具体、可观察的能力：

> **持续捕获实际出现的任务实例，记录其目标、背景、执行时间与结果；当第二个独立同类实例出现时确认类任务；按需建立时序关系和平级任务集，并从实际记录中形成行为观察与 Kanban 投影。**

这个切片成立以后，才有事实依据判断是否需要更复杂的目标管理、Agent 建议、迭代管理或知识网络。

### 0.1 当前事实与不确定产物的边界

- **TaskInstance 是当前实在的可观测对象。** 它能被创建、执行、暂停、恢复、完成和记录结果。本文未特别说明时，Task 均指 TaskInstance。
- **TaskTemplate 是知识层的类任务。** 它从重复出现的实例中被确认，描述一类工作，不拥有某一次执行的时间和结果。
- **ExecutionPlan 是任务组合的涌现结果。** 它来自已有 TaskInstance 的平级组合，不是父 Task，也不是不可更改的总计划。
- **Goal、Advice 等是后续聚合、解释或认识活动的产物。** 当前不为它们建立独立聚合和生命周期。
- **Kanban 与行为时间序列是读投影。** 它们读取任务、模板、组合与执行记录，不拥有另一套事实。
- **原型迭代用于发现稳定结构。** 当前只固化必须满足的确定性约束，不用完整 DDD 覆盖尚未稳定的流程。

## 1. 当前业务效果

用户可以完成以下操作闭环：

1. 记录一个实际 TaskInstance，而不必先建立 Goal、模板或完整计划；
2. 标明它是否偶然出现、是否不可打断、是否允许打断后接续；
3. 记录任务目标、背景、期望结果及结果观测口径；
4. 开始、暂停、恢复和完成任务执行，记录实际结果；
5. 在第二个独立同类实例出现时，确认 TaskTemplate 并关联既有实例；
6. 从模板创建后续实例，或由既有实例补充模板归属；
7. 建立 TaskInstance 之间的时序关系和平级 TaskSet；
8. 将具有名称和当前目的的 TaskSet 解释为 ExecutionPlan；
9. 在 Kanban 中观察实例状态及所属任务集；
10. 按类任务观察实例频次、周期间隔、实际投入、中断和结果，形成常态化、控制或组合候选。

**直接可验收的效果**：临时出现的 Task 不会因为没有预先计划或模板而丢失；重复执行不会覆盖前一次实例的历史；已有 Task 可以不复制、不改身份地组合成 ExecutionPlan；暂停和恢复后的实际投入时间仍能被正确计算。

## 2. 本体论分层与子域划分

### 2.1 先区分对象以何种方式存在

| 本体论类别 | 当前对象 | 存在方式 |
|---|---|---|
| 类／规约 | TaskTemplate | 描述一类可重复工作，不随某一次执行完成而消失 |
| 例／发生 | TaskInstance | 某一次真实工作，有独立身份和生命周期 |
| 依赖性事实记录 | ExecutionSegment、TaskResult | 不能脱离任务实例独立成立 |
| 关系 | TaskRelation、TaskSetMembership | 所引用的实例或任务集不存在时，关系也不成立 |
| 组合 | TaskSet、ExecutionPlan | 可以有自己的身份，但不拥有成员的执行事实 |
| 测量投影 | 类任务频次、周期、投入、中断分布 | 从事实计算，不是新事实 |
| 候选解释 | 类任务识别、常态化、控制、组合候选 | 人可以接受、修改或否决，不能自动成为事实 |

本体论类别不等于子域数量。子域还需要按变化原因、规则内聚性和业务差异收束。

### 2.2 当前四个子域

| 子域 | 核心问题 | 主要对象 | 类型 |
|---|---|---|---|
| 任务实例与执行事实 | 这一次工作如何发生、执行和产生结果 | TaskInstance、TaskBackground、ExecutionSegment、TaskResult | 支撑子域，系统事实底座 |
| 类任务与类型演化 | 哪些一次性工作逐渐显现为可复用的一类工作 | TaskTemplate、实例模板归属、默认背景与结果观测口径 | **核心子域** |
| 工作组合与顺序 | 多个任务实例如何形成顺序和执行组合 | TaskRelation、TaskSet、TaskSetMembership、ExecutionPlan | 支撑子域 |
| 行为观察与复盘 | 实际记录显示出哪些重复、投入和组合模式 | 行为时间序列、类任务识别候选、常态化／控制／组合候选 | **核心子域** |

核心与支撑不是按技术重要性划分，而是按当前系统的差异化价值划分：执行、计时和平级组合也可由普通 Todo 产品提供；从一次性实例中发现类任务，再观察其实际行为动力学，是当前切片的核心。

### 2.3 子域依赖与反馈

```text
任务实例与执行事实
        │
        ├── 提供实例身份 ──> 类任务与类型演化
        │
        ├── 提供实例身份 ──> 工作组合与顺序
        │
        └──────────────┐
                       │
类任务与类型演化 ──────┤
                       ├──> 行为观察与复盘
工作组合与顺序 ────────┘
                              │
                              └─ 类任务／常态化／组合候选
                                          │
                                   人工确认后才写回
```

候选写回是应用层协调的反馈过程，不是行为观察子域直接修改其他子域的数据表。

### 2.4 当前不建立的对象

- Goal 聚合；
- Advice 聚合；
- Decision 聚合；
- Iteration 聚合；
- 独立 Observation 聚合；
- TaskOccurrence：当前以新 TaskInstance 表达新一次独立发生；
- 全局 MasterPlan；
- 领域知识网络及其差分模型；
- 完整事件溯源与多限界上下文部署结构。

这些不是被永久否定，而是当前没有足够事实要求它们存在。若未来必须复用同一 TaskInstance 身份跨多轮执行，才重新评估 TaskOccurrence。

## 3. 基本对象与 DDD 角色

| 对象 | 所属子域 | DDD 角色 | 身份与所有权 |
|---|---|---|---|
| TaskTemplate | 类任务与类型演化 | 实体、独立聚合根 | 有 `template/id`；只拥有类任务规约，不拥有实例执行事实 |
| TaskInstance | 任务实例与执行事实 | 实体、独立聚合根 | 有 `task/id`；代表一次真实工作 |
| TaskBackground | 任务实例与执行事实 | 值对象 | 属于实例；模板只保存可复制的默认背景 |
| TaskResult | 任务实例与执行事实 | 值对象 | 属于实例，保存当前实际结果快照 |
| ExecutionSegment | 任务实例与执行事实 | 有身份的执行记录 | 有 `segment/id`，必须引用一个 `task/id` |
| TaskRelation | 工作组合与顺序 | 有身份的关系记录 | 有 `relation/id`，引用两个 TaskInstance |
| TaskSet | 工作组合与顺序 | 实体、独立聚合根 | 有 `task-set/id`，不拥有成员状态 |
| TaskSetMembership | 工作组合与顺序 | 依赖关系记录 | 由 `task-set-id` 与 `task-id` 共同确定 |
| ExecutionPlan | 工作组合与顺序 | TaskSet 的领域角色 | 复用 `task-set/id`，不另建计划实体 |
| Kanban | 跨子域读面 | 读投影 | 无独立事实 |
| BehaviorTimeSeries | 行为观察与复盘 | 读投影 | 无独立事实 |
| 类任务／常态化／组合候选 | 行为观察与复盘 | 候选解释 | 未经人工确认，不成为模板或计划事实 |

### 3.1 “任务组合”不等于 DDD Aggregate

本文使用“组合、归组”表达把 TaskInstance 放入 TaskSet，使用“聚合、聚合根”表达 DDD 一致性边界。TaskSet 是否成为聚合根，取决于成员关系规则，而不是因为它组合了任务。

TaskTemplate 不把全部实例纳入自己的聚合；TaskSet 也不把成员 TaskInstance 纳入自己的聚合。否则，长期实例历史会形成过大的一致性边界，并把分类或组合变化与执行事实不必要地锁在一起。

## 4. 类任务与任务实例

### 4.1 TaskTemplate：可复用的类任务规约

TaskTemplate 当前只保存：

- `template/id`；
- `template/name`；
- `template/default-objective`；
- `template/default-background`；
- `template/default-interruption-policy`；
- `template/default-resumable?`；
- `template/created-at`；
- `template/confirmed-at`。

确定性规则：

1. 当前切片只支持从实际实例中确认模板，不要求也不支持仅凭标题自动建立正式模板。
2. 确认模板至少需要两个不同的 TaskInstance，由人确认它们属于同一类工作。
3. 模板本身不能开始、暂停、恢复或完成，也不拥有 ExecutionSegment 和 TaskResult。
4. 从模板创建实例时复制默认值；之后实例与模板分别修订。
5. 修改模板默认值不追溯改写既有实例。
6. 修改实例的模板归属不改写其 ExecutionSegment、TaskResult 或完成历史。
7. 模板的拆分、合并和历史版本暂不预设，待真实操作出现后决定。

### 4.2 TaskInstance：一次真实工作的稳定身份

| 属性 | 含义 | 约束 |
|---|---|---|
| `task/id` | 这一次任务实例的稳定身份 | 创建后不变；执行、结果和组合均引用它 |
| `task/template-id` | 所属类任务 | 可空；一次性实例不需要模板 |
| `task/title` | 用于识别和展示的简短表述 | 必填；不是模板名称的副本事实 |
| `task/objective` | 这个具体实例要达到什么 | 必填，可模糊描述，可修订 |
| `task/background` | 本次实例的实际背景 | 与模板默认背景区分 |
| `task/incidental?` | 是否偶然、临时、事前未计划出现 | 是来源事实，不等于一次性或低优先级 |
| `task/interruption-policy` | 是否允许执行中打断 | `interruptible / non-interruptible` |
| `task/resumable?` | 打断后是否允许从当前实例接续 | 只有可打断实例需要该属性 |
| `task/created-at` | 实例被记录的时间 | 由系统产生 |

以下分类不存成孤立布尔值，而从关系中投影：

- “是否属于类任务”：是否存在有效 `task/template-id`；
- “是否有时序相关 Task”：是否存在相连的 TaskRelation；
- “是否存在平级任务集”：是否存在包含该实例的 TaskSetMembership；
- “是否属于 ExecutionPlan”：所在 TaskSet 是否具有计划名称与当前目的。

### 4.3 TaskBackground：实例背景与结果观测口径

| 属性 | 含义 |
|---|---|
| `background/constraints` | 当前已知约束，可先使用文本列表 |
| `background/resources` | 可用资源及其引用或说明 |
| `background/target-info` | 已知标的信息，即任务作用对象的当前已知情况 |
| `background/expected-outcome` | 期望得到的结果，不代表结果已经发生 |
| `background/outcome-attributes` | 结果需要观察哪些属性；可包含名称、类型、单位、是否必填 |

背景可以不完整。系统不得因为某些背景未知而阻止偶然 Task 被捕获，但应保留“未知”，而不是让 Agent 或界面补造内容。

### 4.4 偶然性、一次性与类任务

这三个概念不能压成一个布尔值：

- **偶然性**描述来源：实例是否事前未计划、临时出现；
- **一次性**描述当前观察状态：尚未确认第二个同类实例，也没有正式模板；
- **类任务**描述知识层归属：至少两个独立实例已由人确认属于同一 TaskTemplate。

一次性不是实例永久不变的属性。一个偶然出现的 Task 后来可以成为类任务的第一个实例；一个事前计划好的 Task 也可能始终只出现一次。

## 5. 执行事实：ExecutionSegment 与 TaskResult

### 5.1 ExecutionSegment：支持打断与恢复的时间事实

一段 ExecutionSegment 包含：

- `segment/id`；
- `segment/task-id`；
- `segment/started-at`；
- `segment/ended-at`：活跃执行段为空；
- `segment/origin`：`timer / manual`，区分实时计时与补记。

确定性规则：

1. `ended-at` 必须晚于 `started-at`。
2. 同一 TaskInstance 的多个执行段不得重叠。
3. 活跃 ExecutionSegment 只能属于正在执行的 TaskInstance。
4. 暂停、恢复只改变执行段边界，不创建新实例，也不创建模板。
5. TaskInstance 完成后不得新增执行段；当前不隐式 reopen。
6. 组合或修改 TaskSet 不改变 ExecutionSegment 的 `task-id`。
7. 修改模板或实例的模板归属不改变 ExecutionSegment。
8. 补记也是实际时间记录，必须保留来源，不能伪装成实时计时。

是否继续沿用“全局同时至多一个活跃计时”，作为现有系统的技术约束保留，不从 Task 领域额外推导新的并发规则。

### 5.2 TaskResult：实际结果不等于任务完成

当前 TaskResult 是实例内的结果快照，包含：

- `result/values`：按 `background/outcome-attributes` 记录的实际属性值；
- `result/observed-at`：结果被实际观察到的时间；
- `result/recorded-at`：结果被录入系统的时间；
- `result/evidence-refs`：可选的证据引用。

确定性规则：

1. `RecordTaskResult` 与 `CompleteTask` 是两个操作，可以先记录结果再完成，也可以完成后补记。
2. `observed-at` 与 `recorded-at` 不得混用；事后补记不能把录入时间伪装成结果发生时间。
3. 缺失结果保持未知，不由 Agent 或统计程序补造。
4. `completed?` 只表示人确认任务实例已结束，不表示结果达到期望。
5. 当前只保存实例的最新结果快照；若出现多次独立观测、驳回或确认历史，再评估独立 Observation，而不给值对象勉强附加生命周期。

### 5.3 实例的派生时间与展示状态

| 属性 | 来源与含义 |
|---|---|
| `task/first-started-at` | 第一段 ExecutionSegment 的开始时间，派生 |
| `task/last-ended-at` | 最近一个已结束 ExecutionSegment 的终止时间，派生；暂停也会产生该时间 |
| `task/active-duration` | 所有 ExecutionSegment 的持续时间之和，派生 |
| `task/completed?` | 实例是否已完成，来自明确的完成操作 |
| `task/completed-at` | 完成操作发生的时间；可能晚于最后一段实际执行 |

需要同时区分：

- **实际工作时长**：各执行段之和；
- **执行自然跨度**：从第一次开始到最近一次执行终止的时间，包含中间的暂停与等待；
- **任务完成**：人确认该实例已结束；
- **结果达到期望**：实际结果与期望结果的解释，不能由 `completed?` 自动代替。

## 6. 工作组合与顺序

### 6.1 TaskRelation：只记录关系，不偷渡流程

当前最小时序关系包含：

- `relation/id`；
- `relation/from-task-id`；
- `relation/to-task-id`；
- `relation/type = precedes`；
- `relation/created-at`。

```text
from-task-id  --precedes-->  to-task-id
```

确定性规则：

1. 两端必须引用 TaskInstance，不允许引用 TaskTemplate。
2. 不允许实例与自身建立时序关系。
3. 同一 `(from-task-id, to-task-id, type)` 不得重复。
4. 所有 `precedes` 关系均不得形成环，但无环不自动构成执行阻塞。
5. 关系存在不等于自动禁止后一个实例开始；是否构成硬阻塞，当前没有事实依据，暂不固化。
6. 实际执行时间与声明顺序冲突时，保留实际时间并显示冲突，不改写历史。
7. “之前／之后”是同一关系的两个读法，不存两份互相可能矛盾的数据。

其他关系，如依赖、因果、引用、相似、阻塞，等实际操作出现后再增加类型，不预先混入时序关系。

### 6.2 TaskSet 与 TaskSetMembership

TaskSet 只表达“这些 TaskInstance 被当前使用者视为一组”。当前字段为：

- `task-set/id`；
- `task-set/name`：仅作为普通任务集时可为空；
- `task-set/purpose`：仅承担 ExecutionPlan 角色时需要；
- `task-set/created-at`。

TaskSetMembership 至少保存：

- `membership/task-set-id`；
- `membership/task-id`；
- `membership/added-at`。

确定性规则：

1. 成员是平级 TaskInstance，不生成父 Task。
2. 组合不复制实例，不改变 `task/id`。
3. 组合不改变实例的偶然性、模板归属、执行段和实际结果。
4. 新实例可以追加进既有 TaskSet。
5. 同一实例在同一 TaskSet 中至多有一条成员关系。
6. TaskSet 不拥有实例的完成状态。
7. 不对 TaskSet 之间的工时直接求总和，避免同一实例被多个观察口径重复计算。

当前不预设实例必须只属于一个 TaskSet。是否需要“唯一主计划归属”，应由实际统计和排期问题出现后另行决定。

### 6.3 ExecutionPlan 是命名后的实例组合

当一个 TaskSet 具有 `task-set/name` 和 `task-set/purpose` 时，它在当前语境中承担 ExecutionPlan 的角色。`purpose` 表示当前针对的具体目标或预期业务效果。

不另建 `plan` 表，也不制造 `plan/id → task-set/id` 的冗余映射。

当前不为 ExecutionPlan 预设复杂状态机。以下内容由实例与关系派生：

- 包含哪些 TaskInstance；
- 哪些实例有时序关系；
- 当前完成了多少实例；
- 各实例实际投入多少时间；
- 是否仍有未完成实例。

**ExecutionPlan 的全部 TaskInstance 完成，只说明这组任务完成，不自动证明 `task-set/purpose` 所描述的目标或业务效果已经实现。**

## 7. 操作与一致性边界

### 7.1 当前最小操作集合

任务实例与执行事实：

- `CaptureTaskInstance`
- `ReviseTaskInstance`
- `StartTask`
- `PauseTask`
- `ResumeTask`
- `CompleteTask`
- `RecordTaskResult`
- `AddExecutionSegment`

类任务与类型演化：

- `ConfirmTaskTemplate`
- `InstantiateTask`
- `AssignTaskToTemplate`
- `ReviseTaskTemplate`

工作组合与顺序：

- `LinkPrecedence`
- `UnlinkPrecedence`
- `CreateTaskSet`
- `AddTaskToSet`
- `RemoveTaskFromSet`
- `NameExecutionPlan`

行为观察与复盘只提供查询和候选解释，不直接拥有上述写命令。

### 7.2 操作约束

1. `PauseTask` 只适用于正在执行且允许打断的实例。
2. `ResumeTask` 只适用于已暂停且允许接续的实例。
3. `CompleteTask` 前不得仍有活跃 ExecutionSegment。
4. `ConfirmTaskTemplate` 至少需要两个不同的既有实例，并由人确认其同类关系。
5. `InstantiateTask` 创建新 `task/id`，不得覆盖旧实例的执行和结果。
6. `AssignTaskToTemplate` 只改变知识层归属，不改写实例事实。
7. `ReviseTaskTemplate` 不追溯覆盖既有实例的本地背景和执行规则。
8. `LinkPrecedence` 必须在同一写面中检查自环、重复关系和关系图环。

### 7.3 一致性由谁保证

- **TaskInstance 聚合**：负责实例背景、执行规则、完成状态和当前 TaskResult 的一致性。
- **实例执行写面／事务**：负责 Start、Pause、Resume、Complete 与 ExecutionSegment 的原子协调，以及同一实例执行段不重叠。执行段可以独立存储，不必全部装入 TaskInstance 聚合。
- **TaskTemplate 聚合**：只负责模板默认值和规约，不负责锁定全部实例。
- **TaskSet 聚合**：负责同一集合内成员关系唯一，不负责成员实例状态。
- **关系写面**：负责 `precedes` 图的无环检查；单个 TaskRelation 自身无法独立保证图不变量。
- **全局活跃计时约束**：若保留，由现有计时写面或数据库约束保证，不伪装成 TaskSet 的规则。

### 7.4 打断与接续

“可打断”与“可接续”必须分开：

| 可打断 | 可接续 | 允许的行为 |
|---|---|---|
| 否 | 不适用 | 开始后在完成前不能暂停 |
| 是 | 是 | 可暂停，之后可在同一实例上追加新执行段 |
| 是 | 否 | 可中断，但不能从当前进度恢复；需要终止后重新开始或另建后续实例 |

可打断但不可接续时的具体终止操作仍待真实使用确认，当前不隐式创建新实例。

## 8. 行为观察与复盘

柳比雪夫时间记录法对当前模型的启发，不是增加一个工时报表，而是把 ExecutionSegment 当作**行为在时间片上的原始表达**。

TaskInstance 回答“这一次做了什么”，ExecutionSegment 回答“时间实际上怎样被使用”，TaskTemplate 回答“这些实例被确认属于哪一类工作”。三者分离后，频次、周期、投入与结果才不会混用分析单位。

### 8.1 类任务识别

当前稳定分类不再是独立的 `activity-key`，而是 TaskInstance 到 TaskTemplate 的归属。

- 第一个实例出现时，可以只是一次性 Task，不强制预测未来类型；
- 第二个独立同类实例出现时，系统或人可以形成类任务候选；
- 只有经人确认后，才创建 TaskTemplate 并关联既有实例；
- 标题相似、Agent 建议或共同出现只能产生候选，不能自动成为类任务事实；
- 当前统计按当前模板归属解释历史，不预建复杂分类版本系统。

### 8.2 频次、周期、投入与中断必须分开

| 观测 | 计算口径 |
|---|---|
| 类任务实例频次 | 时间窗口内，同一 TaskTemplate 下不同 TaskInstance 的数量；不按执行段计数 |
| 类任务周期间隔 | 同一 TaskTemplate 下，不同 TaskInstance 的 `first-started-at` 之间的间隔序列 |
| 实例实际投入 | 单个 TaskInstance 的 ExecutionSegment 时长总和 |
| 类任务投入分布 | 同类各实例实际投入的总量及分布；不预设所有实例必须等长 |
| 中断情况 | 同一实例的暂停、恢复及执行段边界，不计作新的实例发生 |
| 一次性任务投入 | 未归属模板实例的执行段时长；不计算行为周期 |

一个实例暂停并恢复五次，是多个 ExecutionSegment，不是五个实例，也不构成类任务的两次独立发生。

跨实例的执行段时长求和称为“记录的任务执行时长”。若允许跨实例补记重叠时间，它不必然等于不重复的个人自然时间。

### 8.3 三类行动线索，而非自动结论

- **周期性常态化候选**：同类实例反复出现，且间隔、时长和结果相对稳定。当前只提示候选，不自动生成周期计划。
- **控制频次与时长候选**：某类实例反复挤占时间，而实际结果不足以支持当前投入。投入高本身不等于浪费，必须结合 TaskResult 判断。
- **组合候选**：若干实例反复以时序关系或同一 TaskSet 共同出现，可以组合为 ExecutionPlan。组合依据是可观察关系，不是标题相似度。

“朝什么方向前进”是由时间分布、实例目标、TaskResult 和行为组合共同支持的**解释性假设**，不是时间序列自动产生的事实，也不需要先创建 Goal 实体。

### 8.4 与业务动力学和预测性需求测试的接口

行为时间序列只能说明“发生了什么、投入在哪里”；TaskResult 说明“观察到了什么结果”。二者结合，可以为业务动力学建模与预测性需求测试提供事实输入，但不能单独证明因果：

- 不把“投入更多时间”解释为“产生更多价值”；
- 不把“频次更高”解释为“更应该常态化”；
- 不把“同时发生”解释为“存在业务因果关系”；
- 不用 Agent 的补全替代缺失的真实结果；
- 不用任务完成率替代 ExecutionPlan 的目的达成情况。

当前只增加这些只读投影和候选解释，不新增行为分析聚合、预测引擎或自动决策器。

## 9. 当前状态与 Kanban 投影

TaskInstance 的展示状态由少量事实派生：

| 展示状态 | 判定 |
|---|---|
| 未开始 | 没有执行段，且未完成 |
| 执行中 | 存在活跃执行段 |
| 已暂停 | 没有活跃执行段，曾经执行，未完成且允许接续 |
| 已完成 | `completed? = true` |
| 待处理中断 | 可打断但不允许接续，且已中断未完成 |

Kanban 可以把“已暂停”并入进行中，也可以独立成列；这只是显示选择，不产生新的任务事实。

### Kanban 卡片最小信息

- TaskInstance 标题与任务目标；
- 是否偶然；
- 可选的 TaskTemplate 归属；
- 是否可打断、是否可接续；
- 当前执行状态；
- 实际工作时长；
- 是否存在时序关系；
- 所属 TaskSet／ExecutionPlan；
- 是否已记录实际结果。

拖拽卡片只能转化为明确的 Task 操作，不直接改写一个脱离领域规则的 `kanban-column` 字段。Kanban 读取实例与工作组合，不成为独立业务子域。

## 10. 一个最小走查例子

### 10.1 一次性实例与 ExecutionPlan

1. 捕获 Task A：“修复首次启动无示例数据”，标记为偶然、可打断、可接续。
2. 捕获 Task B：“修正空状态文案”，标记为偶然、不可打断。
3. 捕获 Task C：“走查移动端首屏”，标记为偶然、可打断、可接续。
4. 建立 `A precedes C`、`B precedes C`。
5. 将 A、B、C 加入平级 TaskSet，并命名为 ExecutionPlan“降低首次理解障碍”。
6. A 执行 30 分钟后暂停，隔天恢复并再执行 25 分钟；A 的实际工作时长为 55 分钟，而不是包含隔夜的跨度。
7. B 执行中不提供暂停操作。
8. C 记录实际结果属性，例如“发现的问题数”“是否完成关键路径走查”“证据链接”，并分别保存观察时间和录入时间。
9. Kanban 显示三个实例的当前状态、顺序关系、计划归属和投入时间。
10. 三个实例全部完成后，ExecutionPlan 仍不自动宣称“降低首次理解障碍”已经实现。

### 10.2 第二个实例促成类任务

1. 捕获 Task R1：“产品使用复盘”，此时没有模板，也不计算行为周期。
2. 后续捕获另一个独立实例 R2：“产品使用复盘”。人确认 R1 与 R2 属于同一类工作，创建 TaskTemplate，并把两个实例关联到该模板。
3. R1 的多个暂停／恢复段仍只属于 R1，不被当作第二次独立发生。
4. 从模板创建 R3 时复制默认背景和结果观测口径，但 R3 获得新的 `task/id`。
5. 修改模板默认结果口径，不改写 R1、R2 已保存的背景和 TaskResult。
6. 系统按不同实例计算类任务频次，按实例首次开始时间形成周期间隔序列，按执行段计算投入与中断，并比较各实例结果。

这个走查不需要 Goal、Advice、Decision、Iteration 或知识网络即可验证当前核心价值。

## 11. 最小测试清单

### 任务实例与背景

- [ ] 没有上层 Goal 和 TaskTemplate 也能捕获 TaskInstance。
- [ ] 偶然实例可以只有目标和必要背景，未知信息保持未知。
- [ ] 期望结果与实际结果分别保存。
- [ ] 实例的偶然性不会因加入 ExecutionPlan 或关联模板而改变。
- [ ] 一次性不是永久布尔状态，第二个同类实例出现后可以被纳入模板。

### 类任务与类型演化

- [ ] 只有一个实例时，不能通过 `ConfirmTaskTemplate` 确认从实例涌现的模板。
- [ ] 同一实例的两个 ExecutionSegment 不能冒充两个独立实例。
- [ ] 两个不同实例经人确认后可以建立 TaskTemplate 并保留各自历史。
- [ ] 模板没有 Start、Pause、Resume、Complete 操作，也不拥有执行段和结果。
- [ ] `InstantiateTask` 创建新实例身份，不覆盖旧实例。
- [ ] 修改模板默认值不追溯改写既有实例。
- [ ] 修改实例模板归属不改变任何 ExecutionSegment 和 TaskResult。

### 执行时间与结果

- [ ] `ended-at > started-at`。
- [ ] 同一实例的执行段不能重叠。
- [ ] 不可打断实例不能暂停。
- [ ] 可打断且可接续实例能在暂停后追加新执行段。
- [ ] 可打断但不可接续实例不能执行 Resume。
- [ ] 多段执行的实际工作时长等于各段之和，而非首尾跨度。
- [ ] 有活跃执行段的实例不能直接完成。
- [ ] 完成后的实例不能新增执行段。
- [ ] `observed-at` 与 `recorded-at` 分别保存，补记不伪装成实时观察。
- [ ] 实例完成不自动证明结果达到期望。

### 关系与组合

- [ ] 时序关系能回答“哪个实例先于哪个实例”，而非只返回布尔值。
- [ ] 自环、重复关系和 `precedes` 关系环被拒绝。
- [ ] 时序关系存在时，不自动阻止后一个实例开始。
- [ ] TaskRelation 和 TaskSetMembership 只能引用 TaskInstance，不能引用 TaskTemplate。
- [ ] 组合为 TaskSet 后，原实例身份、模板归属、执行段和结果不变。
- [ ] 同一实例在同一 TaskSet 中不会重复成为成员。
- [ ] ExecutionPlan 的任务完成不自动证明其预期业务效果成立。

### 行为观察

- [ ] 同一实例的多个执行段不会被重复计算为多次实例发生。
- [ ] 类任务频次按同一模板下不同实例计算。
- [ ] 类任务周期按不同实例的首次开始时间间隔计算。
- [ ] 中断分析使用执行段边界，实例频次使用实例身份，二者不混用。
- [ ] 一次性实例可以统计投入，但不产生行为周期。
- [ ] 跨实例重叠补记不会被宣称为不重复的个人自然时间。
- [ ] 高投入、高频次不会在没有 TaskResult 的情况下被自动判定为高价值或浪费。
- [ ] 组合候选来自可观察的时序关系或 TaskSet，而非仅由相似标题自动生成。

### 投影

- [ ] Kanban 状态能由 TaskInstance 与 ExecutionSegment 重建。
- [ ] 模板归属、时序关系、所属任务集等分类来自关系查询，不与关系记录双写。
- [ ] 跨 TaskSet 的工时不会被直接累加为无重复的总工时。

## 12. 对 uix-todo 的最小演进

| 现有能力 | 当前处理 |
|---|---|
| `loom.task` | 以 TaskInstance 为明确含义，扩展目标、背景、模板引用、打断与完成规则 |
| `loom.time` / TimeEntry | 作为 ExecutionSegment 的现有承载，保留起止时间约束 |
| `loom.schema` | 增加当前已明确的模板、实例、关系和组合词汇，不加入长期候选对象 |
| `loom.db` | 为执行时间、成员唯一、关系自环等可数据库兜底约束提供检查 |
| Task CRUD | 逐步替换为语义明确的实例操作，不先建完整命令事件框架 |
| 统计 | 只读查询，统计实例、执行时长与当前模板归属，不建 Statistics 聚合 |
| ADR | 只记录当前真实取舍；长期候选不批量创建 ADR |

当前优先顺序只有四项：

1. TaskInstance 最小属性、背景、结果与执行段；
2. 平级 TaskSet、TaskRelation、ExecutionPlan 和 Kanban 投影；
3. 第二个独立实例确认 TaskTemplate、实例创建与模板归属；
4. 类任务行为时间序列及候选解释。

类任务识别是核心领域能力，但实现仍应晚于实例事实稳定。常态化、频次控制和组合建议必须在积累到可辨识的实例记录后再验证。

## 13. 当前只保留的待验证问题

1. “可打断但不可接续”的实际操作，是重新开始同一实例，还是终止后创建后续实例？
2. 是否存在必须复用同一 TaskInstance 身份跨多轮执行的场景；若存在，是否才需要 TaskOccurrence？
3. TaskSet 是否允许一个实例同时属于多个集合；若允许，哪些统计口径需要避免重复？
4. 时序关系何时只是观察，何时会升级为硬依赖或阻塞？
5. 哪些结果属性需要结构化，何时需要保留多次独立 Observation，而不仅是当前结果快照？
6. ExecutionPlan 何时才需要自己的生命周期，而不是仅作为 TaskSet 的当前解释？
7. TaskTemplate 在真实使用中如何拆分、合并和改名；何时需要保留模板归属与默认规约的历史版本？
8. 跨实例补记重叠时间时，应如何分别呈现记录任务时长与不重复个人自然时间？

这些问题由后续真实操作回答，不在当前设计阶段提前封闭。
