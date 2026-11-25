# Clojure DDD 实践指南

> 读者画像：type-driven DDD 实践者，正用任务聚合 Kanban demo 入门 Clojure 全栈。
> 核心立场：DDD 的战略层语言无关；战术层在 Clojure 里从「类型即不变量」换成「数据 + 契约 + 写路径纪律 + 事务 + 测试」。
> 当前领域基线见 `任务聚合Kanban系统-DDD领域设计-v0.2.md`；贯穿式领域词汇、子域划分和 ADR 写法见 `DDD建模示例.md`。

## 一、总纲：三层各自靠什么

| 层 | 内容 | Clojure 里的支撑 |
|---|---|---|
| 战略设计 | 子域、限界上下文、通用语言、上下文映射 | 变化原因分析 + namespace 纪律 + schema registry |
| 战术设计 | 实体、值对象、聚合、仓储、领域事件 | map + malli + 写函数面 + 事务 |
| 验证哲学 | 非法状态不可表示 | Clojure 数据可以构造出非法形状，因此必须在构造、写入、API 和数据库边界拒绝 |

**类型驱动经验仍然有用，但不能假设 map 一旦存在就合法。** 合法性由明确边界建立，而不是由命名空间或 docstring 自动产生。

## 二、战略层落点

### 2.1 子域先于代码模块

当前系统划分为：

| 子域 | 类型 | 主要事实／产物 |
|---|---|---|
| 任务实例与执行事实 | 支撑 | TaskInstance、TaskBackground、ExecutionSegment、TaskResult |
| 类任务与类型演化 | 核心 | TaskTemplate、实例模板归属 |
| 工作组合与顺序 | 支撑 | TaskRelation、TaskSet、Membership、ExecutionPlan 角色 |
| 行为观察与复盘 | 核心 | 行为时间序列、候选解释 |

核心／支撑按业务差异化价值划分，不按技术难度或表数量划分。当前实现顺序仍然是实例事实 → 组合 → 模板 → 行为观察，因为核心分析必须建立在稳定事实之上。

### 2.2 子域、限界上下文、namespace 不是同一个概念

- **子域**：业务问题空间中的一组变化原因与规则。
- **限界上下文**：某套模型和通用语言保持一致的解决方案边界。
- **namespace**：Clojure 代码组织与依赖边界。

小型单体可以让多个子域暂时共享一个部署单元和数据库。`loom.task`、`loom.time` 是当前写面划分，不意味着四个子域必须机械变成四个服务。只有术语含义、事务规则、团队或部署需求真正分裂时，才进一步拆上下文。

### 2.3 通用语言与上下文映射

- **通用语言 → namespaced keyword + 一份 registry**：`:task/id`、`:segment/ended-at`、`:template/name` 全局无二义。
- **共享内核 → `loom.schema`**：共享数据结构，不共享所有业务规则。
- **防腐层（ACL）→ 映射函数或 adapter ns**：DB 行、JSON、外部数据形状在这里终止。
- **发布语言 → malli / JSON Schema / OpenAPI**：对外协议可以生成，但领域词汇仍是源头。
- **开放主机服务 → Reitit 路由数据**：请求、响应和错误是显式协议。

## 三、战术模式映射

### 3.1 值对象 = 不可变 map + schema

TaskBackground 与 TaskResult 都属于实例，不拥有独立生命周期：

```clojure
:background/attribute
[:map {:closed true}
 [:attribute/name [:string {:min 1}]]
 [:attribute/type {:optional true} :keyword]
 [:attribute/unit {:optional true} :string]
 [:attribute/required? {:optional true} :boolean]]
```

- 相等性由不可变数据的值语义免费获得。
- 背景允许未知，但不能由 Agent 或界面补造。
- TaskResult 当前是最新快照；出现多次独立观测生命周期后再评估 Observation，不给值对象勉强加状态机。

### 3.2 实体 = 稳定 ID + 显式写命令

