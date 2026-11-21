(ns loom.ui
  "阶段5投影层（cljs · UIx 2 + React 19）。
  当前状态：use-state 内核可运行（由 uix-todo 示例迁移，数据模型已对齐 loom.schema 词汇表）。
  阶段5验收后重接 re-frame：::http fx → event → app-db → subscription（见学习路径阶段5任务卡）。
  纪律：app-db 是后端状态的投影，不是另一份事实（ADR-004 语境）。"
  (:require [clojure.string :as str]
            [uix.core :as uix :refer [defui $]]
            [uix.dom]))

;;; ---------------- 数据模型（loom.schema 词汇表的 cljs 侧）----------------
;;; 状态值与 ::task/status 枚举对齐；后端接通后此 map 即 API 往返的数据形态。

(defn new-task [title]
  {:task/id     (random-uuid)
   :task/title  title
   :task/status :task.status/todo})

(def filters {:all "全部" :active "进行中" :done "已完成"})

(defn- done? [t]
  (= :task.status/done (:task/status t)))

;;; ---------------- 组件 ----------------

(defui task-input [{:keys [on-add]}]
  (let [[title set-title!] (uix/use-state "")
        submit! (fn []
                  (when-not (str/blank? title)
                    (on-add (new-task title))
                    (set-title! "")))]
    ($ :input
       {:value title
        :placeholder "要做的事，回车添加"
        :on-change #(set-title! (.. % -target -value))
        :on-key-down #(when (= "Enter" (.-key %)) (submit!))})))

(defui task-item [{:keys [task on-toggle on-delete]}]
  ($ :li
     {:class (when (done? task) "done")}
     ($ :input {:type "checkbox"
                :checked (done? task)
                :on-change #(on-toggle (:task/id task))})
     ($ :span (:task/title task))
     ($ :button {:on-click #(on-delete (:task/id task))} "×")))

(defui filter-bar [{:keys [active-filter on-filter items-left]}]
  ($ :div.filter-bar
     ($ :span (str "还剩 " items-left " 项"))
     (for [[f label] filters]
       ($ :button
          {:key f
           :class (when (= f active-filter) "active")
           :on-click #(on-filter f)}
          label))))

(defui app []
  (let [[tasks set-tasks!] (uix/use-state [])
        [filter* set-filter!] (uix/use-state :all)
        visible (uix/use-memo
                 (fn []
                   (case filter*
                     :active (remove done? tasks)
                     :done (filter done? tasks)
                     tasks))
                 [tasks filter*])
        items-left (uix/use-memo (fn [] (count (remove done? tasks))) [tasks])]
    ($ :main
       ($ :h1 "taskloom")
       ($ task-input {:on-add #(set-tasks! conj tasks %)})
       ($ :ul
          (for [task visible]
            ($ task-item {:key (:task/id task)
                          :task task
                          :on-toggle (fn [id]
                                       (set-tasks!
                                        (fn [ts]
                                          (mapv (fn [t]
                                                  (if (= id (:task/id t))
                                                    ;; 状态机在此显式声明（todo <-> done）
                                                    (update t :task/status
                                                            {:task.status/todo :task.status/done
                                                             :task.status/done :task.status/todo})
                                                    t))
                                                ts))))
                          :on-delete (fn [id]
                                       (set-tasks! (fn [ts] (vec (remove #(= id (:task/id %)) ts)))))})))
       ($ filter-bar {:active-filter filter*
                      :on-filter set-filter!
                      :items-left items-left}))))

;;; ---------------- 入口 ----------------

(defonce root (uix.dom/create-root (js/document.getElementById "root")))

(defn ^:dev/after-load reload! []
  (uix.dom/render-root ($ app) root))

(defn start []
  (uix.dom/render-root ($ app) root))
