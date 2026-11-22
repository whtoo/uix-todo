# taskloom

个人任务管理系统（时间管理、分配与统计）——Clojure 后端 + DDD 实践项目。

在精确可建模的领域里，练习「限界上下文 → 聚合 → 不变量 → 投影」的完整 DDD 过程，并逐层跑通 Ring/Reitit/http-kit、next.jdbc/HoneySQL 与 malli。

当前 main 是纯后端学习分支：保留 JVM/Clojure 源码、HTTP 基线、领域模型和测试，不包含 CLJS、React、UIx 或 npm 构建配置。

## 分支快照

| 分支 | 用途 |
|---|---|
| `main` | 纯后端练习主线，按后端阶段逐步提交 |
| `template/fullstack` | 原始 Clojure + ClojureScript/UIx 全栈模板快照，固定在提交 `991c7c2` |

如需查看或恢复完整前端模板，切换到 `template/fullstack`。后续重新接入前端时，以该分支和学习文档为参考。

## 项目状态

| 层 | 状态 | 说明 |
|---|---|---|
| 领域词汇表 `loom.schema` | ✅ 完整 | malli registry：Task/TimeEntry schema + 量纲元数据 + `:fn` 不变量 |
| 存储模型 `loom.db` | ✅ 完整 | DDL 含全部 L3 约束（CHECK + 部分唯一索引） |
| 后端基线 `app.main` | ✅ 可运行 | 阶段2：`/health` `/echo`，`clj -M -m app.main` |
| 写路径 `loom.task` / `loom.time` | ⬜ 留桩 | 函数签名 + docstring + 决策点注释，body 抛 `:stage 3` |
| 测试 `test/loom` | ⬜ 留桩 | `^:pending` 测试即后续业务阶段的验收标准预告 |

## 领域模型（第一版通用语言）

| 限界上下文 | 聚合 | 关键不变量 |
|---|---|---|
| `loom.task` 任务 | Task | status ∈ `:todo :doing :done :archived`；标题 1–120 字符 |
| `loom.time` 时间 | TimeEntry | end > start；全局同时至多一个活跃计时 |

Timer 不建模为独立实体——它是 TimeEntry 的“end 为空”状态（ADR-001，可在阶段3推翻并记录新 ADR）。

## 运行后端

```bash
clj -M -m app.main
```

服务默认监听 `http://localhost:3080`。

```bash
curl http://localhost:3080/health
curl -X POST http://localhost:3080/echo \
  -H 'Content-Type: application/json' \
  -d '{"message":"hello"}'
```

依赖门控：deps.edn 中后续阶段的依赖以注释备好，进入对应阶段时取消注释——一次只加一样。

## 测试

运行当前非 pending 测试：

```bash
clojure -M:test --skip-meta pending
```

现有 `^:pending` 测试会主动抛出“待实现”异常，属于后续业务阶段的留桩，不应在本阶段改成通过。

## REPL

使用 `clj` 或编辑器 jack-in 启动单个 JVM REPL。探索性代码先放在 `src/user.clj`，行为稳定后再迁入正式命名空间。

## 文档

- `doc/decisions.md` — 领域决策日志（ADR）
- `doc/Clojure全栈DDD学习路径-任务待办管理demo.md` — 后端与后续全栈阶段任务卡；前端配置对应模板分支
- `doc/Clojure-DDD实践指南.md` — 战术模式映射、垂直切片参考实现、不变量落点
- `docs/superpowers/specs/2026-11-22-backend-only-main-design.md` — 本次模板存档与前端剥离设计

## License

MIT