TaskInstance 的身份在执行、归组、模板归属变化时保持不变。生命周期只能通过写函数改变：

```clojure
(defn complete-task!
  "示意：实例执行写面中的 CompleteTask，不是直接 assoc 一个展示状态。"
  [db task-id]
  (jdbc/with-transaction [tx db]
    (let [task (get-task tx task-id)
          active (get-active-segment tx task-id)]
      (when (nil? task)
        (throw (ex-info "任务不存在" {:type :task/not-found})))
      (when active
        (throw (ex-info "仍有活跃执行段" {:type :task/active-segment})))
      (mark-completed! tx task-id (now-ms)))))
```

关键不是照抄函数，而是理解：

- `CompleteTask` 与 `RecordTaskResult` 是两个操作。
- 展示状态由完成事实与执行段派生，不直接维护任意 `kanban-column`。
- 所有写操作都必须经过同一写面；调用方散落 `(assoc task :task/status ...)` 会绕过规则。

### 3.3 聚合 = 一致性边界，不是对象图

| 当前对象 | 一致性职责 | 明确不负责 |
|---|---|---|
| TaskInstance 聚合 | 背景、执行规则、完成事实、当前结果快照 | 锁定整个模板历史或所有任务集 |
| TaskTemplate 聚合 | 类任务规约与默认值 | Start／Pause／Complete，或拥有实例执行事实 |
| TaskSet 聚合 | 集合内成员唯一 | 成员实例状态、跨集合工时不重复求和 |
| 实例执行写面／事务 | Start／Pause／Resume／Complete 与段边界原子协调，同实例段不重叠 | 把全部执行段永久装进内存聚合 |
| 关系写面／事务 | 自环、重复、关系图无环 | 把无环误当成硬阻塞 |
| 全局计时写面（若保留） | 全局至多一个活跃段 | 伪装成 TaskSet 领域规则 |

小聚合优先，跨聚合用 ID 引用。**TaskSet 组合任务，不代表它应该在 DDD 上聚合拥有这些任务。**

### 3.4 不变量的四种强制强度（L0–L3）

| 级别 | 机制 | 何时开 | 当前例子 |
|---|---|---|---|
| L0 | 文档、通用语言、注释 | 永远 | 完成不等于结果达到期望 |
| L1 | malli instrumentation | dev／CI | 写函数入参与返回形状 |
| L2 | 写函数显式校验 + 事务 | **生产常开** | 执行段不重叠、非法 Pause／Resume、关系图无环 |
| L3 | CHECK / UNIQUE / NOT NULL / FK | 永远 | `end > start`、成员唯一、关系不自环、全局活跃段唯一 |

原则：

- L2 表达领域规则，L3 是基础设施最后一道墙。
- 能用声明式 DDL 表达的就兜底，但不能假装所有规则都能用单行 CHECK 表达。
- 同实例段不重叠、Complete 时无活跃段、关系图无环都依赖多行或多表状态，必须以事务写面为主。
- 事务冲突与数据库约束异常要转成可读的领域错误，而不是把 SQL 异常直接泄露给前端。

### 3.5 仓储 = 函数面起步，协议留给多实现

- 默认形态：`get-task`、`list-tasks`、`capture-task!` 等函数，第一个参数传 db／连接。
- 确有第二种实现时才使用 `defprotocol`；不要为假想内存仓储提前抽象。
- **DB 行 ≠ 领域对象**：kebab builder 只转换 key 形态，不负责 UUID、枚举、EDN 值对象和完成事实的语义转换。
- 映射函数保持纯、可独立测试；SQL 不泄漏到 API 和前端。

### 3.6 工厂 = 智能构造函数

`(capture-task! db attrs)` 或纯 `make-task` 应先校验，再返回合法实例：

- 标题与目标按当前契约校验。
- 偶然性、打断策略和接续规则同时建立。
- 创建后 ID 不变。
- 从模板实例化时复制默认值，之后模板与实例分别修订。

Agent、测试种子和 HTTP 入口都必须经过同一工厂／写面，不能另开后门。

