# Clojure DDD 实践指南

> 读者画像：type-driven DDD 实践者，正用任务待办 demo 入门 Clojure 全栈。
> 核心立场：DDD 的战略层完全语言无关；战术层在 Clojure 里换了一套实现机制——从「类型即不变量」换成「数据 + 契约 + 写路径纪律 + 测试」。本指南只讲换的那部分，不换的部分（限界上下文、通用语言、上下文映射的推导方法）直接沿用你既有的 DDD 知识。

## 一、总纲：三层各自靠什么

| 层 | 内容 | Clojure 里的支撑 |
|---|---|---|
| 战略设计 | 限界上下文、通用语言、上下文映射、子域 | namespace 边界 + 命名纪律 + schema registry（机制不同，方法照抄 Evans/Vernon/Khononov） |
| 战术设计 | 实体/值对象/聚合/仓储/领域事件 | 本指南主体：map + malli + 函数面 + 事务 |
| 验证哲学 | 非法状态不可表示（类型立场） | 非法状态可表示、进出必被检查（契约立场）——验证时机从编译期移到边界与测试 |

## 二、战略层落点（简表）

- **限界上下文 → 命名空间边界**：一个上下文一个顶层 ns（`loom.task` / `loom.time`）。纪律：上下文之间不互相 require 内部函数；跨上下文调用集中在显式的调用点。需要物理隔离时用 Clojure 多模块（deps 的 `:local/root`），起步用纪律就够。
- **通用语言 → namespaced keyword + 一份 schema registry**：`:task/status`、`:time/entry` 全局无二义；registry（malli 的 `::m/registry`）就是通用语言的机器可读词汇表。
- **上下文映射**：
  - 共享内核 → 共享 schema 命名空间（`loom.schema`）+ 共享测试；
  - 防腐层（ACL）→ 独立的 `*.adapter` 命名空间：进/出各一个纯转换函数，外部世界的形状在这里终结；
  - 发布语言（Published Language）→ malli → JSON Schema/OpenAPI 导出，对外契约的机器可读形态；
  - 开放主机服务（OHS）→ REST/WS 路由数据即协议声明。

## 三、战术模式映射（主体）

### 3.1 值对象 = 不可变 map + schema

```clojure
(def TaskTitle
  [:and :string [:min 1] [:max 120]])
;; 使用点：构造时校验，之后永远可信——等价于 TS 的 branded type 的运行时版
```

- 相等性免费（不可变数据的值语义），不需要 Equals 方法。
- "内联值对象"（如标题、分钟数）直接内联进实体 schema；有独立行为或复用的才提升为命名 schema。

### 3.2 实体 = 带 id 的 map + 显式状态迁移函数

关键纪律：**实体的生命周期只允许通过聚合的写函数改变**。禁止在调用方散落 `(update-in task [:status] ...)`——那是绕过不变量的后门。写函数即聚合的行为方法：

```clojure
(defn complete-task!
  "任务上下文的唯一完成入口。不变量在此强制。"
  [db task-id]
  (jdbc/with-transaction [tx db]
    (let [task (get-task tx task-id)]
      (when (nil? task) (throw (ex-info "任务不存在" {:type :task/not-found})))
      (when (= :task.status/archived (:task/status task))
        (throw (ex-info "已归档任务不能完成" {:type :task/illegal-transition})))
      (update-task-row! tx task-id {:task/status :task.status/completed
                                    :task/updated-at (now)}))))
```

注意状态值用命名空间关键字（`:task.status/completed`）——状态机本身也成了通用语言的一部分，且跨上下文不会撞名。

### 3.3 聚合 = 一致性边界，不是对象图

聚合在 Clojure 里不是一个"类"，而是一个**写路径函数族 + 事务边界**的合取。判据不变：一起变的东西放一起，一起校验。

- 聚合根的识别方法与 Evans 一致；实现上是「该上下文内所有写操作必经的函数面」。
- 跨聚合不变量（如"全局至多一个活跃计时"）**不放进任何单一聚合**：在应用服务层用事务强制，或改模型（见 3.7 决策点）。这是 Clojure 实现里最常被做错的地方——语言没有访问控制替你守门。
- 小聚合优先；用 id 引用别的聚合，不嵌套持有。

### 3.4 不变量的四种强制强度（L0–L3，对齐你的验证阶梯口味）

