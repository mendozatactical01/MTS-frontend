<template>
  <StoreLayout>
    <div class="section">
      <router-link to="/tienda" class="back-link">← Volver al catálogo</router-link>

      <div v-if="loading" class="empty-state"><div class="spinner" style="margin:0 auto"></div></div>

      <div v-else-if="!combo" class="empty-state">
        <div class="empty-state-icon">◇</div>
        <p>Combo no encontrado</p>
      </div>

      <div v-else class="detail-grid">
        <div class="detail-img" role="img" :aria-label="`Combo: ${combo.name}`" :style="{ backgroundImage: `url(${combo.imageUrl})` }">
          <span class="badge badge-amber detail-tag">Combo</span>
        </div>

        <div class="detail-info">
          <h1>{{ combo.name }}</h1>
          <p class="detail-price">${{ formatMoney(combo.price) }}</p>
          <p class="detail-description">{{ combo.description }}</p>

          <div class="combo-items">
            <h4>Incluye</h4>
            <ul>
              <li v-for="(item, idx) in combo.items" :key="idx">
                {{ item.quantity }}× {{ item.productName }}
              </li>
            </ul>
          </div>

          <div class="form-group">
            <label id="qty-label">Cantidad</label>
            <div class="qty-control">
              <button type="button" class="btn btn-secondary btn-sm" aria-label="Disminuir cantidad" @click="quantity = Math.max(1, quantity - 1)">−</button>
              <span class="qty-value" role="status" aria-labelledby="qty-label" aria-live="polite">{{ quantity }}</span>
              <button type="button" class="btn btn-secondary btn-sm" aria-label="Aumentar cantidad" @click="quantity++">+</button>
            </div>
          </div>

          <button type="button" class="btn btn-primary btn-lg w-100" @click="handleAddToCart">🛒 Agregar al carrito</button>
          <p v-if="added" class="added-confirm">✓ Agregado al carrito — <router-link to="/carrito">ver carrito</router-link></p>
        </div>
      </div>
    </div>
  </StoreLayout>
</template>

<script>
import StoreLayout from './StoreLayout.vue'
import { getPublishedComboById } from '../../services/storeService'
import { addItem } from '../../services/cartService'

export default {
  name: 'StoreComboDetail',
  components: { StoreLayout },
  data() {
    return { combo: null, loading: true, quantity: 1, added: false }
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
      this.quantity = 1
      try {
        const res = await getPublishedComboById(this.$route.params.id)
        this.combo = res.data
      } catch {
        this.combo = null
      } finally {
        this.loading = false
      }
    },
    formatMoney(v) { return Number(v || 0).toLocaleString('es-AR') },
    handleAddToCart() {
      addItem({
        type: 'combo',
        id: this.combo.id,
        sizeId: null,
        sizeName: null,
        name: this.combo.name,
        unitPrice: this.combo.price,
        imageUrl: this.combo.imageUrl,
        weightKg: 0
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
  position: relative;
}
.detail-tag { position: absolute; top: 0.75rem; left: 0.75rem; }
.detail-info h1 { font-size: 1.8rem; margin-bottom: 0.75rem; }
.detail-price { font-family: var(--font-display); font-weight: 700; font-size: 1.6rem; margin-bottom: 1rem; }
.detail-description { color: var(--text-secondary); margin-bottom: 1.5rem; line-height: 1.6; }

.combo-items { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 1rem 1.25rem; margin-bottom: 1.5rem; }
.combo-items h4 { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-secondary); margin-bottom: 0.5rem; }
.combo-items ul { list-style: none; display: flex; flex-direction: column; gap: 0.35rem; }
.combo-items li { color: var(--text-primary); font-size: 0.92rem; }

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
