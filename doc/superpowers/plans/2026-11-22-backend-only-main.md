# Backend-Only Main Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Archive the current full-stack template at 991c7c2 and turn main into a minimal, runnable JVM/Clojure backend without implementing new business behavior.

**Architecture:** Preserve the existing mainline history and add a template/fullstack branch at the original HEAD. Remove only the CLJS runtime, frontend build configuration, and frontend-only dependencies; retain the existing Ring/Reitit/http-kit service and backend learning documents.

**Tech Stack:** Git, Clojure CLI, Ring, Reitit, http-kit, Muuntaja, Malli, Kaocha, curl, lsof

---

## File Structure

- Delete `src/loom/ui.cljs`: the UIx application and all CLJS source in the repository.
- Delete `shadow-cljs.edn`: frontend compilation, development server, and CLJS nREPL configuration.
- Delete `package.json`: npm scripts and React/UIx frontend packages.
- Delete `public/index.html`: browser application entry point; remove the empty public directory.
- Modify `deps.edn`: retain the backend source paths, runtime libraries, and test alias only.
- Modify `.gitignore`: retain JVM, editor, and runtime-data ignores; remove frontend build outputs.
- Modify `README.md`: document the backend-only main branch and the full-stack template branch.
- Modify `doc/Clojure全栈DDD学习路径-任务待办管理demo.md`: mark stage 5 configuration as belonging to template/fullstack.
- Modify `docs/superpowers/specs/2026-11-22-backend-only-main-design.md`: record that the written specification has been reviewed.
- No application source under `src/app` or `src/loom` is changed, and no business test is changed.

### Task 1: Archive the Original Full-Stack Main

**Files:**
- No file changes; create only the Git ref `refs/heads/template/fullstack`.

- [ ] **Step 1: Confirm the repository and original template commit**

Run:

```bash
cd /Users/blitz/dev_ops/uix-todo
git status --short --branch
git cat-file -t 991c7c2
git rev-parse origin/main
```

Expected: the current branch is main, `991c7c2` is a commit, and origin/main still resolves to `991c7c2`. Existing untracked `.cpcache/` and `.clj-kondo/imports/` entries may remain; no tracked source file may be modified.

- [ ] **Step 2: Verify that tracked files are clean before creating the archive ref**

Run:

```bash
cd /Users/blitz/dev_ops/uix-todo
git diff --quiet
git diff --cached --quiet
```

Expected: both commands exit 0. The already committed design and plan documents are allowed.

- [ ] **Step 3: Create the template branch at the original commit**

Run:

```bash
cd /Users/blitz/dev_ops/uix-todo
git branch template/fullstack 991c7c2
```

Expected: the command creates the branch without switching away from main.

- [ ] **Step 4: Prove that the template is an exact snapshot**

Run:

```bash
cd /Users/blitz/dev_ops/uix-todo
test "$(git rev-parse template/fullstack)" = "$(git rev-parse 991c7c2)"
test "$(git branch --show-current)" = "main"
git diff --exit-code 991c7c2 template/fullstack
```

Expected: all commands exit 0; the branch names are `template/fullstack` and `main`, and the diff is empty.

### Task 2: Remove the Frontend Runtime and Build Configuration

**Files:**
- Delete: `src/loom/ui.cljs`
- Delete: `shadow-cljs.edn`
- Delete: `package.json`
- Delete: `public/index.html`
- Modify: `deps.edn`
- Modify: `.gitignore`

- [ ] **Step 1: Remove all tracked frontend entry points and build files**

Run:

```bash
cd /Users/blitz/dev_ops/uix-todo
git rm -- src/loom/ui.cljs shadow-cljs.edn package.json public/index.html
rmdir public 2>/dev/null || true
```

Expected: Git stages four deletions. The `public` directory is removed if empty; unrelated untracked cache directories are untouched.

- [ ] **Step 2: Replace deps.edn with the backend-only dependency manifest**

Write the complete file `/Users/blitz/dev_ops/uix-todo/deps.edn`:

