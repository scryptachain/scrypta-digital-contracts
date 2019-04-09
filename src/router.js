import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import Dashboard from './views/Dashboard.vue'
import NewContract from './views/NewContract.vue'
import ManageIdentity from './views/ManageIdentity.vue'
import SearchContracts from './views/SearchContracts.vue'

Vue.use(Router)

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: Dashboard
    },
    {
      path: '/new-contract',
      name: 'contracts-new',
      component: NewContract
    },
    {
      path: '/identity',
      name: 'identity',
      component: ManageIdentity
    },
    {
      path: '/search-contracts',
      name: 'contracts-search',
      component: SearchContracts
    }
  ]
})
