<template>
  <div class="store-shell">
    <div class="store-announce" aria-label="Novedades de la tienda">
      <div class="store-announce-track">
        <span v-for="n in 2" :key="n" class="store-announce-group" :aria-hidden="n === 2 ? 'true' : null">
          <span v-for="msg in announcements" :key="msg" class="store-announce-msg">{{ msg }}</span>
        </span>
      </div>
    </div>

    <header class="store-header">
      <div class="store-header-inner">
        <button
          type="button"
          class="store-icon-btn"
          aria-label="Abrir menú"
          aria-controls="store-drawer"
          :aria-expanded="drawerOpen"
          @click="openDrawer"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
        </button>

        <router-link to="/" class="store-brand" aria-label="Mendoza Tactical Store, inicio">
          <StoreEmblem class="store-brand-emblem" />
          <span class="store-brand-text">Mendoza Tactical <em>Store</em></span>
        </router-link>

        <div class="store-header-actions">
          <form class="store-search" role="search" @submit.prevent="submitSearch">
            <label for="store-search-input" class="sr-only">Buscar productos</label>
            <input id="store-search-input" v-model="searchText" type="search" placeholder="¿Qué buscás?" />
            <button type="submit" aria-label="Buscar">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            </button>
          </form>

          <router-link
            to="/carrito"
            class="store-icon-btn store-cart-btn"
            :aria-label="cartCount > 0 ? `Carrito, ${cartCount} producto${cartCount === 1 ? '' : 's'}` : 'Carrito, vacío'"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M7 7V6a5 5 0 0 1 10 0v1h3l-1 14H5L4 7h3Zm2 0h6V6a3 3 0 0 0-6 0v1Z"/></svg>
            <span v-if="cartCount > 0" class="store-cart-badge" aria-hidden="true">{{ cartCount }}</span>
          </router-link>
        </div>
      </div>
    </header>

    <div v-if="drawerOpen" class="store-drawer-backdrop" @click="closeDrawer"></div>
    <aside
      id="store-drawer"
      class="store-drawer"
      :class="{ 'is-open': drawerOpen }"
      :inert="!drawerOpen"
      aria-label="Menú principal"
      @keydown.esc="closeDrawer"
    >
      <div class="store-drawer-head">
        <span class="store-drawer-title">Menú</span>
        <button ref="drawerClose" type="button" class="store-icon-btn" aria-label="Cerrar menú" @click="closeDrawer">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>
        </button>
      </div>

      <form class="store-search store-drawer-search" role="search" @submit.prevent="submitSearch">
        <label for="store-drawer-search-input" class="sr-only">Buscar productos</label>
        <input id="store-drawer-search-input" v-model="searchText" type="search" placeholder="¿Qué buscás?" />
        <button type="submit" aria-label="Buscar">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        </button>
      </form>

      <nav class="store-drawer-nav">
        <router-link to="/" class="store-drawer-link" exact-active-class="active">Inicio</router-link>
        <router-link to="/tienda" class="store-drawer-link">Todos los productos</router-link>
        <template v-if="categories.length">
          <span class="store-drawer-label">Categorías</span>
          <router-link
            v-for="cat in categories"
            :key="cat.id"
            :to="{ path: '/tienda', query: { category: cat.id } }"
            class="store-drawer-link store-drawer-sublink"
          >{{ cat.name }}</router-link>
        </template>
        <span class="store-drawer-label">Mi compra</span>
        <router-link to="/carrito" class="store-drawer-link">Carrito</router-link>
      </nav>
    </aside>

    <main class="store-main">
      <slot />
    </main>

    <footer class="store-footer">
      <div class="store-footer-inner">
        <div class="store-footer-col store-footer-brand">
          <StoreEmblem class="store-footer-emblem" />
          <p>Indumentaria y equipamiento táctico, policial, outdoor y de pesca. Desde Mendoza a todo el país.</p>
        </div>

        <nav class="store-footer-col" aria-label="Menú del pie de página">
          <h2 class="store-footer-title">Menú táctico</h2>
          <router-link to="/">Inicio</router-link>
          <router-link to="/tienda">Productos</router-link>
          <router-link to="/carrito">Carrito</router-link>
        </nav>

        <nav v-if="categories.length" class="store-footer-col" aria-label="Categorías">
          <h2 class="store-footer-title">Categorías</h2>
          <router-link
            v-for="cat in categories.slice(0, 6)"
            :key="cat.id"
            :to="{ path: '/tienda', query: { category: cat.id } }"
          >{{ cat.name }}</router-link>
        </nav>

        <div class="store-footer-col">
          <h2 class="store-footer-title">Compra segura</h2>
          <p>Pagá con tarjeta, transferencia o efectivo a través de Mercado Pago.</p>
          <p>Envíos a todo el país.</p>
        </div>
      </div>

      <div class="store-footer-bottom">
        <span>© {{ year }} Mendoza Tactical Store. Todos los derechos reservados.</span>
        <router-link to="/login" class="store-footer-admin">Panel administrativo</router-link>
      </div>
    </footer>
  </div>