### 3.7 领域服务、应用服务与读投影

- **领域服务**：承载跨聚合且不属于单一实体的纯业务规则；优先纯函数。
- **应用服务／命令处理器**：加载、事务、调用写面、持久化和错误转换。
- **读投影**：Kanban、行为时间序列、计划进度和前端 app-db。

读投影没有另一套事实：

```text
TaskInstance + ExecutionSegment + TaskResult
                  │
                  ├── GetKanban
                  ├── GetBehaviorTimeSeries
                  └── GetExecutionPlanProgress
```

候选解释由人确认后，应用层再调用模板或组合写面；行为观察子域不直接修改其他子域表。

### 3.8 领域事件可选，不等于必须事件溯源

事件可以表示为 `:event/type`、发生时刻、聚合 ID 和载荷的 map。但当前切片没有要求完整事件溯源：

- 不为了“Clojure 很适合不可变事件”就引入事件框架。
- ExecutionSegment 是当前明确要求保存的时间事实，不代表所有字段都必须事件化。
- 只有出现审计、重放、多订阅者或历史重建需求时，再单独评估事件存储。

### 3.9 规格模式 = 高阶函数或 multimethod

需要可替换规则时，封闭集合优先传函数，开放扩展才考虑 multimethod。例如结果属性校验可以按属性类型派发；不要为简单条件表达式建立策略类层级。

### 3.10 存储层工具谱系

| 层 | 工具 | 用途 |
|---|---|---|
| 基板 | next.jdbc | JDBC 执行、事务、结果集 |
| SQL 即数据 | HoneySQL 2 | 组合查询、动态 WHERE、INSERT／UPDATE |
| SQL 外部化 | hugsql | 确有非开发者 review SQL 的需求时再选 |
| 逃生舱 | next.jdbc 裸 SQL | HoneySQL 难以表达的少数语句 |

默认 next.jdbc + HoneySQL 即可，不再引入薄 ORM。不可变 map 没有 Hibernate 式脏检查和对象身份跟踪需求；显式映射函数更便宜、更透明。

常用纪律：

- 动态 WHERE 的 SQL 片段与参数成对构造。
- 动态 UPDATE 同时生成 SET 列清单和参数向量。
- 事务使用 `jdbc/with-transaction`，异常触发回滚；注意体返回值的提交语义。
- 大结果集使用 `jdbc/plan` + transduce，避免无谓全量加载。
- 参数永远作为参数传入，不拼接用户输入。

### 3.11 垂直切片参考：从 registry 到写面

**① 领域模型**

```clojure
:task/instance
[:and
 [:map {:closed true}
  [:task/id :uuid]
  [:task/template-id {:optional true} [:maybe :template/id]]
  [:task/title [:string {:min 1 :max 120}]]
  [:task/objective [:string {:min 1}]]
  [:task/background :task/background]
  [:task/incidental? :boolean]
  [:task/interruption-policy :task/interruption-policy]
  [:task/resumable? {:optional true} :boolean]
  [:task/created-at :time/epoch-ms]
  [:task/completed? :boolean]
  [:task/completed-at {:optional true} :time/epoch-ms]
  [:task/result {:optional true} :task/result]]
 [:fn valid-completion?]
 [:fn valid-interruption-policy?]]
```

完整可执行定义以 `src/loom/schema.clj` 为准。量纲是 schema 元数据，不进入 DB。

**② 存储模型**

```sql
CREATE TABLE execution_segments (
  id         TEXT PRIMARY KEY,
  task_id    TEXT NOT NULL REFERENCES tasks(id),
  started_at INTEGER NOT NULL,
  ended_at   INTEGER,
  origin     TEXT NOT NULL CHECK (origin IN ('timer','manual')),
  CHECK (ended_at IS NULL OR ended_at > started_at)
);

CREATE UNIQUE INDEX uniq_active_timer
ON execution_segments((1))
WHERE ended_at IS NULL;
```

