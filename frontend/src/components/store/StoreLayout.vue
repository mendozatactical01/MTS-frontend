<template>
  <div class="store-shell">
    <header class="store-header">
      <div class="store-header-inner">
        <router-link to="/" class="store-brand">
          <img src="../../assets/logo.jpeg" alt="Mendoza Tactical Store" class="store-logo" />
        </router-link>

        <nav class="store-nav">
          <router-link to="/" class="store-nav-link" exact-active-class="active">Inicio</router-link>
          <router-link to="/tienda" class="store-nav-link" active-class="active">Tienda</router-link>
        </nav>

        <router-link to="/carrito" class="store-cart-btn">
          <span class="store-cart-icon">🛒</span>
          <span v-if="cartCount > 0" class="store-cart-badge">{{ cartCount }}</span>
        </router-link>
      </div>
    </header>

    <main class="store-main">
      <slot />
    </main>

    <footer class="store-footer">
      <div class="store-footer-inner">
        <span>© {{ year }} Mendoza Tactical Store</span>
        <router-link to="/login" class="store-footer-admin">Panel administrativo</router-link>
      </div>
    </footer>
  </div>
</template>

<script>
import { getCount, getCart } from '../../services/cartService'

export default {
  name: 'StoreLayout',
  data() {
    return { cartCount: 0, year: new Date().getFullYear() }
  },
  mounted() {
    this.refreshCartCount()
    window.addEventListener('storage', this.refreshCartCount)
    window.addEventListener('mts-cart-updated', this.refreshCartCount)
  },
  beforeUnmount() {
    window.removeEventListener('storage', this.refreshCartCount)
    window.removeEventListener('mts-cart-updated', this.refreshCartCount)
  },
  methods: {
    refreshCartCount() {
      this.cartCount = getCount(getCart())
    }
  }
}
</script>

<style scoped>
.store-shell { min-height: 100vh; display: flex; flex-direction: column; background: var(--bg-base); }

.store-header {
  position: sticky; top: 0; z-index: 100;
  background: var(--bg-surface); border-bottom: 1px solid var(--border);
}
.store-header-inner {
  max-width: 1200px; margin: 0 auto; padding: 0.6rem 1.25rem;
  display: flex; align-items: center; gap: 1.5rem;
}
.store-brand { display: flex; align-items: center; flex-shrink: 0; }
.store-logo { height: 40px; width: auto; object-fit: contain; }

.store-nav { display: flex; gap: 1.25rem; flex: 1; }
.store-nav-link {
  font-family: var(--font-display); font-weight: 700; font-size: 0.9rem;
  letter-spacing: 0.05em; text-transform: uppercase; color: var(--text-secondary);
  text-decoration: none; padding: 0.4rem 0; border-bottom: 2px solid transparent;
  transition: var(--transition);
}
.store-nav-link:hover, .store-nav-link.active { color: var(--text-primary); border-bottom-color: var(--crimson); }

.store-cart-btn {
  position: relative; display: flex; align-items: center; justify-content: center;
  width: 38px; height: 38px; border-radius: var(--radius); background: var(--bg-card);
  border: 1px solid var(--border); text-decoration: none; font-size: 1.1rem; flex-shrink: 0;
}
.store-cart-btn:hover { background: var(--bg-hover); }
.store-cart-badge {
  position: absolute; top: -6px; right: -6px; background: var(--crimson);
  color: var(--text-primary); border-radius: 10px; font-family: var(--font-display);
  font-size: 0.65rem; font-weight: 700; min-width: 18px; height: 18px;
  display: flex; align-items: center; justify-content: center; padding: 0 4px;
}

.store-main { flex: 1; }

.store-footer { border-top: 1px solid var(--border); background: var(--bg-surface); margin-top: 2rem; }
.store-footer-inner {
  max-width: 1200px; margin: 0 auto; padding: 1.25rem;
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  flex-wrap: wrap; color: var(--text-muted); font-size: 0.82rem;
}
.store-footer-admin { color: var(--text-muted); text-decoration: none; }
.store-footer-admin:hover { color: var(--text-secondary); }

@media (max-width: 640px) {
  .store-header-inner { padding: 0.5rem 0.9rem; gap: 0.75rem; }
  .store-nav { gap: 0.75rem; }
  .store-logo { height: 32px; }
}
</style>
