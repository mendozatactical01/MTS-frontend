<template>
  <StoreLayout>
    <div class="section catalog-page">
      <div class="catalog-page-header">
        <h1>Catálogo</h1>
        <button
          type="button"
          class="btn btn-secondary btn-sm catalog-filter-toggle"
          @click="showFilters = !showFilters"
          aria-controls="catalog-filters-panel"
          :aria-expanded="showFilters"
        >
          Filtros<span v-if="activeFilterCount" class="badge badge-crimson catalog-filter-count">{{ activeFilterCount }}</span>
        </button>
      </div>

      <div v-if="loading" class="empty-state"><div class="spinner" style="margin:0 auto"></div></div>

      <div v-else class="catalog-layout">
        <aside id="catalog-filters-panel" class="catalog-sidebar" :class="{ 'is-open': showFilters }">
          <div class="catalog-sidebar-section">
            <label for="catalog-search">Buscar</label>
            <input id="catalog-search" v-model="search" class="form-control form-control-sm" placeholder="Producto o combo..." />
          </div>

          <fieldset class="catalog-sidebar-section filter-fieldset">
            <legend>Categoría</legend>
            <div class="filter-options">
              <label class="filter-option">
                <input type="radio" name="cat" value="" v-model="categoryFilter" />
                <span>Todas</span>
              </label>
              <label class="filter-option" v-for="cat in categories" :key="cat.id">
                <input type="radio" name="cat" :value="cat.id" v-model="categoryFilter" />
                <span>{{ cat.name }}</span>
              </label>
            </div>
          </fieldset>

          <div class="catalog-sidebar-section">
            <label class="form-check">
              <input type="checkbox" class="form-check-input" v-model="onlyAvailable" />
              <span class="form-check-label">Solo disponibles</span>
            </label>
          </div>

          <button v-if="activeFilterCount" class="btn btn-secondary btn-sm w-100" @click="clearFilters">Limpiar filtros</button>
        </aside>

        <div class="catalog-content">
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
            <div class="catalog-group-header">
              <h2 class="catalog-group-title">Productos <span class="catalog-count">({{ sortedProducts.length }})</span></h2>
              <select v-model="sortOption" class="form-select form-select-sm catalog-sort">
                <option value="featured">Ordenar: destacados</option>
                <option value="price-desc">Precio: mayor a menor</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="name-asc">Nombre: A-Z</option>
              </select>
            </div>

            <div v-if="sortedProducts.length === 0" class="empty-state">
              <div class="empty-state-icon">◇</div>
              <p>No se encontraron productos</p>
            </div>
            <div v-else class="product-grid">
              <router-link v-for="product in sortedProducts" :key="'prod-'+product.id" :to="`/producto/${product.id}`" class="product-card">
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
        </div>
      </div>
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
    return {
      products: [], combos: [], loading: true,
      search: '', categoryFilter: '', onlyAvailable: false,
      sortOption: 'featured', showFilters: false
    }
  },
  computed: {
    categories() {
      const map = new Map()
      this.products.forEach(p => { if (p.category) map.set(p.category.id, p.category) })
      return [...map.values()]
    },
    activeFilterCount() {
      let n = 0
      if (this.categoryFilter !== '') n++
      if (this.onlyAvailable) n++
      return n
    },
    filteredProducts() {
      let items = this.products
      if (this.categoryFilter !== '') items = items.filter(p => p.category?.id === this.categoryFilter)
      if (this.onlyAvailable) items = items.filter(p => p.available)
      if (this.search.trim()) {
        const q = this.search.trim().toLowerCase()
        items = items.filter(p => p.name.toLowerCase().includes(q))
      }
      return items
    },
    sortedProducts() {
      const items = [...this.filteredProducts]
      const effectivePrice = p => Number(p.priceCash || p.price || 0)
      switch (this.sortOption) {
        case 'price-desc': return items.sort((a, b) => effectivePrice(b) - effectivePrice(a))
        case 'price-asc':  return items.sort((a, b) => effectivePrice(a) - effectivePrice(b))
        case 'name-asc':   return items.sort((a, b) => a.name.localeCompare(b.name))
        default:           return items
      }
    },
    filteredCombos() {
      if (this.categoryFilter !== '') return []
      if (!this.search.trim()) return this.combos
      const q = this.search.trim().toLowerCase()
      return this.combos.filter(c => c.name.toLowerCase().includes(q))
    }
  },
  async mounted() {
    const catQuery = this.$route.query.category
    if (catQuery !== undefined) {
      this.categoryFilter = isNaN(catQuery) ? catQuery : Number(catQuery)
      this.showFilters = true
    }
    try {
      const [productsRes, combosRes] = await Promise.all([getPublishedProducts(), getPublishedCombos()])
      this.products = productsRes.data
      this.combos = combosRes.data
    } finally {
      this.loading = false
    }
  },
  methods: {
    formatMoney(v) { return Number(v || 0).toLocaleString('es-AR') },
    clearFilters() {
      this.categoryFilter = ''
      this.onlyAvailable = false
    }
  }
}
</script>

<style scoped>
.catalog-page-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 1.5rem; gap: 1rem;
}
.catalog-page-header h1 { font-size: 1.8rem; }
.catalog-filter-toggle { display: none; align-items: center; gap: 0.4rem; }
.catalog-filter-count { padding: 0.05rem 0.4rem; font-size: 0.65rem; }

.catalog-layout { display: grid; grid-template-columns: var(--sidebar-width) 1fr; gap: 2rem; align-items: start; }

.catalog-sidebar {
  background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg);
  padding: 1.25rem; position: sticky; top: 5.5rem;
  display: flex; flex-direction: column; gap: 1.25rem;
}
.catalog-sidebar-section { display: flex; flex-direction: column; gap: 0.5rem; }
.catalog-sidebar-section > label:first-child { margin-bottom: 0.1rem; }

.filter-fieldset { border: none; padding: 0; margin: 0; min-width: 0; }
.filter-fieldset > legend {
  font-family: var(--font-display); font-weight: 600; letter-spacing: 0.05em;
  font-size: 0.78rem; text-transform: uppercase; color: var(--text-secondary);
  padding: 0; margin-bottom: 0.6rem;
}

.filter-options { display: flex; flex-direction: column; gap: 0.55rem; }
.filter-option {
  display: flex; align-items: center; gap: 0.55rem;
  font-size: 0.88rem; color: var(--text-secondary); cursor: pointer;
}
.filter-option:hover { color: var(--text-primary); }
.filter-option input[type="radio"] { accent-color: var(--crimson); width: 15px; height: 15px; flex-shrink: 0; }

.catalog-content { min-width: 0; }
.catalog-group { margin-bottom: 2.5rem; }
.catalog-group:last-child { margin-bottom: 0; }
.catalog-group-header {
  display: flex; align-items: baseline; justify-content: space-between;
  gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem;
}
.catalog-group-title { font-size: 1.1rem; color: var(--text-secondary); }
.catalog-count { color: var(--text-muted); font-family: var(--font-body); font-weight: 400; letter-spacing: 0; }
.catalog-sort { width: auto; min-width: 190px; }

@media (max-width: 860px) {
  .catalog-filter-toggle { display: inline-flex; }
  .catalog-layout { grid-template-columns: 1fr; }
  .catalog-sidebar { display: none; position: static; }
  .catalog-sidebar.is-open { display: flex; }
}
</style>
