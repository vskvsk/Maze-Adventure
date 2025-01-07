import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import { formatTime } from './utils/filters'

// 初始化事件总线
Vue.prototype.$bus = new Vue()

// 注册全局过滤器
Vue.filter('formatTime', formatTime)

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
