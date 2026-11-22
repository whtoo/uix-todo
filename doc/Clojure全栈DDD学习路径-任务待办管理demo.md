# Clojure 全栈 DDD 学习路径：任务待办管理 demo（时间分配与统计）

> 目标读者：TS / type-driven DDD 背景的 solo 开发者。全程六个阶段，每阶段只引入一个新设施，验收过关再进下一阶段。
> demo 定义：个人任务管理系统——任务 CRUD、计时器（开始/停止）、时间条目、今日视图与近 7 天统计面板。
> 选题理由（对 agent 会话 demo 的两个否决记录）：① 会话存储标准仍在争夺期，Claude Code 的 jsonl 只是事实参考且语义绑定其产品，学习 demo 的领域必须可被学习者**完全建模**；② 会话的交互展示（轨迹投影）是真问题但悬置，普通 CRUD 骨架练不到它。任务领域两个条件都满足，且天然承载 DDD 演化练习。

## 0. 总纲

### 训练纪律
- 每阶段只加一个新设施，验收全绿再进下一阶段。
- 全程 REPL-first：任何"我不确定行为"的问题，先在 REPL 里做实验，再写进代码。
- **每阶段有一个领域决策点**：决策必须写进代码注释，并经得起"为什么"盘问——这是 DDD 过程的练习位。
- 卡壳超过 45 分钟：停下，走附录 B 的处置流程。

### 领域种子（第一版通用语言，你将亲手演化它）

| 限界上下文 | 聚合 | 字段（候选） | 不变量 |
|---|---|---|---|
| 任务上下文 `loom.task` | Task | id / title / status / estimate-min / tags / note / created-at / updated-at | status ∈ `:todo :doing :done :archived` |
| 时间上下文 `loom.time` | TimeEntry | id / task-id / start-ts / end-ts(空=进行中) / source / note | end-ts > start-ts；全局同时至多一个 end-ts 为空 |
| （投影，非写模型） | DailyStats / WeeklyStats | 由 TimeEntry + Task 派生 | 无写路径，只有查询 |

- **Timer 不建模为独立实体**——它是 TimeEntry 的"end-ts 为空"状态。（此为决策点①的反方提案，见阶段 3，你自己判。）
- namespace 边界 = 限界上下文边界的落点：`loom.task` 与 `loom.time` 互不 import 对方的内部函数，跨上下文只走显式调用。

### 心智映射（TS → Clojure，先立这张表）

| TS 概念 | Clojure 对应 | 关键差异 |
|---|---|---|
| interface / type | map + namespaced keyword + malli schema | 结构化而非名义化；schema 是一等值 |
| ORM（Prisma/Knex） | next.jdbc + 手写 SQL | 无隐藏查询层，SQL 显式 |
| zod 校验请求体 | reitit-malli coercion | 声明在路由数据上，进出双向校验 |
| 模块边界 | namespace + 命名纪律 | 无线性强制，靠纪律 |
| vitest/jest + supertest | kaocha + ring mock | 属性测试是一等公民 |
| dayjs/date-fns | java.time 互操作 或 juxt/tick | tick 是 Clojure 习惯的 time API |
| tsc | clj-kondo + malli coercion | 静态层是工具，不是编译器 |

### 环境清单
- JDK 21+、Clojure CLI（`clj` 可用）、Node 20+、git
- 编辑器二选一：Calva（VS Code，本路径示例以此为准）或 Cursive（IntelliJ）

---

## 阶段 1：REPL 与环境（0.5 天）

**目标**：让"代码即数据、REPL 即工作台"从口号变成肌肉记忆。Clojure 的门槛不在语法，在工具链——这是整个路径的钥匙。

