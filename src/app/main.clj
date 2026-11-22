(ns app.main
  "阶段2基线：Ring + Reitit + http-kit 可运行最小服务。
  验收点（学习路径阶段2）：改 handler 后只 eval 该 defn，curl 立即反映新行为。"
  (:gen-class)
  (:require [muuntaja.core :as m]
            [org.httpkit.server :as http-kit]
            [reitit.ring :as ring]
            [reitit.ring.middleware.muuntaja :as muuntaja-mw]))

(def app
  "1-arity Ring handler：http-kit run-server 以请求 map 调用 Var 值，app 必须是处理函数本身。
  2026-11-22 冒烟发现模板缺陷：原 (defn app [] ...) 为零参函数，run-server 以 1 参调用
  触发 ArityException，导致 /health、/echo 每次请求 500。"
  (ring/ring-handler
   (ring/router
    [["/health" {:get (fn [_] {:status 200 :body {:status "ok"}})}]
     ["/echo"   {:post (fn [req] {:status 200 :body (:body-params req)})}]]
    {:data {:muuntaja    m/instance
            :middleware  [muuntaja-mw/format-middleware]}})
   (ring/create-default-handler)))

(defonce server (atom nil))

(defn stop! []
  (when-let [stop @server]
    (stop)
    (reset! server nil)))

(defn start!
  ([] (start! 3080))
  ([port]
   (stop!)
   (reset! server (http-kit/run-server #'app {:port port}))
   (println "taskloom listening on" port)))

(defn -main [& _]
  (start!))
