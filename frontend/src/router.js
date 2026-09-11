import { createRouter, createWebHistory } from 'vue-router'
import Home       from './components/Home.vue'
import Admin      from './components/Admin.vue'
import Stock      from './components/Stock.vue'
import Statistics from './components/Statistics.vue'
import Login      from './components/Login.vue'
import { isAuthenticated } from './services/authService'

const Sales          = () => import('./components/sales/Sales.vue')
const Combos         = () => import('./components/admin/Combos.vue')
const ShippingZones  = () => import('./components/admin/ShippingZones.vue')
const OnlineOrders   = () => import('./components/admin/OnlineOrders.vue')

const StoreHome           = () => import('./components/store/StoreHome.vue')
const StoreCatalog        = () => import('./components/store/StoreCatalog.vue')
const StoreProductDetail  = () => import('./components/store/StoreProductDetail.vue')
const StoreComboDetail    = () => import('./components/store/StoreComboDetail.vue')
const Cart                = () => import('./components/store/Cart.vue')
const Checkout            = () => import('./components/store/Checkout.vue')
const OrderStatus         = () => import('./components/store/OrderStatus.vue')

const routes = [
  // ── Público: tienda online ────────────────────────────
  { path: '/',                    name: 'StoreHome',          component: StoreHome,          meta: { public: true } },
  { path: '/tienda',              name: 'StoreCatalog',       component: StoreCatalog,       meta: { public: true } },
  { path: '/producto/:id',        name: 'StoreProductDetail', component: StoreProductDetail, meta: { public: true } },
  { path: '/combo/:id',           name: 'StoreComboDetail',   component: StoreComboDetail,   meta: { public: true } },
  { path: '/carrito',             name: 'Cart',                component: Cart,               meta: { public: true } },
  { path: '/checkout',            name: 'Checkout',            component: Checkout,           meta: { public: true } },
  { path: '/pedido/:accessToken', name: 'OrderStatus',         component: OrderStatus,        meta: { public: true } },

  // ── Login ──────────────────────────────────────────────
  { path: '/login', name: 'Login', component: Login, meta: { public: true } },

  // ── Panel administrativo ───────────────────────────────
  { path: '/admin',                name: 'Home',           component: Home },
  { path: '/admin/panel',          name: 'Admin',          component: Admin },
  { path: '/admin/stock',          name: 'Stock',          component: Stock },
  { path: '/admin/sales',          name: 'Sales',          component: Sales },
  { path: '/admin/statistics',     name: 'Statistics',     component: Statistics },
  { path: '/admin/combos',         name: 'Combos',         component: Combos },
  { path: '/admin/shipping-zones', name: 'ShippingZones',  component: ShippingZones },
  { path: '/admin/online-orders',  name: 'OnlineOrders',   component: OnlineOrders }
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