常量 `(1)` 让所有活跃行共享同一个索引键；若直接索引 `ended_at`，SQLite 会让多个 `NULL` 互不冲突，无法保证全局单活跃。

完整 DDL 以 `src/loom/db.clj` 为准。ExecutionPlan 没有独立 `plans` 表；模板默认值和实例背景等值对象可在映射层序列化为 EDN TEXT，读取时使用 `clojure.edn/read-string`，不要使用可执行代码的 `clojure.core/read-string`。

**③ 映射**

```clojure
(defn row->segment [r]
  {:segment/id         (parse-uuid (:id r))
   :segment/task-id    (parse-uuid (:task-id r))
   :segment/started-at (:started-at r)
   :segment/ended-at   (:ended-at r)
   :segment/origin     (keyword "segment.origin" (:origin r))})
```

两个方向都必须显式转换。UUID、枚举、布尔、EDN 和时间戳的存储表示不能泄漏为第二套领域语言。

**④ 写函数与查询**

- Start／Pause／Resume／Complete 在 `loom.time` 的事务写面协调实例与执行段。
- Capture／Revise／RecordResult 在 `loom.task` 维护实例事实。
- `list-tasks` 和 `list-segments` 返回领域 map；Kanban 查询继续组合这些事实，而不是读取卡片列字段。

### 3.12 schema 与数据层的结合纪律

| 不变量 | L2 | L3 |
|---|---|---|
| 标题 1–120 字符 | malli / 工厂 | `NOT NULL` + 长度 CHECK |
| 打断与接续策略组合 | Pause／Resume 检查 | 策略 + resumable CHECK |
| `end > start` | 写入前校验 | CHECK |
| 全局至多一个活跃计时（若保留） | 事务内冲突检查 | 部分唯一索引 |
| 同实例执行段不重叠 | 事务内范围查询 | 当前不伪造简单 DDL 保证 |
| 完成后不得新增执行段 | Start／AddSegment 检查 | 无简单跨行 CHECK，L2 必须存在 |
| 关系不自环、不重复 | LinkPrecedence 检查 | CHECK + UNIQUE |
| 关系图无环 | 同事务图检查 | 图遍历不能只靠单行约束 |
| 同实例同集合成员唯一 | AddTaskToSet 检查 | 复合 PRIMARY KEY |

**DDL 生成器三档判据**

- 结构可生成：类型映射、可空性、简单 enum CHECK。
- 变迁半生成：目标结构可推导，回填与迁移路径必须表达人的意图。
- 访问不可生成：索引和查询来自用例访问模式，不存在于纯领域模型中。

`CREATE TABLE IF NOT EXISTS` 只负责空库初始化，不是迁移。已有开发库需要手写迁移或明确重置，不能靠重复执行 DDL 假装完成升级。

## 四、malli 作为契约层

1. **registry 一份词汇表**：新增对象先登记，不在多个命名空间复制 shape。
2. **跨字段规则用 `:fn`**：例如完成事实与完成时间、打断策略与 resumable 的组合。
3. **跨行规则不要硬塞进单值 schema**：段不重叠和图无环需要数据库上下文，放事务写面。
4. **错误给人看**：API 使用 `m/explain` / humanize，领域冲突保留稳定 `:type`。
5. **生成器派生**：合法值生成器减少重复，非法输入仍需负空间测试。
6. **发布语言**：需要时导出 JSON Schema／OpenAPI，不让前端手写另一份不兼容契约。

## 五、测试策略

| 测试类型 | 当前例子 |
|---|---|
| 业务示例测试 | A 执行 30 分钟、暂停、隔天恢复 25 分钟，实际投入为 55 分钟 |
| 状态迁移测试 | 不可打断不能 Pause；不可接续不能 Resume；活跃段存在不能 Complete |
| 属性测试 | 任意合法执行段都满足 `end > start`；任意重叠写入都被拒绝 |
| roundtrip 测试 | UUID、策略、背景、结果时间和执行段读写无损 |
| 投影重建测试 | 同一批事实重复生成相同 Kanban；暂停不会被算成新实例 |
| 契约测试 | 400／404／409 语义稳定，响应 coercion 能拦住缺字段 |
| 后续模板测试 | 两个不同实例才能确认模板；默认值修改不追溯 |
| 后续关系测试 | 自环、重复、图环被拒绝，但 `precedes` 不自动阻塞开始 |

