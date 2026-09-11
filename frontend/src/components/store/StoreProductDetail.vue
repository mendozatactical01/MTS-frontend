<template>
  <StoreLayout>
    <div class="section">
      <router-link to="/tienda" class="back-link">← Volver al catálogo</router-link>

      <div v-if="loading" class="empty-state"><div class="spinner" style="margin:0 auto"></div></div>

      <div v-else-if="!product" class="empty-state">
        <div class="empty-state-icon">◇</div>
        <p>Producto no encontrado</p>
      </div>

      <div v-else class="detail-grid">
        <div class="detail-img" :style="{ backgroundImage: `url(${product.imageUrl})` }"></div>

        <div class="detail-info">
          <span class="badge badge-neutral">{{ product.category?.name }}</span>
          <h1>{{ product.name }}</h1>
          <p class="detail-price">
            <template v-if="product.priceCash">
              ${{ formatMoney(product.priceCash) }} <span class="price-strike">${{ formatMoney(product.price) }}</span>
              <span class="detail-price-note">(precio efectivo/transferencia)</span>
            </template>
            <template v-else>${{ formatMoney(product.price) }}</template>
          </p>
          <p class="detail-description">{{ product.description }}</p>

          <div v-if="product.sizes" class="form-group">
            <label>Talle</label>
            <div class="size-options">
              <button
                v-for="size in product.sizes" :key="size.id"
                class="size-btn" :class="{ active: selectedSizeId === size.id, disabled: !size.available }"
                :disabled="!size.available"
                @click="selectedSizeId = size.id"
              >{{ size.name }}</button>
            </div>
            <span v-if="sizeError" class="invalid-feedback">{{ sizeError }}</span>
          </div>

          <div class="form-group">
            <label>Cantidad</label>
            <div class="qty-control">
              <button class="btn btn-secondary btn-sm" @click="quantity = Math.max(1, quantity - 1)">−</button>
              <span class="qty-value">{{ quantity }}</span>
              <button class="btn btn-secondary btn-sm" @click="quantity++">+</button>
            </div>
          </div>

          <button class="btn btn-primary btn-lg w-100" :disabled="!product.available" @click="handleAddToCart">
            {{ product.available ? '🛒 Agregar al carrito' : 'Sin stock' }}
          </button>
          <p v-if="added" class="added-confirm">✓ Agregado al carrito — <router-link to="/carrito">ver carrito</router-link></p>
        </div>
      </div>
    </div>
  </StoreLayout>
</template>

<script>
import StoreLayout from './StoreLayout.vue'
import { getPublishedProductById } from '../../services/storeService'
import { addItem } from '../../services/cartService'

export default {
  name: 'StoreProductDetail',
  components: { StoreLayout },
  data() {
    return { product: null, loading: true, selectedSizeId: null, quantity: 1, sizeError: '', added: false }
  },
  async mounted() {
    await this.load()
  },
  watch: {
    '$route.params.id'() { this.load() }
  },
  methods: {
    async load() {
      this.loading = true
      this.added = false
      this.selectedSizeId = null
      this.quantity = 1
      try {
        const res = await getPublishedProductById(this.$route.params.id)
        this.product = res.data
      } catch {
        this.product = null
      } finally {
        this.loading = false
      }
    },
    formatMoney(v) { return Number(v || 0).toLocaleString('es-AR') },
    handleAddToCart() {
      this.sizeError = ''
      if (this.product.sizes && !this.selectedSizeId) {
        this.sizeError = 'Seleccioná un talle'
        return
      }
      const size = this.product.sizes?.find(s => s.id === this.selectedSizeId)
      addItem({
        type: 'product',
        id: this.product.id,
        sizeId: this.selectedSizeId,
        sizeName: size?.name || null,
        name: this.product.name,
        unitPrice: this.product.priceCash || this.product.price,
        imageUrl: this.product.imageUrl,
        weightKg: this.product.weightKg
      }, this.quantity)
      this.added = true
    }
  }
}
</script>

<style scoped>
.back-link { display: inline-block; color: var(--text-secondary); text-decoration: none; margin-bottom: 1.5rem; font-size: 0.88rem; }
.back-link:hover { color: var(--crimson-light); }

.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2.5rem; }
.detail-img {
  aspect-ratio: 1 / 1; background-size: cover; background-position: center;
  background-color: var(--bg-input); border-radius: var(--radius-lg); border: 1px solid var(--border);
}
.detail-info h1 { font-size: 1.8rem; margin: 0.6rem 0 0.75rem; }
.detail-price { font-family: var(--font-display); font-weight: 700; font-size: 1.6rem; margin-bottom: 1rem; }
.detail-price-note { display: block; font-family: var(--font-body); font-weight: 400; font-size: 0.78rem; color: var(--text-muted); }
.detail-description { color: var(--text-secondary); margin-bottom: 1.5rem; line-height: 1.6; }

.size-options { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.size-btn {
  min-width: 44px; padding: 0.4rem 0.7rem; background: var(--bg-input); border: 1px solid var(--border);
  border-radius: var(--radius-sm); color: var(--text-primary); font-family: var(--font-display); font-weight: 600;
  cursor: pointer; transition: var(--transition);
}
.size-btn:hover:not(.disabled) { border-color: var(--crimson); }
.size-btn.active { background: var(--crimson); border-color: var(--crimson); }
.size-btn.disabled { opacity: 0.35; text-decoration: line-through; cursor: not-allowed; }

.qty-control { display: flex; align-items: center; gap: 0.75rem; }
.qty-value { font-family: var(--font-display); font-weight: 700; font-size: 1.1rem; min-width: 1.5rem; text-align: center; }

.added-confirm { margin-top: 0.75rem; color: var(--crimson-light); font-size: 0.88rem; }
.added-confirm a { color: inherit; }

.form-group { margin-bottom: 1.25rem; }
.form-group label {
  display: block; font-family: var(--font-display); font-size: 0.75rem; font-weight: 700;
  letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 0.4rem;
}

@media (max-width: 768px) {
  .detail-grid { grid-template-columns: 1fr; gap: 1.5rem; }
}
</style>
