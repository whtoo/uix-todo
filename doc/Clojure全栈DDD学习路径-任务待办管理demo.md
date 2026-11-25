# Clojure 全栈 DDD 学习路径：任务聚合 Kanban demo

> 目标读者：TS / type-driven DDD 背景的 solo 开发者。全程六个阶段，每阶段只引入一个新设施，验收过关再进下一阶段。
> 当前领域基线：`doc/任务聚合Kanban系统-DDD领域设计-v0.2.md`。本文负责任务卡与验收，不另造一套领域模型。
> 前端参考：`frontend-demo/迹_纯HTML_JS工程/` 只用于理解信息架构和交互，**其 localStorage 数据形状与硬编码统计不是实现契约**。
> 建模教学：`doc/DDD建模示例.md` 用同一组实例演示领域词汇、子域划分和两个完整 ADR。

## 0. 总纲

### 当前要验证的能力

持续捕获实际 TaskInstance，记录目标、背景、执行时间与结果；第二个独立同类实例出现时确认 TaskTemplate；按需建立时序关系和平级 TaskSet，并从事实形成 Kanban 与行为观察。

当前不建立 Goal、Advice、Decision、Iteration、独立 Observation、全局 MasterPlan 或完整事件溯源。不要为了“以后可能用到”提前加表或聚合。

### 文档优先级

1. DDD v0.2：当前对象、规则、操作和演进顺序。
2. `doc/decisions.md`：所有者真实决策；两个 `ADR-EX` 只示范写法。
3. 本文：环境与实现任务卡。
4. `doc/阶段技术指引.md`：已撞过的工具链和 SQLite 坑。

发现文档互相矛盾时，先停下修正文档，不要选择最方便的一份直接写代码。

### 训练纪律

- 每阶段只加一个新设施，验收全绿再进下一阶段。
- 全程 REPL-first：任何“我不确定行为”的问题，先在 REPL 里实验，再写进代码。
- 决策必须写进 ADR，并能回答选项后果、验证方法和未来推翻条件。
- 所有者实现 `loom.task`、`loom.time` 和 `user.clj` 的业务函数体；代理负责依赖门、脚手架、技术文档和机械验证。
- 卡壳超过 45 分钟，走附录 B。

### 领域种子：四个子域，不是四个部署单元

| 子域 | 类型 | 主要对象 | 关键规则 |
|---|---|---|---|
| 任务实例与执行事实 | 支撑 | TaskInstance、TaskBackground、ExecutionSegment、TaskResult | 实例身份稳定；同实例执行段不重叠；完成不等于结果有效 |
| 类任务与类型演化 | **核心** | TaskTemplate、实例模板归属 | 至少两个不同实例经人确认；模板默认值不追溯 |
| 工作组合与顺序 | 支撑 | TaskRelation、TaskSet、Membership、ExecutionPlan 角色 | 平级组合不复制实例；`precedes` 无环但默认不阻塞 |
| 行为观察与复盘 | **核心** | 行为时间序列、各类候选解释 | 只读计算；候选经人确认后才写回其他子域 |

- Task 默认指 **TaskInstance**，Timer 只是活跃 ExecutionSegment 的交互说法。
- TaskSet 的“组合”不是 DDD Aggregate 的同义词。
- `loom.task` 与 `loom.time` 是当前写面边界，不代表已经完成战略上的限界上下文拆分。

### 心智映射（TS → Clojure）

| TS 概念 | Clojure 对应 | 关键差异 |
|---|---|---|
| interface / type | map + namespaced keyword + malli schema | 结构化而非名义化；schema 是一等值 |
| ORM（Prisma/Knex） | next.jdbc + 手写 SQL / HoneySQL | 查询显式，无隐藏脏检查 |
| zod 校验请求体 | reitit-malli coercion | 声明在路由数据上，进出双向校验 |
| 模块边界 | namespace + 命名纪律 | 没有访问控制替你守门 |
| vitest/jest + supertest | kaocha + test.check + ring mock | 示例测试与属性测试并存 |
| dayjs/date-fns | java.time 或 juxt/tick | 存储时间戳与展示格式化分离 |
| tsc | clj-kondo + malli + 边界测试 | 静态层是工具，不是完整编译器替身 |

### 环境清单

- JDK 21+、Clojure CLI、Node 20+（进入前端阶段时）、git。
- 编辑器二选一：Calva 或 Cursive。

---

## 阶段 1：REPL 与环境（0.5 天）

**目标**：让“代码即数据、REPL 即工作台”变成肌肉记忆。

**任务卡**

