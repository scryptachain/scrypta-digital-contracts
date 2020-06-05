import Vue from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'
import Buefy from 'buefy'
import './assets/style.scss'
import Gravatar from 'vue-gravatar'
import Vue2Editor from "vue2-editor";

Vue.config.productionTip = false
Vue.use(Buefy)
Vue.component('v-gravatar', Gravatar)
Vue.use(Vue2Editor)

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