| 级别 | 机制 | 何时开 | 例子 |
|---|---|---|---|
| L0 | 文档注释 + 命名 | 永远 | schema 注释写明业务规则 |
| L1 | `mi/instrument!` dev 全开 | dev/CI | 所有写函数的入参/返回值形状 |
| L2 | 写函数出口显式校验（ex-info 抛错） | **生产常开** | end > start、状态迁移合法性、活跃计时唯一 |
| L3 | 数据库约束兜底（CHECK / UNIQUE / NOT NULL / FK） | 永远 | `CHECK (end_ts IS NULL OR end_ts > start_ts)`、`UNIQUE` 部分索引防双活跃 |

原则：**L2 是领域层的事，L3 是基础设施的最后一道墙**。两者都写，成本是每不变量两行；漏掉 L3 的教训是"应用层忘了检查，坏数据落库"。SQLite 支持 CHECK 和部分索引，别浪费。

### 3.5 仓储 = 函数面起步，协议留给多实现

- **默认形态**：上下文命名空间里的函数组（`get-task` `list-tasks` …），参数第一个位置传 db/连接。solo 项目不需要抽象层。
- **何时用 `defprotocol`**：确有第二种实现时（内存版给测试、Datalevin 版给生产）才引入，且定义在同一上下文内。
- **DO ≠ 领域对象**：DB 行结构与领域 map 之间显式转换（kebab 转换函数即转换器）。有赞/Java 实践里 Converter 的教训在此同样成立——但 Clojure 里这只是一层薄函数，不是反射框架。

### 3.6 工厂 = 智能构造函数

`(make-task {:task/title ...})`：malli validate → 失败抛 `ex-info`（带 humanize 后的人类可读信息），成功返回 map。**聚合的不变量从构造第一刻就成立**。这也呼应 do-harness 的干预原语：do 干预注入的领域数据必须过同一个 `make-*` 入口——工厂即干预的安检门。

### 3.7 领域服务 = 纯函数命名空间；应用服务 = 编排层

- **领域服务**：跨聚合的业务规则，纯函数、无 IO（如"计费时长 = f(时间条目集合, 计费模板)"）。DDD 经典的"放实体还是放服务"判据照常适用。
- **应用服务**：事务边界、编排、加载聚合→调用行为→持久化→发事件。在 Clojure 里就是一个 `(defn handle-x-command [deps cmd] ...)` 函数 + malli 契约，不需要 ApplicationService 类。
- 协调工作（无业务规则）永远放应用层，别造领域服务——这条反例在有赞实践中被明确点过，语言无关。

### 3.8 领域事件 = map + append-only 流

`:event/type` + 发生时刻 + 聚合 id + 载荷。事件即事实的追加流天然契合 Clojure 的 immutable 序列——这是 loom-mesh 会话日志的同构点。订阅侧用 core.async 或多路复用均可，起步一个 atom + doseq。

### 3.9 规格模式 = multimethod 或高阶函数

需要可替换的业务规则（计费策略、审批策略）时：multimethod（按策略关键字派发）或把策略函数作为参数传入。两者都比策略类简洁；multimethod 适合规则集合开放扩展，高阶函数适合规则封闭、由调用方决定。

### 3.10 存储层工具谱系：ORM 问题在 Clojure 的解构

**谱系**（从基板向上）：

| 层 | 工具 | 对应 Java/TS 世界的什么 |
|---|---|---|
| 基板 | next.jdbc | JDBC 本身 |
| SQL 即数据 | HoneySQL（2.x 活跃） | 可组合 SQL DSL，查询是数据结构，`cond->` 拼条件 |
| MyBatis 式 | hugsql（+连接管理 wrapper conman） | SQL 写在 `.sql` 文件，一条语句生成一个 Clojure 函数，命名参数 `:task-id`，snippets 复用片段（对应 `<sql>`/`<include>`） |
| 薄 model 层 | toucan 等（基于 HoneySQL） | 给表加行为的轻封装，远不到 ORM |
| 反面教材 | Korma | 早期 ORM 味 DSL，已停滞，别碰 |