**任务卡**
1. 装 JDK 21、Clojure CLI、Calva。
2. `clj -M -e "(println :hello)"` 确认 CLI 可用。
3. 建项目 `deps.edn`（最小：`org.clojure/clojure {:mvn/version "1.12.x"}`）。
4. Calva jack-in，练五个动作：eval current form、eval top-level form、eval file、load file、`in-ns` 切换。
5. 写 `src/user.clj`：定义 `(defn greet [name] (str "hello, " name))`，eval 后调用；修改函数体，只 eval 这一个 defn，确认新定义立即生效（不重启 REPL）。

**验收标准**
- 全程没有重启 REPL，靠逐 form 求值推进。
- 能解释 `user>` prompt 与 `in-ns` 的关系。

**已知坑**
- Calva jack-in 会自动配好 classpath；手敲裸 `clj` 进的是无项目 classpath 的 REPL——症状是 `(require 'user)` 找不到文件。
- VS Code 打开目录必须是 deps.edn 所在的项目根。

**过关判据**：30 秒内完成"改一个函数 → 生效 → 调用验证"。

---

## 阶段 2：HTTP 后端骨架（0.5–1 天）

**目标**：最小的 Ring + Reitit + http-kit 服务，理解"handler 是数据"的接线方式。

**任务卡**
1. deps.edn 加 `ring/ring-core`、`metosin/reitit`、`metosin/reitit-ring`、`http-kit/http-kit`、`metosin/muuntaja`。
2. 数据语法路由：GET /health → `{:status "ok"}`。
3. `user.clj`：`(def server (http-kit/run-server #'app {:port 3080}))`，REPL 里起停服务。理解 `#'`（var 间接引用）与热改的关系。
4. POST /echo：JSON body 原样返回（muuntaja 中间件，挂在路由 `:data` 上）。

**验收标准**
- `curl localhost:3080/health` 通。
- 改 handler 函数体，只 eval 该 defn，curl 立即反映新行为（不重启 server）。
- POST JSON 往返无损。

**已知坑**
- reitit 的 middleware 是**路由数据的一部分**（挂在 route data 上），不是全局 app 对象——别找 `app.use()`。
- `run-server` 返回停止函数，保存它；重起前先停旧实例。

**过关判据**：能在 REPL 热改路由和 handler，并解释 var indirection 为什么让热改成为可能。

---

## 阶段 3：数据层（1 天）——两个限界上下文落地

**目标**：next.jdbc + SQLite 完成 Task 与 TimeEntry 两个聚合的 CRUD 与不变量，理解"namespace 即限界上下文"的落点。

**任务卡**
1. deps.edn 加 `com.github.seancorfield/next.jdbc`、`org.xerial/sqlite-jdbc`。
2. 两个命名空间 `loom.task` / `loom.time`，各自一套 malli schema（放 `loom.schema`，schema 是共享内核，代码不是）。
3. 表：`tasks`、`time_entries`（db 初始化函数顺序执行建表，手写 SQL 即可，不引入迁移工具）。
4. 函数面：
   - `loom.task`：`create-task!` `get-task` `list-tasks`（支持 status/tag 过滤）`update-task!` `delete-task!`
   - `loom.time`：`start-timer!`（task-id）`stop-timer!` `active-timer` `list-entries`（task-id / from / to 过滤）
5. 不变量实现：
   - 全局至多一个活跃计时：`start-timer!` 内 `next.jdbc/with-transaction` 先查 active 再插入，冲突抛 ex-info `:time/conflict`
   - `end-ts > start-ts`：写入前校验
6. `user.clj` 辅助：`:db/reset`、`:db/seed`（3 个任务 + 2 条历史时间条目）。
7. dev 启动装配 `mi/instrument!`。

**领域决策点**
- ① Timer 建模：我的种子提案是"不建模为独立实体，Timer = end-ts 为空的 TimeEntry"。**接受或推翻它**，把你的选择和理由写进 `loom.time` 命名空间注释。
- ② 删除任务时其时间条目：保留（统计不丢）还是级联删？选择并执行，注释理由。

