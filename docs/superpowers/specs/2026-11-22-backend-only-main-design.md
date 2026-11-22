# 纯后端 main 与全栈模板分支设计

- 日期：2026-11-22
- 项目：taskloom（/Users/blitz/dev_ops/uix-todo）
- 状态：设计已获用户批准，待书面规格复核

## 背景

当前 main 的 HEAD 为 991c7c2，同时包含 JVM/Clojure 后端、UIx 2 + React 19 前端、shadow-cljs 构建配置和全栈学习文档。第一阶段需要保留这一完整快照，并让 main 成为聚焦后端练习的纯 Clojure 项目。

## 目标

1. 用 template/fullstack 分支完整存档原始 main（991c7c2）。
2. 让 main 只保留后端运行所需的源码、依赖和配置。
3. 保持现有后端 /health、/echo 行为不变。
4. 保留后续全栈练习所需的学习资料，并明确其适用范围。
5. 将模板分支和纯后端 main 推送到 origin，形成可恢复的阶段快照。

## 非目标

- 不实现 loom.task、loom.time 中的后端业务留桩。
- 不新增或修改 API，不调整现有后端架构。
- 不完成 ^:pending 测试，不将其标记为通过。
- 不纳入 .cpcache/、.clj-kondo/imports/ 等本地未跟踪缓存。
- 不在本阶段重新实现或迁移前端。

## 方案比较

### 采用：轻量剥离，保留全栈学习资料

删除前端代码、构建入口和依赖，README 改为后端项目说明；学习路径与 ADR 继续作为后续阶段资料保存。该方案改动集中，同时保留完整学习路线。

### 不采用：彻底后端化所有文档

进一步删除学习路径中的前端阶段、前端 ADR 和 CLJS 参考资料。虽然文档更纯粹，但会扩大本阶段改动面，并损失后续全栈练习路线。

## 分支与提交设计

1. template/fullstack 必须准确指向原始提交 991c7c2，不包含后续设计文档或剥离提交。
2. main 保留现有历史，在原 HEAD 上追加设计文档提交和纯后端剥离提交。
3. 推送 origin/template/fullstack 与 origin/main，不重写公共历史，不使用 force push。
4. 模板分支只作存档；后续后端练习继续在 main 上进行。

## 文件与依赖调整

### 删除

- src/loom/ui.cljs
- shadow-cljs.edn
- package.json
- public/index.html 及因此为空的 public/ 目录

### deps.edn

- 删除 thheller/shadow-cljs、com.pitch/uix.core、com.pitch/uix.dom。
- 删除仅供前端开发使用的 :dev alias 与 binaryage/devtools。
- 保留 org.clojure/clojure、Reitit、http-kit、Muuntaja、Malli。
- 保留 :test alias、后续后端阶段依赖注释和 resources 源路径约定。
- 将依赖清单说明改为纯 JVM/Clojure 后端语境。

### .gitignore

删除 public/js/、node_modules/、.shadow-cljs/、out/ 等前端构建条目；保留 JVM、编辑器和运行时数据条目。

## 文档调整

- README.md：项目定位改为 Clojure 后端 + DDD 练习；删除前端状态、npm/shadow-cljs 启动和双 REPL 说明；保留后端启动方式；说明 template/fullstack 是完整全栈模板快照。
- doc/ 下的学习路径、实践指南和 ADR 保留，供后续后端及全栈阶段使用。
- 对学习路径中“本仓库已配好前端”等当前状态表述做最小修正，明确其对应 template/fullstack，而非纯后端 main。
- 本设计文档记录分支边界与验收标准。

## 验证设计

1. 分支存档：template/fullstack 与 991c7c2 指向同一提交。
2. 结构检查：Git 跟踪文件中不存在 .cljs 源文件、shadow-cljs.edn、package.json 或 public/ 前端入口。
3. 依赖检查：Clojure CLI 能基于精简后的 deps.edn 准备依赖并加载后端命名空间。
4. HTTP 冒烟：在临时端口启动 app.main，确认 GET /health 返回 200 且状态为 ok；POST /echo 返回 200 并回显 JSON。
5. 测试：运行非 pending 测试；现有 ^:pending 测试继续作为后续业务阶段的验收预告，不把其预期失败描述为回归。
6. 工作区：最终 tracked 变更全部提交，原有未跟踪缓存保持不纳入版本控制。

## 提交与恢复

- 设计文档独立提交，便于审阅。
- 前端剥离作为单独提交，提交信息建议为 refactor: 剥离 CLJS 前端，保留纯后端基线。
- 如需完整全栈模板，直接切换 template/fullstack；如需查看剥离前状态，也可使用提交 991c7c2。