**为什么 Hibernate 式不存在**：ORM 卖的四大件——实体标识管理、脏检查、惰性加载、级联持久化——在不可变纯数据上大多无意义（没有"对象被改了需要探测"，每次修改都是新值；级联就是函数；结果集行天然是 map）。ORM 的问题被拆给三件更便宜的东西：immutable 数据（免费）、显式转换函数（薄）、组合式 SQL（数据）。

**选型判据（单一库默认）**：默认 **HoneySQL 单库全覆盖**——写路径（insert/update/delete 都是 map）与读路径（组合查询、动态条件、CTE、窗口函数）同一套语法；动态条件用 `cond->` 往查询 map 上叠 `:where` 子句，是"片段与参数成对构造"问题的最优解。hugsql 的唯一独占价值是"SQL 外部化到 .sql 文件供非开发者 review"——solo 项目无此需求，不引入。next.jdbc 裸字符串保留为逃生舱（HoneySQL 表达不动的极冷门语法，先试 `[:raw ...]` 再退回裸写）。基板 next.jdbc 不算第二个库——无论上层选谁，执行层都是它。

**只用 next.jdbc 的复杂查询/更新基板写法**（完整版见会话记录，要点）：
- 动态 WHERE：片段与参数**成对构造**（`build-where` 模式），杜绝失配；
- 动态 UPDATE：从 changes map 生成 `SET col = ?` 清单 + 对应参数向量；
- 批量：`sql/insert-multi!`（单语句多值）或 `:batch true` / `jdbc/execute-batch!`；
- 事务：`jdbc/with-transaction`，块内抛 `ex-info` 自动回滚；
- 大结果集：`jdbc/plan` + `transduce`（惰性 reduce，不全量载入内存）；
- kebab：官方内置 `{:builder-fn rs/as-unqualified-kebab-maps}`（1.2.659+），`with-options` + `snake-kebab-opts` 可设全局默认；
- 命名参数：next.jdbc 原生只有位置 `?`；要 MyBatis 式命名参数就是 hugsql 的主场。

反模式 5（DB 行 ≠ 领域对象）在任何一层都成立：kebab builder 解决的是 key 形态，不解决"存储格式泄漏成 API 格式"。

### 3.11 垂直切片参考实现：从 registry 到仓储

以下是一个 Task 聚合的完整落地，四层各就其位——照此结构可机械复制出任何聚合。

**① 领域模型（`loom/schema.clj`，通用语言的机器可读形态）**

```clojure
(def registry
  (m/registry
   {::task/status [:enum :task.status/todo :task.status/doing
                        :task.status/done :task.status/archived]
    ::task/title  [:and :string [:min 1] [:max 120]]
    ::task/task   [:map {:closed true}
                   [:task/id :uuid]
                   [:task/title ::task/title]
                   [:task/status ::task/status]
                   [:task/estimate-min {:optional true} [:int {:min 0 :unit :time/minute}]]
                   [:task/created-at :int]
                   [:task/updated-at :int]]}))
```

领域层只有命名空间关键字与整数时间戳，无 SQL、无字符串状态。量纲以 schema 元数据存在（`:unit`），供校验/生成/文档消费，**不进 DB**。

**② 存储模型（DDL，故意说另一种语言）**

```clojure
(def ddl
  ["CREATE TABLE IF NOT EXISTS tasks (
      id           TEXT PRIMARY KEY,
      title        TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 120),
      status       TEXT NOT NULL CHECK (status IN ('todo','doing','done','archived')),
      estimate_min INTEGER CHECK (estimate_min >= 0),
      created_at   INTEGER NOT NULL,
      updated_at   INTEGER NOT NULL"
   "CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)"
   ;; TimeEntry：L3 不变量写进数据库
   "CREATE TABLE IF NOT EXISTS time_entries (
      id       TEXT PRIMARY KEY,
      task_id  TEXT NOT NULL REFERENCES tasks(id),
      start_ts INTEGER NOT NULL,
      end_ts   INTEGER,
      CHECK (end_ts IS NULL OR end_ts > start_ts))"
   "CREATE UNIQUE INDEX uniq_active_timer ON time_entries(end_ts) WHERE end_ts IS NULL"])

(defn ensure-schema! [db]
  (run! #(jdbc/execute! db [%]) ddl))
```

snake_case、裸字符串状态、CHECK 兜底——刻意的词汇分离；两套语言的交汇点只允许是映射层。

**③ 映射（ACL，两个纯函数，全文件唯一双语地带）**