1. 安装 JDK 21、Clojure CLI、Calva。
2. `clj -M -e "(println :hello)"` 确认 CLI 可用。
3. 确认项目 `deps.edn` 使用当前 Clojure 版本。
4. Calva jack-in，练 eval current form、eval top-level form、eval file、load file、`in-ns`。
5. 在 `src/user.clj` 修改 `greet`，只 eval 这一个 defn，确认不重启 REPL 即生效。

**验收标准**

- 全程靠逐 form 求值推进，没有重启 REPL。
- 能解释 `user>` prompt 与 `in-ns` 的关系。
- 30 秒内完成“改一个函数 → 生效 → 调用验证”。

**已知坑**

- 裸 `clj` 必须在含 `deps.edn` 的项目根启动。
- 保存文件不等于 eval；REPL 不监听文件系统。

---

## 阶段 2：HTTP 后端骨架（0.5–1 天）

**目标**：最小 Ring + Reitit + http-kit 服务，理解 handler、路由和中间件都是数据接线。

**任务卡**

1. 启用 ring-core、reitit、reitit-ring、http-kit、muuntaja。
2. GET `/health` 返回 `{:status "ok"}`。
3. 在 REPL 中通过 `app.main/start!`、`stop!` 管理服务，理解 `#'app` 的 var 间接引用。
4. POST `/echo` 原样返回 JSON body。

**验收标准**

- `curl localhost:3080/health` 成功。
- 改 handler 后只 eval 对应 defn，curl 立即反映新行为。
- POST JSON 往返无损。

**已知坑**

- middleware 挂在 route data 上，不存在 Express 式 `app.use()`。
- `run-server` 返回停止函数；重起前先停旧实例。

---

## 阶段 3：数据层（1–2 天）——实例、执行段与结果

**目标**：用 next.jdbc + SQLite 完成第一个垂直切片：**捕获实例 → 开始 → 暂停／恢复 → 完成 → 补记结果**，不先实现模板、计划或统计。

### 任务卡

1. 启用 next.jdbc、sqlite-jdbc、HoneySQL。
2. 阅读 `loom.schema` 中的 TaskInstance、TaskBackground、ExecutionSegment、TaskResult 词汇；模板、关系和组合条目是后续切片预留，不在本阶段实现写面。
3. 实现 `loom.db` 的 `datasource`、`ensure-schema!`、`snake-kebab-opts`。现有 DDL 是结构脚手架，`IF NOT EXISTS` 不是迁移工具。
4. 实现 `loom.task`：
   - `row->task`、`task->row`
   - `capture-task!`、`get-task`、`list-tasks`、`revise-task!`
   - `record-task-result!`
5. 实现 `loom.time`：
   - `row->segment`、`segment->row`
   - `start-task!`、`pause-task!`、`resume-task!`、`complete-task!`
   - `add-execution-segment!`、`active-segment`、`list-segments`
6. 在 `user.clj` 准备 3 个实例：可打断可接续、不可打断、偶然实例；补记至少两段执行时间并记录一个结果。
7. dev 启动时装配 malli instrumentation；普通 `defn` 没有 fn schema 时不会自动获得校验。

### 必须落地的不变量

| 规则 | L2 写面 | L3 数据库 |
|---|---|---|
| 标题与目标必填 | malli / 显式校验 | `NOT NULL` + 长度 CHECK |
| 可打断与可接续分离 | Pause／Resume 前检查 | 策略与 resumable 组合 CHECK |
| `ended-at > started-at` | 写入前校验 | CHECK |
| 同实例执行段不重叠 | 事务内查询并拒绝 | SQLite 基本表约束不足，不能省略 L2 |
| 全局至多一个活跃计时（若保留） | 事务内冲突检查 | 部分唯一索引 |
| 完成前不得有活跃段 | Complete 事务内检查并关闭／拒绝 | 不假装单表 CHECK 能完成跨行规则 |
| 完成后不得新增执行段 | Start／AddSegment 检查 | FK 不能替代此规则 |
| 结果观察与录入时间分离 | RecordResult 显式接收／产生 | 结果字段一致性 CHECK |

### 领域决策点

- **ADR-001**：活跃 Timer 的承载方式。DDD v0.2 提案是 `ended-at = NULL` 的 ExecutionSegment；所有者确认或记录新取舍。
- **ADR-002**：删除实例时执行段归属。当前 v0.2 没有 `DeleteTaskInstance`，因此它**不阻塞本阶段**；只有删除进入最小操作集时才关闭。

### 验收走查

