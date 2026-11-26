# taskloom

任务聚合 Kanban 学习项目——以每次真实工作为中心，练习 TaskInstance、ExecutionSegment、TaskTemplate、平级组合与行为投影。

技术栈：Clojure、Ring/Reitit/http-kit、next.jdbc/HoneySQL、SQLite 与 malli。`main` 仍是纯后端学习分支，不包含 CLJS、React、UIx 或 npm 构建配置。

## 当前领域基线

当前权威模型是 `doc/任务聚合Kanban系统-DDD领域设计-v0.2.md`，不再是早期“Task CRUD + Timer + 统计”种子。

| 子域 | 类型 | 当前对象 |
|---|---|---|
| 任务实例与执行事实 | 支撑 | TaskInstance、TaskBackground、ExecutionSegment、TaskResult |
| 类任务与类型演化 | 核心 | TaskTemplate、实例模板归属 |
| 工作组合与顺序 | 支撑 | TaskRelation、TaskSet、Membership、ExecutionPlan 角色 |
| 行为观察与复盘 | 核心 | 行为时间序列与候选解释 |

实施顺序：**实例事实 → 平级组合与顺序 → 第二个实例确认模板 → 行为观察**。核心子域不等于最先实现，稳定事实必须先于分析。

## 项目状态

| 层 | 状态 | 说明 |
|---|---|---|
| 领域词汇表 `loom.schema` | ✅ v0.2 脚手架 | 实例、背景、结果、执行段、模板、关系与组合 schema |
| 存储模型 `loom.db` | ✅ v0.2 脚手架 | CHECK、FK、成员唯一、关系自环与全局活跃段部分唯一索引 |
| 后端基线 `app.main` | ✅ 可运行 | `/health`、`/echo`，默认端口 3080 |
| 写路径 `loom.task` / `loom.time` | ⬜ 所有者练习 | 语义命令签名与 docstring 已对齐，函数体继续抛 `:stage 3` |
| 测试 `test/loom` | ⬜ 留桩 | 8 个 `^:pending` 测试描述当前及后续切片验收，不提前改绿 |
| 纯 HTML 原型 | ✅ 交互参考 | 仅参考信息架构；localStorage 状态与硬编码统计不是数据契约 |

DDL 中的 `IF NOT EXISTS` 只负责初始化空库，不会迁移旧 `data/*.db`。

## 运行后端

```bash
clj -M -m app.main
```

```bash
curl http://localhost:3080/health
curl -X POST http://localhost:3080/echo \
  -H 'Content-Type: application/json' \
  -d '{"message":"hello"}'
```

依赖门控：进入后续阶段时再取消 `deps.edn` 对应依赖注释，一次只加一样。

## 测试与结构检查

```bash
clojure -P
clojure -M:test --skip-meta pending
```

现有 pending 测试会主动抛出“待实现”异常，属于后续业务阶段留桩，不应在当前阶段改成通过。

## REPL

使用 `clj` 或编辑器 jack-in。探索代码先放 `src/user.clj`，行为稳定后再迁入正式命名空间。详细工具链坑见 `doc/阶段技术指引.md`。

## 文档地图

- `doc/任务聚合Kanban系统-DDD领域设计-v0.2.md` — 当前对象、规则、操作和切片顺序。
- `doc/DDD建模示例.md` — 贯穿式领域词汇、四子域划分与两个完整 ADR 示例。
- `doc/domain-analysis.md` — 对象筛选、不变量与 Clojure 落点工作表。
- `doc/decisions.md` — 所有者真实待决 ADR；示例不自动关闭这些决策。
- `doc/Clojure全栈DDD学习路径-任务待办管理demo.md` — 六阶段任务卡与验收走查。
- `doc/Clojure-DDD实践指南.md` — 战术模式、事务边界、投影、存储与测试纪律。
- `doc/阶段技术指引.md` — REPL、SQLite、依赖、构建等已撞技术坑。
- `frontend-demo/迹_纯HTML_JS工程/` — 纯 HTML/JS 交互原型，直接用静态服务器打开即可。

## 分支快照

| 分支 | 用途 |
|---|---|
| `main` | 纯后端练习主线，按垂直切片提交 |
| `template/fullstack` | 原始 Clojure + ClojureScript/UIx 模板存档，固定在 `991c7c2`，永不修改 |

后续接入 CLJS 时参考模板配置和纯 HTML 原型，但不要修改模板存档，也不要把原型演示状态当成后端 schema。
- `doc/superpowers/` — 历史设计存档（模板剥离设计 spec 与 plan），现行文档都在 `doc/` 根下。


## License

MIT
