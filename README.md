# taskloom

个人任务管理系统（时间管理、分配与统计）——Clojure 全栈 + DDD 实践项目。

在精确可建模的领域里，练习「限界上下文 → 聚合 → 不变量 → 投影」的完整 DDD 过程，同时跑通未来主栈（Ring/Reitit/http-kit · next.jdbc/HoneySQL · malli · UIx 2 · shadow-cljs）的每一层。

前身为 uix-todo（纯 UIx 2 前端示例），已整合为全栈模板：前端保留 UIx 2 + React 19 与 deps.edn 双轨依赖风格。

## 模板状态

| 层 | 状态 | 说明 |
|---|---|---|
| 领域词汇表 `loom.schema` | ✅ 完整 | malli registry：Task/TimeEntry schema + 量纲元数据 + `:fn` 不变量 |
| 存储模型 `loom.db` | ✅ 完整 | DDL 含全部 L3 约束（CHECK + 部分唯一索引） |
| 后端基线 `app.main` | ✅ 可运行 | 阶段2：`/health` `/echo`，`clj -M -m app.main` |
| 写路径 `loom.task` / `loom.time` | ⬜ 留桩 | 函数签名 + docstring + 决策点注释，body 抛 `:stage 3` |
| 前端 `loom.ui` | ✅ 可运行 | UIx 2 use-state 内核（数据模型已对齐 `:task/*` 词汇表），re-frame 接线留桩（阶段5） |
| 测试 `test/loom` | ⬜ 留桩 | `^:pending` 测试即验收标准预告（阶段6） |

## 领域模型（第一版通用语言）

| 限界上下文 | 聚合 | 关键不变量 |
|---|---|---|
| `loom.task` 任务 | Task | status ∈ `:todo :doing :done :archived`；标题 1–120 字符 |
| `loom.time` 时间 | TimeEntry | end > start；全局同时至多一个活跃计时 |

Timer 不建模为独立实体——它是 TimeEntry 的"end 为空"状态（ADR-001，可在阶段3推翻并记录新 ADR）。

## 运行

```bash
# 前端（UIx 2 · shadow-cljs 3）
npm install
clojure -M -m shadow.cljs.devtools.cli watch app   # http://localhost:8000

# 后端基线（阶段2，另开终端）
clj -M -m app.main                                  # http://localhost:3080/health
```

依赖门控：deps.edn 中阶段 ≥3 的依赖以注释备好，进入该阶段时取消注释——一次只加一样。

## REPL

shadow-cljs 启动后 nREPL 在 9000 端口；后端 jack-in 起第二个 REPL（clj）。双 REPL 纪律见学习路径阶段5。

## 文档

- `doc/decisions.md` — 领域决策日志（ADR）
- `doc/Clojure全栈DDD学习路径-任务待办管理demo.md` — 六阶段任务卡与验收标准
- `doc/Clojure-DDD实践指南.md` — 战术模式映射、垂直切片参考实现、不变量落点

## License

MIT