**验收标准**
- REPL 完成一轮完整 CRUD，重开后数据仍在。
- 活跃计时存在时再 `start-timer!` → 抛 `:time/conflict`，异常数据可读。
- end < start 被明确拒绝。
- 决策点①②的注释存在，且你能口头通过"为什么"盘问。

**已知坑**
- next.jdbc 默认返回 `CREATED_AT` 风格 key：在 db 层出口统一转 kebab-case（`{:builder-fn ...}` 或显式转换函数）——"边界有契约"纪律的第一份作业。
- 时间一律 epoch millis 整数（:int），**不要存字符串**；展示层的格式化是投影职责，不属于存储。
- 参数 map 的 key 进 SQL 参数前要显式处理，关键字直接进会报错。
- SQLite 单连接即可；别在 REPL 里攒多个未关连接。

**过关判据**：能指出两个不变量各在代码哪几行、为什么必须在事务里；能解释 namespace 边界与限界上下文的对应。

---

## 阶段 4：REST API（1 天）——coercion + 第一个 409

**目标**：完整 REST 面，掌握 reitit-malli coercion，处理资源冲突语义（409）。

**任务卡**
1. deps.edn 加 `metosin/reitit-malli`。
2. 路由全集：
   - `GET /api/tasks`（`?status=` `?tag=`）
   - `POST /api/tasks` / `PUT /api/tasks/:id` / `DELETE /api/tasks/:id` / `GET /api/tasks/:id`
   - `POST /api/time-entries/start`（body: task-id）
   - `POST /api/time-entries/stop`
   - `GET /api/time-entries`（`?task-id=` `?from=` `?to=`）
3. coercion 挂路由 `:data`：请求体、路径参数、**响应**全部声明。
4. 统一错误形态：`{:error {:type :not-found | :invalid-params | :conflict, :detail ...}}`；`:time/conflict` → **409**（新状态码，教学点：它是资源状态冲突，不是参数错误）。
5. 加分题：DELETE 已删除 id 返回 204 还是 404？查 RFC，选定，注释。

**领域决策点**
- ③ `start` 的幂等性：重复 start 同一任务，是 409，还是"已有活跃计时则直接返回它"（幂等 200）？REST 语义选择写进路由注释——注意它与不变量"全局至多一个活跃"的互动。

**验收标准**
- 全部端点 curl 通；列表过滤生效。
- 活跃计时存在时再次 start → 409 + 明确 detail。
- 响应 coercion 开着：故意让 `list-tasks` 返回缺字段的 map → 500 而非静默放走（这就是你要的"编译器替身"体感）。
- 不存在 id → 404 且错误形态符合约定。

**已知坑**
- coercion 错误默认是 reitit 异常封装，用 exception handler 中间件统一格式化——不做这步，前端无法消费错误。
- 路径参数 `:id` 也要声明 `:parameters {:path ...}`，别裸取。
- 响应 coercion 有性能成本：dev 全开，uberjar 只保留写操作——loom-mesh 生产三档开关的原型。

**过关判据**：能指着路由数据说出"请求从进入到返回，每一层各验证了什么"；能解释 409 与 400 的语义分界。

---

## 阶段 5：cljs 前端（2–2.5 天）——计时器与统计投影

**目标**：完成四视图：任务列表、任务表单、计时器条、今日视图 + 近 7 天统计面板。

**任务卡**
1. shadow-cljs 链路（模板分支 `template/fullstack` 已配好：deps.edn 双轨 + dev-http 代理 /api → 3080；纯后端 main 已移除此配置）。
2. 组件层用 UIx 2（模板分支现状）；明确记录：换 Reagent 是机械替换，本阶段不引入。
3. re-frame 接线：
   - 自己写一个 `::http` fx（fetch 封装，不用现成库）
   - 事件流：`::load-tasks` → `::tasks-loaded`；`::start-timer` / `::stop-timer` → 成功后刷新 active 与时间条目
   - app-db：`{:view :today, :tasks [], :entries [], :active-timer nil, :form {...}, :error nil}`