属性测试不能替代业务可读示例，示例也不能替代随机负空间。两者并存。

## 六、反模式清单

1. **裸 map 裸传**：无 schema 的 map 跨层流动。
2. **`assoc`／`update-in` 散落**：调用方绕过写函数改变完成或执行状态。
3. **关键字不带命名空间**：`:status`、`:name` 跨上下文撞名。
4. **schema 只验入不验出**：错误 shape 照样出厂。
5. **DB 行直出领域模型**：存储格式泄漏成 API 格式。
6. **过早协议化**：没有第二种实现就先 `defprotocol`。
7. **namespace 加载副作用**：instrumentation 或服务器启动塞进 require 过程。
8. **把展示状态当事实**：持久化 `kanban-column` 或每秒递增的 `elapsed`，再反推执行历史。
9. **模板拥有全部实例**：分类修改锁死长期执行历史。
10. **组合变成父 Task**：归组后复制实例或改变实例身份。
11. **统计自动变事实**：高频、高投入或 Agent 建议未经确认就写回模板或计划。
12. **完成冒充有效**：任务完成率被当成结果或 ExecutionPlan 目的达成率。
13. **DDL 伪迁移**：依赖 `IF NOT EXISTS` 升级已有数据库。

## 七、模型演化纪律

每次领域变更走完整环：

1. **改通用语言**：先更新 DDD 文档与 registry。
2. **改不变量**：L2 写函数和可表达的 L3 约束同步。
3. **改映射与迁移**：明确旧数据如何到达新结构。
4. **改投影**：API、Kanban、行为观察和前端同步。
5. **补测试**：保留业务走查，增加负空间和迁移断言。
6. **记录真实取舍**：需要时新增 ADR；已推送 ADR 不被悄悄改写。

当前只有出现以下事实时才重新扩大模型：

- 同一实例身份必须跨多轮执行 → 评估 TaskOccurrence。
- 多次独立观测、驳回或确认历史 → 评估 Observation。
- ExecutionPlan 出现独立生命周期 → 评估独立计划聚合。
- 时序关系产生真实硬阻塞需求 → 增加明确关系类型或阻塞规则。

## 八、与 loom-mesh 的咬合点

- **聚合写路径 = 干预作用面**：外部注入或修复领域数据也必须经过同一写函数与 schema。
- **投影思路可复用**：事实 → 读模型 → app-db 与日志 → UI 同构，但不因此预设事件溯源。
- **registry 即协议词汇表**：需要插件协议时可导出 JSON Schema，避免协议与领域各说一套话。

## 九、项目内阅读顺序与外部资源

### 项目内

1. `任务聚合Kanban系统-DDD领域设计-v0.2.md`：对象、规则与切片。
2. `DDD建模示例.md`：领域词汇、子域和两个 ADR 示例。
3. `domain-analysis.md`：对象筛选与 Clojure 落点工作表。
4. `decisions.md`：真正待决的所有者 ADR。
5. `Clojure全栈DDD学习路径-任务待办管理demo.md`：阶段任务卡。

### 外部

| 资源 | 定位 |
|---|---|
| JUXT《Simple, Tactical Domain Driven Design in Clojure》 | Clojure 战术 DDD 参考 |
| 《Learning Domain-Driven Design》 | 战略设计主参考 |
| 《Domain Modeling Made Functional》 | 类型驱动建模参考 |
| Eric Evans《Domain-Driven Design Reference》 | 战术模式速查 |
| re-frame / reitit / malli / next.jdbc 官方文档 | 各阶段 API 与架构说明 |
