<template>
  <StoreLayout>
    <div class="section">
      <div class="catalog-header">
        <h1>Catálogo</h1>
        <div class="catalog-filters">
          <input v-model="search" class="form-control" placeholder="Buscar producto o combo..." />
          <select v-model="categoryFilter" class="form-select">
            <option value="">Todas las categorías</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>
      </div>

      <div v-if="loading" class="empty-state"><div class="spinner" style="margin:0 auto"></div></div>

      <template v-else>
        <div v-if="filteredCombos.length" class="catalog-group">
          <h2 class="catalog-group-title">Combos</h2>
          <div class="product-grid">
            <router-link v-for="combo in filteredCombos" :key="'combo-'+combo.id" :to="`/combo/${combo.id}`" class="product-card">
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

        <div class="catalog-group">
          <h2 class="catalog-group-title">Productos</h2>
          <div v-if="filteredProducts.length === 0" class="empty-state">
            <div class="empty-state-icon">◇</div>
            <p>No se encontraron productos</p>
          </div>
          <div v-else class="product-grid">
            <router-link v-for="product in filteredProducts" :key="'prod-'+product.id" :to="`/producto/${product.id}`" class="product-card">
              <div class="product-card-img" :style="{ backgroundImage: `url(${product.imageUrl})` }">
                <div v-if="!product.available" class="product-card-unavailable">
                  <span class="badge badge-neutral">Sin stock</span>
                </div>
              </div>
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
      </template>
    </div>
  </StoreLayout>
</template>

<script>
import StoreLayout from './StoreLayout.vue'
import { getPublishedProducts, getPublishedCombos } from '../../services/storeService'

export default {
  name: 'StoreCatalog',
  components: { StoreLayout },
  data() {
    return { products: [], combos: [], loading: true, search: '', categoryFilter: '' }
  },
  computed: {
    categories() {
      const map = new Map()
      this.products.forEach(p => { if (p.category) map.set(p.category.id, p.category) })
      return [...map.values()]
    },
    filteredProducts() {
      let items = this.products
      if (this.categoryFilter) items = items.filter(p => p.category?.id === this.categoryFilter)
      if (this.search.trim()) {
        const q = this.search.trim().toLowerCase()
        items = items.filter(p => p.name.toLowerCase().includes(q))
      }
      return items
    },
    filteredCombos() {
      if (this.categoryFilter) return []
      if (!this.search.trim()) return this.combos
      const q = this.search.trim().toLowerCase()
      return this.combos.filter(c => c.name.toLowerCase().includes(q))
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
.catalog-header { margin-bottom: 1.5rem; }
.catalog-header h1 { font-size: 1.8rem; margin-bottom: 1rem; }
.catalog-filters { display: flex; gap: 0.75rem; flex-wrap: wrap; }
.catalog-filters .form-control { flex: 1; min-width: 200px; }
.catalog-filters .form-select { min-width: 180px; }

.catalog-group { margin-top: 2rem; }
.catalog-group-title { font-size: 1.1rem; margin-bottom: 1rem; color: var(--text-secondary); }
</style>