```clojure
{:paths ["src" "resources"]

 ;; JVM/Clojure 后端依赖的唯一清单。
 :deps {org.clojure/clojure {:mvn/version "1.12.7"}
        ;; ── 已启用：阶段2基线 + 领域词汇表 ──
        metosin/reitit       {:mvn/version "0.11.0"}
        http-kit/http-kit    {:mvn/version "2.8.0"}
        metosin/muuntaja     {:mvn/version "0.6.10"}
        metosin/malli        {:mvn/version "0.20.1"}
        ;; ── 门控：进入对应阶段时取消注释（一次只加一样）──
        ;; 阶段3 数据层   com.github.seancorfield/next.jdbc {:mvn/version "1.3.955"}
        ;;                org.xerial/sqlite-jdbc            {:mvn/version "3.46.1.3"}
        ;;                com.github.seancorfield/honeysql  {:mvn/version "2.7.1437"}
        ;; 阶段4 REST校验 metosin/reitit-malli {:mvn/version "0.11.0"}
        ;; 阶段5 日期边界 juxt/tick           {:mvn/version "<以 Clojars 最新为准>"}
        }

 :aliases
 {:test {:extra-paths ["test"]
         :extra-deps  {lambdaisland/kaocha {:mvn/version "1.91.1392"}}
         :main-opts   ["-m" "kaocha.runner"]}
  ;; 阶段6 uberjar：届时引入 io.github.clojure/tools.build + build.clj
  }}
```

Expected: no shadow-cljs, UIx, binaryage/devtools, or `:dev` entry remains. Backend dependency versions and the `:test` alias are unchanged.

- [ ] **Step 3: Replace .gitignore with backend-relevant entries**

Write the complete file `/Users/blitz/dev_ops/uix-todo/.gitignore`:

```gitignore
# Clojure / JVM
target/
classes/
.cpccache/
.nrepl-port
*.class

# 编辑器
.lsp/
.clj-kondo/.cache

# 运行时数据
*.db
*.db-journal
data/
log.edn
```

Expected: the frontend build-output section is gone; JVM, editor, and runtime-data entries remain unchanged.

### Task 3: Make the Documentation Match the Backend-Only Main

**Files:**
- Modify: `README.md`
- Modify: `doc/Clojure全栈DDD学习路径-任务待办管理demo.md`
- Modify: `docs/superpowers/specs/2026-11-22-backend-only-main-design.md`

- [ ] **Step 1: Replace README.md with backend-only usage and branch guidance**

Write the complete file `/Users/blitz/dev_ops/uix-todo/README.md`:

```markdown
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
clojure -M:test -- --skip-meta pending
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
```

Expected: README contains no npm or shadow-cljs startup instructions and explains both branch roles.

- [ ] **Step 2: Correct the two current-state claims in the stage 5 learning card**

In `/Users/blitz/dev_ops/uix-todo/doc/Clojure全栈DDD学习路径-任务待办管理demo.md`, replace exactly:

```markdown
1. shadow-cljs 链路（本仓库已配好：deps.edn 双轨 + dev-http 代理 /api → 3080）。
2. 组件层用 UIx 2（本仓库现状）；明确记录：换 Reagent 是机械替换，本阶段不引入。
```

with:

```markdown
1. shadow-cljs 链路（模板分支 `template/fullstack` 已配好：deps.edn 双轨 + dev-http 代理 /api → 3080；纯后端 main 已移除此配置）。
2. 组件层用 UIx 2（模板分支现状）；明确记录：换 Reagent 是机械替换，本阶段不引入。
```

Expected: the rest of the learning path is unchanged.

- [ ] **Step 3: Mark the design specification as reviewed**

In `/Users/blitz/dev_ops/uix-todo/docs/superpowers/specs/2026-11-22-backend-only-main-design.md`, replace:

```markdown
- 状态：设计已获用户批准，待书面规格复核
```

with:

```markdown
- 状态：设计与书面规格均已获用户批准
```

Expected: only the status line changes.

### Task 4: Verify, Commit, and Publish Both Branch Snapshots

**Files:**
- Verify all changes from Tasks 1–3.
- Create one backend-stripping commit on main.
- Publish `template/fullstack` and `main` to origin.

- [ ] **Step 1: Check the tracked project structure**

Run:

```bash
cd /Users/blitz/dev_ops/uix-todo
test -z "$(git ls-files -- '*.cljs' 'shadow-cljs.edn' 'package.json' 'public/**')"
test -z "$(git diff --cached --name-only --diff-filter=A)"
git diff --check
git status --short
```