</template>

<script>
import StoreEmblem from './StoreEmblem.vue'
import { getCount, getCart } from '../../services/cartService'
import { getPublishedProducts } from '../../services/storeService'

export default {
  name: 'StoreLayout',
  components: { StoreEmblem },
  data() {
    return {
      cartCount: 0,
      year: new Date().getFullYear(),
      drawerOpen: false,
      searchText: '',
      categories: [],
      announcements: [
        'Envíos a todo el país',
        'Pagá con Mercado Pago',
        'Precio especial en efectivo y transferencia',
        'Equipamiento táctico, policial y de pesca'
      ]
    }
  },
  watch: {
    $route(to) {
      this.closeDrawer()
      this.searchText = to.query.search || ''
    }
  },
  mounted() {
    this.refreshCartCount()
    window.addEventListener('storage', this.refreshCartCount)
    window.addEventListener('mts-cart-updated', this.refreshCartCount)
    this.searchText = this.$route.query.search || ''
    this.loadCategories()
  },
  beforeUnmount() {
    window.removeEventListener('storage', this.refreshCartCount)
    window.removeEventListener('mts-cart-updated', this.refreshCartCount)
    document.body.style.overflow = ''
  },
  methods: {
    refreshCartCount() {
      this.cartCount = getCount(getCart())
    },
    async loadCategories() {
      try {
        const { data } = await getPublishedProducts()
        const map = new Map()
        data.forEach(p => { if (p.category) map.set(p.category.id, p.category) })
        this.categories = [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
      } catch {
        this.categories = []
      }
    },
    openDrawer() {
      this.drawerOpen = true
      document.body.style.overflow = 'hidden'
      this.$nextTick(() => this.$refs.drawerClose?.focus())
    },
    closeDrawer() {
      if (!this.drawerOpen) return
      this.drawerOpen = false
      document.body.style.overflow = ''
    },
    submitSearch() {
      const search = this.searchText.trim()
      this.$router.push({ path: '/tienda', query: search ? { search } : {} })
      this.closeDrawer()
    }
  }
}
</script>

<style scoped>
.store-shell { min-height: 100vh; display: flex; flex-direction: column; background: var(--bg-base); }

.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
}

/* ── Barra de anuncios (marquesina) ─────────────────────────── */
.store-announce { background: var(--crimson); color: #fff; overflow: hidden; white-space: nowrap; }
.store-announce-track { display: inline-flex; animation: store-marquee 32s linear infinite; }
.store-announce-group { display: inline-flex; }
.store-announce-msg {
  font-family: var(--font-display); font-weight: 600; font-size: 0.85rem;
  letter-spacing: 0.08em; text-transform: uppercase; padding: 0.45rem 2.5rem;
  position: relative;
}
.store-announce-msg::after {
  content: ''; position: absolute; right: -3px; top: 50%; width: 6px; height: 6px;
  background: rgba(255, 255, 255, 0.55); transform: translateY(-50%) rotate(45deg);
}
@keyframes store-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

/* ── Header ─────────────────────────────────────────────────── */
.store-header {
  position: sticky; top: 0; z-index: 100;
  background: rgba(13, 15, 14, 0.94); backdrop-filter: blur(6px);
  border-bottom: 1px solid var(--border);
}
.store-header-inner {
  max-width: 1400px; margin: 0 auto; padding: 0.75rem 1.5rem;
  display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 1rem;
}
.store-icon-btn {
  position: relative; display: inline-flex; align-items: center; justify-content: center;
  width: 42px; height: 42px; background: none; border: none; color: var(--text-primary);
  cursor: pointer; transition: var(--transition); text-decoration: none;
}
.store-icon-btn:hover { color: var(--crimson-light); }

.store-brand {
  display: flex; align-items: center; gap: 0.7rem; text-decoration: none; justify-self: center;
}
.store-brand-emblem { width: 34px; height: 38px; color: var(--crimson-light); }
.store-brand-text {
  font-family: var(--font-display); font-weight: 800; font-size: 1.35rem;
  letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-primary); line-height: 1;
}
.store-brand-text em { font-style: normal; color: var(--crimson-light); }