```clojure
(defn row->task [r]                        ; 出口：存储 → 领域
  {:task/id           (parse-uuid (:id r))
   :task/title        (:title r)
   :task/status       (keyword "task.status" (:status r))
   :task/estimate-min (:estimate_min r)
   :task/created-at   (:created_at r)
   :task/updated-at   (:updated_at r)})

(defn task->row [t]                        ; 入口：领域 → 存储
  {:id           (str (:task/id t))
   :title        (:task/title t)
   :status       (name (:task/status t))
   :estimate_min (:task/estimate-min t)
   :created_at   (:task/created-at t)
   :updated_at   (:task/updated-at t)})
```

kebab 转换在更外层 builder 完成；本层管**语义转换**（枚举、UUID、命名空间剥离）。两个函数纯、可独立测试。

**④ 仓储函数（HoneySQL 数据 → `sql/format` → next.jdbc）**

```clojure
(defn get-task [db id]
  (some-> (jdbc/execute-one! db
            (sql/format {:select :* :from [:tasks] :where [:= :id (str id)]})
            {:builder-fn rs/as-unqualified-kebab-maps})
          row->task))

(defn create-task! [db {:task/keys [id title estimate-min]}]
  (let [now (now-ms)]
    (jdbc/execute-one! db
      (sql/format {:insert-into [:tasks]
                   :values [(task->row {:task/id id :task/title title
                                        :task/status :task.status/todo
                                        :task/estimate-min estimate-min
                                        :task/created-at now :task/updated-at now})]}))
    (get-task db id)))
```

调用方（API 层/前端/测试）永远只见领域词汇。参数永远以向量元素存在，不与 SQL 拼接。

### 3.12 schema 与数据层的结合纪律

**不变量在切片中的落点（对照 3.4 的 L0–L3）**：

| 不变量 | L2（写函数） | L3（DB 兜底） |
|---|---|---|
| 标题 1–120 字符 | malli `[:min 1] [:max 120]` 校验 | `CHECK (length(title) BETWEEN 1 AND 120)` |
| 状态枚举 | malli `[:enum ...]` | `CHECK (status IN ...)` |
| end > start | `[:fn]` 跨字段校验 | `CHECK (end_ts IS NULL OR end_ts > start_ts)` |
| 全局至多一个活跃计时 | `start-timer!` 事务内查冲突 | 部分唯一索引 `uniq_active_timer` |

漏 L3 的代价：应用层忘了检查，坏数据落库。每不变量两行，这是固定成本不是可选优化。

**DDL 生成器三档判据**（想从 registry 自动生成 DDL 时按此划界）：

- ✅ **结构可生成**：类型映射、enum→CHECK、可空性、边界——信息全在模型里，~100 行生成器，demo 阶段 6 加分题正为此准备；
- ⚠️ **变迁半生成**：model diff 能推出目标结构，推不出到达路径（加列默认值的回填、缩枚举的清洗、拆表的迁移）——迁移文件手写，它是版本化意图的载体；
- ❌ **访问不可生成**：索引与复杂查询依赖访问模式，而访问模式的信息**不存在于领域模型，存在于用例**（可及性 ≠ 存在性）。写模型推不出读模型。

**演化半径**：加一个字段（如 `:task/priority`）= 5 处显式位置——registry、DDL、两个映射函数各一行、API/前端同步；属性测试的生成器自动跟随 schema 不用动。没有反射没有魔法，每字段两行，心智负担恒定且可审计——这就是"Clojure 不需要 ORM"的完整含义。

## 四、malli 作为契约层的惯用法

1. **registry 一份词汇表**：所有 schema 注册进 `::m/registry`，跨上下文共享内核。加新领域词 = 加一个 registry 条目。
2. **跨字段不变量用 `:fn`**：
   ```clojure
   [:and [:map [:time/start :int] [:time/end [:maybe :int]]]
         [:fn '(fn [{:time/keys [start end]}] (or (nil? end) (> end start)))]]
   ```
   注意 `:fn` 里的代码是数据——这份 schema 同时也是该不变量的**可执行文档**。