Expected: no tracked CLJS or frontend build entry remains, no new cache file is staged, the whitespace check passes, and status shows only the intended tracked edits plus the original untracked cache directories.

- [ ] **Step 2: Prepare dependencies and load every backend namespace**

Run:

```bash
cd /Users/blitz/dev_ops/uix-todo
clojure -P
clojure -M -e "(require 'app.main 'loom.db 'loom.schema 'loom.task 'loom.time) (println :backend-namespaces-loaded)"
```

Expected: both commands exit 0 and the second prints `:backend-namespaces-loaded`. Merely loading the business namespaces must not execute their stage 3 stubs.

- [ ] **Step 3: Run the non-pending test suite**

Run:

```bash
cd /Users/blitz/dev_ops/uix-todo
clojure -M:test -- --skip-meta pending
```

Expected: Kaocha exits 0 and reports zero failures/errors; pending business tests are excluded rather than rewritten.

- [ ] **Step 4: Smoke-test health and echo on an isolated port**

Run this complete script:

```bash
cd /Users/blitz/dev_ops/uix-todo
PORT=3180
LOG=/tmp/taskloom-backend-only-smoke.log

if lsof -nP -ti :"$PORT" >/dev/null; then
  echo "Port $PORT is already in use" >&2
  exit 1
fi

clj -M -e "(require '[app.main :as main]) (main/start! $PORT) @(promise)" >"$LOG" 2>&1 &
SERVER_PID=$!

cleanup() {
  PIDS=$(lsof -nP -ti :"$PORT" 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    kill $PIDS
  fi
  wait "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT

READY=0
for _ in $(seq 1 30); do
  if curl --fail --silent http://localhost:"$PORT"/health >/dev/null; then
    READY=1
    break
  fi
  sleep 1
done

if [ "$READY" -ne 1 ]; then
  cat "$LOG" >&2
  exit 1
fi

HEALTH=$(curl --fail --silent http://localhost:"$PORT"/health)
ECHO=$(curl --fail --silent -X POST http://localhost:"$PORT"/echo   -H 'Content-Type: application/json'   -d '{"message":"backend-only"}')

test "$HEALTH" = '{"status":"ok"}'
test "$ECHO" = '{"message":"backend-only"}'
printf 'health=%s\necho=%s\n' "$HEALTH" "$ECHO"
```

Expected: the script exits 0 and prints both exact JSON bodies. Its trap kills the actual listener found by `lsof`, not only the Clojure CLI parent process.

- [ ] **Step 5: Review and commit exactly the backend-stripping changes**

Run:

```bash
cd /Users/blitz/dev_ops/uix-todo
git diff --stat HEAD
git diff --cached --stat
git add -u
git diff --cached --check
git diff --cached --name-status
git commit -m "refactor: 剥离 CLJS 前端，保留纯后端基线"
```

Expected: the staged list contains only the four frontend deletions and the intended edits to `deps.edn`, `.gitignore`, `README.md`, the learning path, and the design status. The commit succeeds without adding cache directories.

- [ ] **Step 6: Verify the committed branch topology and clean tracked state**

Run:

```bash
cd /Users/blitz/dev_ops/uix-todo
git diff --quiet
git diff --cached --quiet
test "$(git rev-parse template/fullstack)" = "$(git rev-parse 991c7c2)"
git log --oneline --decorate -4
git status --short --branch
```

Expected: tracked files are clean, main is ahead of origin/main, template/fullstack still points to 991c7c2, and only the pre-existing untracked cache directories remain.

- [ ] **Step 7: Push the immutable template and the new backend main**

Run:

```bash
cd /Users/blitz/dev_ops/uix-todo
git push -u origin template/fullstack
git push origin main
```

Expected: both pushes succeed as fast-forward/new-branch updates; no force push is used.

- [ ] **Step 8: Verify remote snapshot identities**

Run:

```bash
cd /Users/blitz/dev_ops/uix-todo
git ls-remote --heads origin main template/fullstack
test "$(git rev-parse template/fullstack)" = "$(git rev-parse 991c7c2)"
test "$(git rev-parse main)" = "$(git rev-parse origin/main)"
git status --short --branch
```

Expected: origin/main equals local main, origin/template/fullstack is present, template/fullstack remains at 991c7c2, and no tracked change remains.