.store-header-actions { display: flex; align-items: center; justify-content: flex-end; gap: 0.75rem; }
.store-search {
  display: flex; align-items: center; border: 1px solid var(--border); border-radius: 50px;
  background: var(--bg-surface); padding-left: 1rem; transition: var(--transition);
}
.store-search:focus-within { border-color: var(--crimson-light); }
.store-search input {
  background: none; border: none; outline: none; color: var(--text-primary);
  font-family: var(--font-body); font-size: 0.9rem; width: 170px; padding: 0.5rem 0;
}
.store-search input::placeholder { color: var(--text-muted); }
.store-search button {
  background: none; border: none; color: var(--text-secondary); cursor: pointer;
  padding: 0.45rem 0.85rem; display: flex;
}
.store-search button:hover { color: var(--text-primary); }

.store-cart-badge {
  position: absolute; top: 2px; right: 0; background: var(--crimson); color: #fff;
  border-radius: 10px; font-family: var(--font-display); font-size: 0.68rem; font-weight: 700;
  min-width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; padding: 0 4px;
}

/* ── Drawer lateral ─────────────────────────────────────────── */
.store-drawer-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); z-index: 200; }
.store-drawer {
  position: fixed; top: 0; left: 0; bottom: 0; width: min(340px, 86vw); z-index: 201;
  background: var(--bg-surface); border-right: 1px solid var(--border);
  transform: translateX(-100%); visibility: hidden;
  transition: transform 0.25s ease, visibility 0s linear 0.25s;
  display: flex; flex-direction: column; overflow-y: auto;
}
.store-drawer.is-open { transform: translateX(0); visibility: visible; transition: transform 0.25s ease; }
.store-drawer-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.75rem 1rem 0.75rem 1.5rem; border-bottom: 1px solid var(--border);
}
.store-drawer-title {
  font-family: var(--font-display); font-weight: 700; font-size: 1.2rem;
  letter-spacing: 0.1em; text-transform: uppercase;
}
.store-drawer-search { display: none; margin: 1rem 1.5rem 0; }
.store-drawer-search input { width: 100%; }
.store-drawer-nav { display: flex; flex-direction: column; padding: 0.75rem 0 2rem; }
.store-drawer-label {
  font-family: var(--font-display); font-weight: 600; font-size: 0.78rem; letter-spacing: 0.12em;
  text-transform: uppercase; color: var(--text-muted); padding: 1.1rem 1.5rem 0.4rem;
}
.store-drawer-link {
  font-family: var(--font-display); font-weight: 600; font-size: 1.05rem; letter-spacing: 0.04em;
  text-transform: uppercase; color: var(--text-primary); text-decoration: none;
  padding: 0.6rem 1.5rem; border-left: 3px solid transparent; transition: var(--transition);
}
.store-drawer-link:hover, .store-drawer-link.active { background: var(--bg-hover); border-left-color: var(--crimson); }
.store-drawer-sublink { font-size: 0.95rem; color: var(--text-secondary); text-transform: none; font-family: var(--font-body); font-weight: 500; letter-spacing: 0; }

.store-main { flex: 1; }

/* ── Footer ─────────────────────────────────────────────────── */
.store-footer { background: #080909; border-top: 3px solid var(--crimson); }
.store-footer-inner {
  max-width: 1400px; margin: 0 auto; padding: 3rem 1.5rem 2rem;
  display: grid; grid-template-columns: 1.4fr 1fr 1fr 1.2fr; gap: 2rem;
}
.store-footer-col { display: flex; flex-direction: column; gap: 0.55rem; }
.store-footer-col p { color: var(--text-secondary); font-size: 0.9rem; }
.store-footer-col a { color: var(--text-secondary); text-decoration: none; font-size: 0.92rem; width: fit-content; }
.store-footer-col a:hover { color: var(--text-primary); }
.store-footer-emblem { width: 44px; height: 50px; color: var(--crimson-light); margin-bottom: 0.4rem; }
.store-footer-brand p { max-width: 300px; }
.store-footer-title {
  font-size: 1rem; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 0.4rem;
}
.store-footer-bottom {
  max-width: 1400px; margin: 0 auto; padding: 1.1rem 1.5rem; border-top: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;
  color: var(--text-muted); font-size: 0.82rem;
}
.store-footer-admin { color: var(--text-muted); text-decoration: none; }
.store-footer-admin:hover { color: var(--text-secondary); }

@media (max-width: 900px) {
  .store-footer-inner { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 760px) {
  .store-header-inner { grid-template-columns: auto 1fr auto; padding: 0.5rem 0.75rem; gap: 0.5rem; }
  .store-brand { justify-self: start; }
  .store-brand-text { font-size: 1.05rem; }
  .store-brand-emblem { width: 26px; height: 30px; }
  .store-header-actions .store-search { display: none; }
  .store-drawer-search { display: flex; }
}

@media (max-width: 520px) {
  .store-footer-inner { grid-template-columns: 1fr; padding-top: 2.25rem; }
}
</style>