1. 没有 Goal 和 TaskTemplate 也能捕获实例。
2. A 执行 30 分钟，暂停，隔天恢复 25 分钟；实际工作时长为 55 分钟，不包含隔夜等待。
3. 不可打断实例执行 Pause 被拒绝。
4. 可打断但不可接续实例执行 Resume 被拒绝；具体终止流程仍保持待验证，不隐式新建实例。
5. 活跃执行段存在时 Complete 被拒绝；完成后 AddExecutionSegment 被拒绝。
6. `observed-at` 与 `recorded-at` 分别保存；完成不自动证明结果达到期望。
7. Kanban 所需状态能由实例完成事实与执行段重建，不需要 `kanban-column`。

**过关判据**：能指出每条不变量的 L2／L3 位置，并解释为什么跨行规则不能只靠 DDL。

---

## 阶段 4：REST API（1 天）——语义命令与 409

**目标**：把领域操作暴露成明确的 HTTP 契约，而不是只提供通用 CRUD。

### 任务卡

1. 启用 reitit-malli coercion。
2. 第一组路由：
   - `GET /api/tasks`、`POST /api/tasks`
   - `GET /api/tasks/:id`、`PATCH /api/tasks/:id`
   - `POST /api/tasks/:id/start`
   - `POST /api/tasks/:id/pause`
   - `POST /api/tasks/:id/resume`
   - `POST /api/tasks/:id/complete`
   - `POST /api/tasks/:id/execution-segments`
   - `POST /api/tasks/:id/result`
   - `GET /api/execution-segments?task-id=...&from=...&to=...`
3. 请求体、路径参数和响应都声明 schema。
4. 统一错误形态：`{:error {:type ... :detail ...}}`；领域冲突映射 409，参数错误映射 400／422，不存在映射 404。
5. 后续切片再增加 `/api/task-sets`、`/api/task-relations`、`/api/task-templates`，本阶段不提前建空路由。

### 领域决策点

- **ADR-003**：同一实例重复 Start 是 409，还是幂等返回当前活跃段；必须与全局活跃计时约束一起判断。

### 验收标准

- 完整 curl 走查阶段 3 的执行闭环。
- 重复 Start、非法 Pause／Resume、完成后补记执行段都返回可读错误。
- 响应 coercion 开着；故意让 handler 返回缺字段 map 时会失败，而不是静默放走。
- 路由只编排，SQL 和领域规则不进入 handler。

---

## 阶段 5：CLJS 前端（2–3 天）——事实驱动投影

**目标**：先用 UIx 2 + re-frame 完成“现在、实例详情、时间记录、看板”四视图，再按后续切片增加列表／计划、类任务和复盘。

### 任务卡

1. 参考 `template/fullstack` 的 shadow-cljs 与 dev-http 代理配置；该模板提交不可修改。
2. 阅读纯 HTML 原型的交互，但**不要复制其 `status + elapsed + plan` 字符串状态，也不要复制硬编码统计**。
3. 自己实现 `::http` fx；事件成功后重新查询事实或应用明确的服务器响应。
4. app-db 只保存服务器投影与本地 UI 状态，例如：
   ```clojure
   {:route :now
    :tasks []
    :segments-by-task {}
    :active-segment nil
    :pending? false
    :error nil}
   ```
5. 视图职责：
   - **现在**：捕获、当前执行、暂停／恢复、完成、最近结果。
   - **实例详情**：目标、背景、打断策略、原始执行段、实际结果与证据。
   - **时间记录**：所有派生时长可以返回原始执行段。
   - **看板**：状态由事实派生；拖拽若存在，只能触发 Start／Pause 等明确命令。
6. 计时器显示根据活跃段 `started-at` 与当前时间派生，不把每秒递增的 `elapsed` 当成事实。
7. 结果录入区分实际观察时间、系统录入时间和证据；复查提醒不能混进 `observed-at`。

### 领域决策点

- **ADR-004**：进行中计时在前端的呈现方式。无论选显式 app-db 状态还是每次查询，都必须说明如何避免前端成为另一份事实。

### 验收标准

- 浏览器完成“捕获 → 开始 → 暂停 → 恢复 → 完成 → 补记结果 → 看板重建”。
- 刷新后活跃段与执行时长正确，不依赖本地每秒计数。
- 不可打断、不可接续和冲突响应都有对应 UI，不显示无效操作。
- 后端关闭时有错误提示，不白屏。
- 每秒跳动只影响计时显示，不重渲染整个列表。

---

## 阶段 6：验证与打包（1–1.5 天）

**目标**：clj-kondo + kaocha + test.check + uberjar，回答“没有编译期类型检查时靠什么保证”。

