import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import Dashboard from './views/Dashboard.vue'
import NewContract from './views/NewContract.vue'
import ManageDrafts from './views/ManageDrafts.vue'
import ManageContracts from './views/ManageContracts.vue'
import JoinContract from './views/JoinContract.vue'

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
      path: '/join/:id',
      name: 'contracts-draft',
      component: JoinContract
    },
    {
      path: '/drafts',
      name: 'drafts',
      component: ManageDrafts
    },
    {
      path: '/contracts',
      name: 'contracts',
      component: ManageContracts
    }
  ]
})
