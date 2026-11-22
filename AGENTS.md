# 协作约定（AGENTS）

本项目是所有者的 Clojure 实践练习 demo。代理（agent）与所有者的分工和完工协议如下，长期有效。

## 角色分工

- **所有者**：业务代码实现（`loom.task`/`loom.time`/`user.clj` 函数体）、领域决策（ADR①② 等）、REPL 练习。
- **代理**：依赖门解锁与解析验证、构建/测试环境配置、框架脚手架、技术文档（如 `doc/阶段技术指引.md`）、机械验证与发布。

## 完工协议（代理常设规则）

每完成一项代理侧任务，立即执行，不留待提交状态：

1. 验证先行：跑该任务对应的检查命令，拿到绿色证据（`clojure -P`、`clojure -M:test --skip-meta pending`、HTTP 冒烟、结构检查等）。
2. 精确暂存：`git add` 明确路径（提交实现类改动用 `git add -u`，绝不 `git add .` 拖入缓存）。
3. `git diff --cached --check` 通过后提交；提交信息用中文 conventional 前缀（deps:/docs:/fix:/refactor:/chore:）+ 要点正文。
4. `git push origin main`（fast-forward，无 force）。
5. 回报：改动文件、验证证据、提交 SHA。

## 红线

- 不 force push，不改写已推送历史。
- `template/fullstack`（991c7c2）是不可变模板存档，永不改动。
- 不实现 `loom.task`/`loom.time`/`user.clj` 业务函数体；不把 `:pending` 测试改绿（属阶段6练习）。
- 不替所有者做 ADR 决策；只在技术文档中列各选项的技术后果。
- 不提交缓存与运行时产物（.cpcache/、.clj-kondo/imports/、data/、*.db）。

## 环境备忘

- 测试命令形态：`clojure -M:test --skip-meta pending`（kaocha 不吃 `--` 透传）。
- 技术坑与分阶段指引见 `doc/阶段技术指引.md`；领域决策见 `doc/decisions.md`。