4. 视图：
   - **任务列表**：状态过滤、标签、编辑删除入口
   - **任务表单**：新建/编辑，字段级错误提示
   - **计时器条**（全局置顶）：任务名 + 已运行时间每秒跳动 + 停止按钮；无活跃时显示"开始计时"引导
   - **今日视图**：时间条目时间线 + **统计面板**——近 7 天每日总分钟数的纯 CSS 柱状条 + 今日各任务占比
5. 统计 v1 不走图表库（一次只加一样）；ECharts npm 直通留作加分题。
6. 错误消费：409 → 提示"已有进行中的计时"并跳到该计时。

**领域决策点**
- ④ "进行中"计时在前端的呈现：app-db 里的显式状态，还是每次从后端查询的投影？结合 re-frame "app-db 是后端状态的投影而非另一份事实"的纪律作答，写注释。

**验收标准**
- 浏览器完成：建任务 → 开始计时 → 等待 → 停止 → 今日时间线出现条目 → 统计柱增长 → 刷新后一切如旧。
- 计时器跳动每秒只重渲染计时器条，列表不动（subscription 粒度达标）。
- 后端关闭时操作有错误提示，不白屏。
- 日期边界（"今日"、"近 7 天"）用 `juxt/tick`（deps.edn 加入），不手写日期算术。

**已知坑**
- **双 REPL 困惑**（新手第一大坑）：clj REPL 管后端，cljs REPL 管前端，编辑器里两端都要连。症状"改了前端没反应"基本都是只连了一头。
- 每秒跳动的 interval 生命周期：注册/清理走 fx 模式，别散落在组件里。
- shadow-cljs 编译错误会直接渲染在浏览器页面上——不是崩溃，是它的 dev 界面。
- kebab/snake 边界转换在 `::http` fx 出口统一做一次。
- 副作用全部走 fx；fetch 回调里 dispatch 事件，别往 subscription 塞 IO。

**过关判据**：能画出"点击开始计时 → fx → API → event → app-db → subscription → 计时器条跳动"完整回路并指认每一步代码位置；决策点④解释通过。

---

## 阶段 6：验证与打包（1 天）——把"编译器缺的那层"落地

**目标**：clj-kondo + kaocha + test.check + uberjar，回答"没有编译期类型检查的系统靠什么保证"。

**任务卡**
1. clj-kondo：CLI + 编辑器集成，全项目零 error 为常态门禁。
2. kaocha + test.check 三条测试：
   - (a) roundtrip 属性：随机合法 Task/TimeEntry → 建库 → 读回 → 字段无损（生成器用 malli 派生）
   - (b) 不变量属性：随机时间对，断言库内永不存在 end ≤ start 的记录
   - (c) 冲突语义：活跃计时存在时 ring mock 再 start → 必 409
3. uberjar：db 路径外部化（环境变量）；coercion 生产收窄（只保留写操作）；`mi/unstrument!`。
4. 加分题：Task update 乐观锁（version 字段）→ 冲突 409；统计图换 ECharts；**DDL 生成器**（malli registry → DDL，验证"结构可生成"档主张）。

**验收标准**
- `bin/kaocha` 全绿；clj-kondo 零 error。
- `java -jar` 启动后浏览器全流程与 dev 等价。
- 属性测试 (a)(b) 各跑 200 条随机数据通过。

**已知坑**
- 生成器从 schema 派生是"schema 即接口"的第一次红利兑现——别手写生成器；malli 的 `:min` `:enum` 等约束自动生成合法域对象，非法输入从源头被排除，这就是 DDD 测试里"非法状态不可表示"的等价物。
- property (c) 需要测试隔离：每条测试用临时 db 文件（fixture 创建销毁）。
- `(set! *assert* false)` 只影响加载时的断言，编译期固化——构建脚本里设，不是运行时设。

