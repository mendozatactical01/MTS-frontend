<template>
  <StoreLayout>
    <div class="hero">
      <div class="hero-inner">
        <div class="hero-badge">Equipamiento Táctico</div>
        <h1 class="hero-title">Mendoza<br>Tactical Store</h1>
        <p class="hero-subtitle">Indumentaria y equipamiento táctico, policial y de pesca. Envíos a todo el país.</p>
        <div class="hero-actions">
          <router-link to="/tienda" class="btn btn-primary btn-lg">Ver catálogo →</router-link>
          <a href="#combos" class="btn btn-secondary btn-lg">Ver combos</a>
        </div>
      </div>
    </div>

    <div class="trust-strip">
      <div class="trust-strip-inner">
        <div class="trust-item">
          <span class="trust-item-icon" aria-hidden="true">🚚</span>
          <span>Envíos a todo el país</span>
        </div>
        <div class="trust-item">
          <span class="trust-item-icon" aria-hidden="true">🔒</span>
          <span>Pago seguro con Mercado Pago</span>
        </div>
        <div class="trust-item">
          <span class="trust-item-icon" aria-hidden="true">📦</span>
          <span>Stock real, sin sorpresas</span>
        </div>
        <div class="trust-item">
          <span class="trust-item-icon" aria-hidden="true">🎯</span>
          <span>Equipamiento profesional</span>
        </div>
      </div>
    </div>

    <div v-if="!loading && categories.length" class="section section-tight">
      <div class="category-nav">
        <router-link
          v-for="cat in categories"
          :key="cat.id"
          :to="{ path: '/tienda', query: { category: cat.id } }"
          class="category-chip"
        >{{ cat.name }}</router-link>
      </div>
    </div>

    <div id="combos" class="section">
      <div class="section-header">
        <h2>Combos destacados</h2>
        <router-link to="/tienda" class="section-link">Ver todo →</router-link>
      </div>
      <div v-if="loading" class="empty-state"><div class="spinner" style="margin:0 auto"></div></div>
      <div v-else-if="combos.length === 0" class="empty-state">
        <div class="empty-state-icon">◇</div>
        <p>Todavía no hay combos publicados</p>
      </div>
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

    <div class="cta-banner">
      <div class="cta-banner-inner">
        <div>
          <h2>¿Buscás algo puntual?</h2>
          <p>Filtrá por categoría, precio y disponibilidad en el catálogo completo.</p>
        </div>
        <router-link to="/tienda" class="btn btn-primary btn-lg">Explorar catálogo →</router-link>
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
  computed: {
    categories() {
      const map = new Map()
      this.products.forEach(p => { if (p.category) map.set(p.category.id, p.category) })
      return [...map.values()]
    }
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
  position: relative;
  overflow: hidden;
}
.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--border) 1px, transparent 1px),
    linear-gradient(90deg, var(--border) 1px, transparent 1px);
  background-size: 42px 42px;
  opacity: 0.15;
  mask-image: radial-gradient(ellipse at center, black 0%, transparent 75%);
}
.hero-inner { max-width: 640px; margin: 0 auto; position: relative; }
.hero-badge {
  display: inline-block; font-family: var(--font-display); font-size: 0.72rem; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase; color: var(--crimson-light);
  background: var(--crimson-glow); border: 1px solid var(--crimson-dark);
  border-radius: 12px; padding: 0.25rem 0.75rem; margin-bottom: 1rem;
}
.hero-title { font-size: 2.6rem; line-height: 1.1; margin-bottom: 1rem; }
.hero-subtitle { color: var(--text-secondary); font-size: 1.05rem; margin-bottom: 1.75rem; }
.hero-actions { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }

/* Trust strip */
.trust-strip { background: var(--bg-card); border-bottom: 1px solid var(--border); }
.trust-strip-inner {
  max-width: 1200px; margin: 0 auto; padding: 1rem 1.25rem;
  display: flex; flex-wrap: wrap; gap: 0.75rem 2rem; justify-content: center;
}
.trust-item {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.85rem; color: var(--text-secondary); white-space: nowrap;
}
.trust-item-icon { font-size: 1.05rem; }

/* Category quick nav */
.section-tight { padding-top: 1.75rem; padding-bottom: 0; }
.category-nav { display: flex; flex-wrap: wrap; gap: 0.6rem; }
.category-chip {
  font-family: var(--font-display); font-weight: 600; font-size: 0.8rem;
  letter-spacing: 0.04em; text-transform: uppercase; color: var(--text-secondary);
  background: var(--bg-card); border: 1px solid var(--border); border-radius: 50px;
  padding: 0.4rem 0.9rem; text-decoration: none; transition: var(--transition);
}
.category-chip:hover { color: var(--text-primary); border-color: var(--crimson-dark); background: var(--bg-hover); }

/* CTA banner */
.cta-banner { max-width: 1200px; margin: 0 auto 3rem; padding: 0 1.25rem; }
.cta-banner-inner {
  background: linear-gradient(135deg, var(--crimson-glow), var(--bg-card));
  border: 1px solid var(--crimson-dark); border-radius: var(--radius-lg);
  padding: 2rem; display: flex; align-items: center; justify-content: space-between;
  gap: 1.5rem; flex-wrap: wrap;
}
.cta-banner-inner h2 { font-size: 1.5rem; margin-bottom: 0.35rem; }
.cta-banner-inner p { color: var(--text-secondary); font-size: 0.92rem; }

@media (max-width: 640px) {
  .hero { padding: 2.5rem 1rem; }
  .hero-title { font-size: 2rem; }
  .cta-banner-inner { padding: 1.5rem; text-align: center; justify-content: center; }
}
</style>
