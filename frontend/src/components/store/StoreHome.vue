<template>
  <StoreLayout>
    <div class="hero">
      <div class="hero-inner">
        <div class="hero-badge">Equipamiento Táctico</div>
        <h1 class="hero-title">Mendoza<br>Tactical Store</h1>
        <p class="hero-subtitle">Indumentaria y equipamiento táctico, policial y de pesca. Envíos a todo el país.</p>
        <router-link to="/tienda" class="btn btn-primary btn-lg">Ver catálogo →</router-link>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <h2>Combos destacados</h2>
        <router-link to="/tienda" class="section-link">Ver todo →</router-link>
      </div>
      <div v-if="loading" class="empty-state"><div class="spinner" style="margin:0 auto"></div></div>
      <div v-else class="product-grid">
        <router-link v-for="combo in combos" :key="'combo-'+combo.id" :to="`/combo/${combo.id}`" class="product-card">
          <div class="product-card-img" :style="{ backgroundImage: `url(${combo.imageUrl})` }">
            <span class="badge badge-amber product-card-tag">Combo</span>
          </div>
          <div class="product-card-body">
            <h3>{{ combo.name }}</h3>
            <p class="product-card-price">${{ formatMoney(combo.price) }}</p>
          </div>
        </router-link>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <h2>Productos destacados</h2>
        <router-link to="/tienda" class="section-link">Ver todo →</router-link>
      </div>
      <div v-if="loading" class="empty-state"><div class="spinner" style="margin:0 auto"></div></div>
      <div v-else class="product-grid">
        <router-link v-for="product in products.slice(0, 4)" :key="'prod-'+product.id" :to="`/producto/${product.id}`" class="product-card">
          <div class="product-card-img" :style="{ backgroundImage: `url(${product.imageUrl})` }"></div>
          <div class="product-card-body">
            <h3>{{ product.name }}</h3>
            <p class="product-card-price">
              <template v-if="product.priceCash">${{ formatMoney(product.priceCash) }} <span class="price-strike">${{ formatMoney(product.price) }}</span></template>
              <template v-else>${{ formatMoney(product.price) }}</template>
            </p>
          </div>
        </router-link>
      </div>
    </div>
  </StoreLayout>
</template>

<script>
import StoreLayout from './StoreLayout.vue'
import { getPublishedProducts, getPublishedCombos } from '../../services/storeService'

export default {
  name: 'StoreHome',
  components: { StoreLayout },
  data() {
    return { products: [], combos: [], loading: true }
  },
  async mounted() {
    try {
      const [productsRes, combosRes] = await Promise.all([getPublishedProducts(), getPublishedCombos()])
      this.products = productsRes.data
      this.combos = combosRes.data
    } finally {
      this.loading = false
    }
  },
  methods: {
    formatMoney(v) { return Number(v || 0).toLocaleString('es-AR') }
  }
}
</script>

<style scoped>
.hero {
  background: linear-gradient(135deg, var(--bg-surface), var(--bg-base));
  border-bottom: 1px solid var(--border);
  padding: 4rem 1.25rem;
  text-align: center;
}
.hero-inner { max-width: 640px; margin: 0 auto; }
.hero-badge {
  display: inline-block; font-family: var(--font-display); font-size: 0.72rem; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase; color: var(--crimson-light);
  background: var(--crimson-glow); border: 1px solid var(--crimson-dark);
  border-radius: 12px; padding: 0.25rem 0.75rem; margin-bottom: 1rem;
}
.hero-title { font-size: 2.6rem; line-height: 1.1; margin-bottom: 1rem; }
.hero-subtitle { color: var(--text-secondary); font-size: 1.05rem; margin-bottom: 1.75rem; }

@media (max-width: 640px) {
  .hero { padding: 2.5rem 1rem; }
  .hero-title { font-size: 2rem; }
}
</style>
