# uix-todo

ClojureScript + UIx 2 Todo 示例。Clojure 1.12.7 · shadow-cljs 3.2.1 · UIx 1.4.9 · React 19.2。

## 运行

```bash
npm install
clojure -M -m shadow.cljs.devtools.cli watch app
```

打开 http://localhost:8000 。

## 结构

```
.
├── deps.edn            # JVM 侧依赖与源码路径（唯一依赖清单）
├── shadow-cljs.edn     # 构建配置（:deps true → 交给 deps.edn）
├── package.json        # npm 侧：react / react-dom / shadow-cljs CLI
├── public/
│   └── index.html
└── src/
    └── app/
        └── core.cljs   # 全部 UI + 状态
```

## REPL

shadow-cljs 启动后 nREPL 在 9000 端口。连接后：

```clojure
(shadow/repl :app)   ;; 切到 CLJS REPL
```
