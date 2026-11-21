(ns app.core
  (:require [uix.core :as uix :refer [defui $]]
            [uix.dom]))

;;; ---------------- 数据模型 ----------------
;;; todo 就是一个 map: {:id 123 :title "买牛奶" :done? false}

(defn new-todo [title]
  {:id (random-uuid)
   :title title
   :done? false})

(def filters {:all "全部" :active "未完成" :done "已完成"})

;;; ---------------- 组件 ----------------

(defui todo-input [{:keys [on-add]}]
  (let [[title set-title!] (uix/use-state "")
        submit! (fn []
                  (when-not (clojure.string/blank? title)
                    (on-add (new-todo title))
                    (set-title! "")))]
    ($ :input
       {:value title
        :placeholder "要做的事，回车添加"
        :on-change #(set-title! (.. % -target -value))
        :on-key-down #(when (= "Enter" (.-key %)) (submit!))})))

(defui todo-item [{:keys [todo on-toggle on-delete]}]
  ($ :li
     {:class (when (:done? todo) "done")}
     ($ :input {:type "checkbox"
                :checked (:done? todo)
                :on-change #(on-toggle (:id todo))})
     ($ :span (:title todo))
     ($ :button {:on-click #(on-delete (:id todo))} "×")))

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
  (let [[todos set-todos!] (uix/use-state [])
        [filter* set-filter!] (uix/use-state :all)
        visible (uix/use-memo
                 (fn []
                   (case filter*
                     :active (remove :done? todos)
                     :done (filter :done? todos)
                     todos))
                 [todos filter*])
        items-left (uix/use-memo (fn [] (count (remove :done? todos))) [todos])]
    ($ :main
       ($ :h1 "Todo")
       ($ todo-input {:on-add #(set-todos! conj todos %)})
       ($ :ul
          (for [todo visible]
            ($ todo-item {:key (:id todo)
                          :todo todo
                          :on-toggle (fn [id]
                                       (set-todos!
                                        (fn [ts]
                                          (mapv (fn [t]
                                                  (if (= id (:id t))
                                                    (update t :done? not)
                                                    t))
                                                ts))))
                          :on-delete (fn [id]
                                       (set-todos! (fn [ts] (vec (remove #(= id (:id %)) ts)))))})))
       ($ filter-bar {:active-filter filter*
                      :on-filter set-filter!
                      :items-left items-left}))))

;;; ---------------- 入口 ----------------

(defonce root (uix.dom/create-root (js/document.getElementById "root")))

(defn start []
  (uix.dom/render-root ($ app) root))