**过关判据**：能向一个 TS 工程师完整解释——本系统等价保证由哪四层设施构成（clj-kondo / malli coercion / 属性测试 / 边界 schema），各管哪一类错误；并能指出四个领域决策点在代码里的位置。

---

## 附录 A：资源清单（权威著作优先）

| 资源 | 用法 |
|---|---|
| **《Web Development with Clojure》第 3 版**（Manning） | 主教材，与本路径栈重合度最高（Ring/Reitit/re-frame/malli/SQLite） |
| **《Domain Modeling Made Functional》**（Scott Wlaschin） | DDD 建模主参考——F# 背景、类型驱动，与你背景完全对口；练习：把书中"用类型建模型"的招式用 malli/spec 重实现 |
| **re-frame 官方文档**（day8/re-frame 的 docs/ 目录） | 逐章读，架构文档质量属开源界顶级 |
| **reitit 官方文档**（metosin/reitit 的 doc/ 目录） | 阶段 4 全程在手边，coercion 章节精读 |
| **next.jdbc 官方文档**（seancorfield/next.jdbc） | 阶段 3 的 API 手册 |
| **malli README + doc**（metosin/malli） | 当 API 手册 |
| **juxt/tick 文档** | 阶段 5 日期边界 |
| **shadow-cljs 官方 User's Guide** | 阶段 5 构建手册 |
| Clojure 官方 cheatsheet | 贴墙 |

## 附录 B：卡壳处置流程

1. REPL 里复现最小形态：`in-ns` 到目标命名空间，手动调那个函数。
2. `(tap> x)` + Portal/Reveal 看数据真实形状——**一半以上的"类型问题"是数据形状与你想的不一样**。
3. 读异常栈里第一行你自己的代码，不是最后一行库代码。
4. 超过 45 分钟：写成一句话的问题（现象 / 期望 / 最小复现）发 ClojureVerse 或 Clojurians Slack #beginners。
5. 仍卡住：带着最小复现回来找我。

## 附录 C：术语速查

- **form**：一个可求值的表达式单元；REPL 逐 form 工作。
- **namespace**：等价 JS module；本 demo 中 = 限界上下文的落点。
- **keyword**：`:foo/bar`，自带命名空间的全局唯一标签——通用语言的载体。
- **var / `#'`**：名字背后的可变引用，热重载的地基。
- **聚合 / 不变量**：聚合是一致性修改的最小单位；不变量在聚合边界内强制（demo 中：活跃计时唯一、end > start）。
- **投影**：从写模型派生的只读形态（demo 中：统计面板、计时器条）——前端 app-db 也是后端状态的投影。
- **coercion**：reitit-malli 的声明式请求/响应校验层，本路径中替代 zod 的位置。
- **fx**：re-frame 的副作用注册点。
- **jack-in**：编辑器替你启动并连接 REPL 的一键动作。

## 附录 D：领域演化路线（demo 毕业之后）

按顺序演，每次演化都是一次完整的 DDD 练习（改 schema → 改不变量 → 改投影 → 补属性测试）：

1. **Plan 上下文**：每日计划分配（task-id + 计划分钟数）——第三个限界上下文，练习跨上下文联动（今日视图叠加"计划 vs 实际"）
2. **物化投影**：周统计从"每次查询"改为定时汇总表——练习投影的重建语义
3. **重复任务**：recurrence 规则（RRULE 风格）——练习时间领域复杂度跃升
4. **标签体系升级**：标签从字符串数组变为独立实体——练习模型重构时的数据迁移

## 进度打勾表

| 阶段 | 验收全绿日期 | 决策点完成 |
|---|---|---|
| 1 REPL 与环境 | ☐ | |
| 2 HTTP 后端 | ☐ | |
| 3 数据层 | ☐ | ① Timer 建模 ② 删除策略 |
| 4 REST + coercion | ☐ | ③ start 幂等性 |
| 5 cljs 前端 | ☐ | ④ 计时器状态归属 |
| 6 验证与打包 | ☐ | |