3. **错误信息给人看**：`malli.error/humanize`；对前端字段级提示用 `(m/explain schema value)` 的结构化输出。
4. **生成器派生**：`malli.generator` 从 schema 直接出 test.check 生成器——schema 约束（`:min :enum :and`）自动变成"非法状态不可表示"的测试侧等价物。
5. **对外发布语言**：`(m/json-schema registry)` → OpenAPI——下游 TS 系统可以从此生成自己的类型。一份定义，三个消费层。

## 五、测试策略（TDD 的 Clojure 形态）

| 测试类型 | 目标 | 工具 |
|---|---|---|
| 聚合属性测试 | 任意合法命令序列作用后，不变量永不被破坏 | test.check：生成器 = malli schema，断言 = 不变量函数 |
| 状态机测试 | 实体生命周期所有合法迁移可达、非法迁移被拒 | 生成随机迁移序列，断言 ex-info 类型 |
| 边界拒绝测试（负空间） | 非法输入在边界被拦 | 生成器**故意**构造非法值（改 registry 副本），断言 400/422 |
| roundtrip 测试 | 仓储层读写无损 | 随机领域对象 → 入库 → 读回 → 深比较 |
| 契约测试 | API 出入符合发布语言 | reitit coercion 已覆盖大半，补错误形态断言 |

要点：属性测试替代不了示例测试（业务可读性），两者并存；先写属性抓不变量，再写示例做文档。

## 六、反模式清单（Clojure DDD 的死法）

1. **裸 map 裸传**：无任何 schema 的 map 跨层流动——shape 漂移的温床。
2. **`update-in` 散落**：调用方直接改实体内部字段，绕过聚合写函数——不变量形同虚设。
3. **关键字不带命名空间**：`:status` `:name` 满天飞，通用语言被稀释，跨上下文撞名。
4. **schema 只验入不验出**：返回值不校验，shape 漂移照样出厂（响应 coercion 治这个）。
5. **DB 行结构直出当领域模型**：存储格式泄漏成 API 格式，改表即破坏契约。
6. **过早协议化**：第二种仓储实现还没出现就先 defprotocol——抽象债。
7. **spec 全局 instrument 挂错钩子**：instrument 应在 dev 启动时装配，别塞进命名空间加载副作用——热重载会被它打断。
8. **把领域规则写进 SQL 查询**：查询里的业务逻辑是投影的事，写模型的事归写函数。

## 七、模型演化纪律

每次领域变更走完整环，不许跳步：

1. **改通用语言**：registry 里加/改/删 schema 条目，注释写业务理由；
2. **改不变量**：L2 写函数 + L3 DB 约束同步改；
3. **改投影**：查询/前端同步更新；
4. **补测试**：属性测试的生成器自动跟随 schema，重点补"旧数据 → 新模型"的迁移断言；
5. **数据迁移**：手写迁移脚本（本阶段不用迁移工具，但迁移本身要当一次交付对待）。

拆聚合、并上下文、跨边界移动概念时，先做第 1 步再看依赖图——依赖图会立刻告诉你这次演化有多贵。

## 八、与 loom-mesh 的咬合点

- **聚合写路径 = do 干预的作用面**：do(注入金标准记忆)、do(回滚) 这类干预原语，物理落点就是各上下文的写函数面 + 会话日志。do-harness 的产品概念在 Clojure 实现里没有翻译损失。
- **事件溯源免费**：领域事件流即会话日志的前身；投影模式（日志 → app-db）就是 loom-mesh Web UI 的架构原语。
- **registry 即协议词汇表**：loom-mesh 插件协议的数据部分可以直接从 malli registry 生成 JSON Schema——协议即词汇表，词汇表即代码。

## 九、资源

| 资源 | 定位 |
|---|---|
| **JUXT 博客《Simple, Tactical Domain Driven Design in Clojure》**（juxt.pro/blog/tactical-ddd，2023） | Clojure 专属战术 DDD 实战：实体/值对象/聚合不变量/仓储全实现，社区锚点 |
| **《Learning Domain-Driven Design》**（Vladik Khononov） | 战略设计主参考，现代、精炼、语言无关 |
| **《Domain Modeling Made Functional》**（Scott Wlaschin） | 类型驱动建模圣经；练习：把书中招式用 malli 重写 |
| **Eric Evans《DDD 参考卡》**（Domain-Driven Design Reference） | 战术模式速查，百页以内 |
| re-frame / reitit / malli / next.jdbc 官方文档 | 各阶段的 API 层 |
