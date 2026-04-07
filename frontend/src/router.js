import { createRouter, createWebHistory } from 'vue-router'
import Home       from './components/Home.vue'
import Admin      from './components/Admin.vue'
import Stock      from './components/Stock.vue'
import Statistics from './components/Statistics.vue'
import Login      from './components/Login.vue'
import { isAuthenticated } from './services/authService'

const Sales = () => import('./components/sales/Sales.vue')

const routes = [
  { path: '/login',       name: 'Login',      component: Login,      meta: { public: true } },
  { path: '/',            name: 'Home',        component: Home },
  { path: '/admin',       name: 'Admin',       component: Admin },
  { path: '/stock',       name: 'Stock',       component: Stock },
  { path: '/sales',       name: 'Sales',       component: Sales },
  { path: '/statistics',  name: 'Statistics',  component: Statistics }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Guard: redirige al login si no está autenticado
router.beforeEach((to, from, next) => {
  if (to.meta.public) return next()
  if (!isAuthenticated()) return next({ name: 'Login', query: { redirect: to.fullPath } })
  next()
})

export default router