### 任务卡

1. clj-kondo：CLI 与编辑器集成，零 error 为门禁。
2. 解锁 `^:pending` 测试，并补以下最小示例：
   - TaskInstance／ExecutionSegment roundtrip。
   - 随机时间对永不允许 `end <= start`。
   - 同实例重叠执行段被拒绝。
   - 不可打断实例不能 Pause，不可接续实例不能 Resume。
   - 多段执行时长等于各段之和，而非首尾跨度。
   - 活跃段存在时不能 Complete，完成后不能新增执行段。
   - `observed-at` 与 `recorded-at` 不混用。
   - Kanban 能由相同事实重复重建。
3. 属性测试与业务示例测试并存；生成器可以从 malli 派生，但非法输入要由专门的负空间测试构造。
4. uberjar：数据库路径外部化，生产 coercion 策略明确，dev instrumentation 不带入生产。

### 验收标准

- `clojure -M:test --skip-meta pending` 在留桩阶段正常跳过 pending；解锁后完整测试全绿。
- 属性测试每类至少 200 条随机数据。
- `java -jar` 启动后核心流程与 dev 等价。
- 能解释 clj-kondo、malli coercion、写面校验、属性测试和 DDL 各自拦截什么错误。

---

## 后续垂直切片：严格按 DDD v0.2 顺序

### 切片 B：平级组合、时序关系与 ExecutionPlan

- 实现 TaskSet、Membership、TaskRelation 写面与列表／计划视图。
- 自环、重复关系和图环在写面拒绝；无环不等于自动阻塞。
- 组合前后实例 ID、执行段和结果不变。
- 计划任务全部完成仍不自动宣称目的达成。

### 切片 C：第二个实例确认 TaskTemplate

- 实现候选比较、人工确认、模板创建、关联既有实例、从模板实例化和归属修订。
- 模板没有 Start／Pause／Complete。
- 修改模板默认值不追溯覆盖既有实例。

### 切片 D：行为观察与候选解释

- 频次按实例身份，不按执行段；周期按不同实例首次开始时间。
- 未开始实例、活跃段 `as-of`、时间窗口字段和跨实例重叠补记都要有明确口径。
- 高投入、高频次不自动推出高价值或浪费；候选可确认、修订或否决。

---

## 附录 A：资源清单

| 资源 | 用法 |
|---|---|
| 《Web Development with Clojure》第 3 版 | Ring/Reitit/re-frame/malli/SQLite 主教材 |
| 《Domain Modeling Made Functional》 | 类型驱动建模主参考；用 malli 重做书中练习 |
| 《Learning Domain-Driven Design》 | 子域、限界上下文和战略设计参考 |
| re-frame 官方文档 | app-db、事件、subscription 与 fx |
| reitit 官方文档 | 路由数据、middleware、coercion |
| next.jdbc 官方文档 | 事务、结果集和批量操作 |
| malli README + doc | schema、registry、generator 与错误解释 |
| shadow-cljs User’s Guide | 前端构建与 REPL |

## 附录 B：卡壳处置流程

1. REPL 里复现最小形态，手动调用目标函数。
2. `(tap> x)` + Portal/Reveal 查看真实数据形状。
3. 读异常栈中第一行自己的代码。
4. 超过 45 分钟，写下“现象／期望／最小复现”。
5. 依赖、测试环境、构建或端口问题交给代理；业务函数与待决 ADR 留给所有者。

## 附录 C：术语速查

- **form**：一个可求值表达式单元。
- **namespace**：Clojure 模块边界；可以承载写面纪律，但不自动等于限界上下文。
- **keyword**：`:task/id` 等命名空间关键字，是通用语言载体。
- **var / `#'`**：名字背后的可变引用，支持热重载。
- **聚合／不变量**：聚合是一致性修改边界；不变量必须在写路径强制。
- **投影**：从事实派生的只读形态；Kanban、行为时间序列和前端 app-db 都是投影。
- **coercion**：reitit-malli 的请求／响应校验层。
- **fx**：re-frame 的副作用注册点。

## 进度打勾表

| 阶段 | 验收全绿日期 | 决策点完成 |
|---|---|---|
| 1 REPL 与环境 | ☐ | |
| 2 HTTP 后端 | ☐ | |
| 3 实例与执行事实 | ☐ | ADR-001；ADR-002 仅在删除进入范围时 |
| 4 REST + coercion | ☐ | ADR-003 |
| 5 CLJS 前端 | ☐ | ADR-004 |
| 6 验证与打包 | ☐ | |
