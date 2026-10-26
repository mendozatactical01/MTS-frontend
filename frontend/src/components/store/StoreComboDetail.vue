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
          <p class="detail-price">
            <template v-if="combo.priceCash != null">
              ${{ formatMoney(combo.priceCash) }} <span class="price-strike">${{ formatMoney(combo.price) }}</span>
              <span class="detail-price-note">(precio efectivo/transferencia)</span>
            </template>
            <template v-else>${{ formatMoney(combo.price) }}</template>
          </p>
          <p class="detail-description">{{ combo.description }}</p>

          <div class="combo-items">
            <h4>Incluye</h4>
            <div v-for="slot in combo.items" :key="slot.id" class="combo-slot">
              <p class="combo-slot-title">
                {{ slot.quantity }}× {{ slotTitle(slot) }}
                <span v-if="slot.options.length === 1 && slot.label" class="combo-slot-fixed">— {{ slot.options[0].productName }}</span>
              </p>

              <div v-if="slot.options.length > 1" class="combo-choices" role="radiogroup" :aria-label="`Elegí ${slotTitle(slot)}`">
                <button
                  v-for="opt in slot.options" :key="opt.productId"
                  type="button" role="radio"
                  class="combo-choice" :class="{ active: chosen(slot)?.productId === opt.productId, disabled: !opt.available }"
                  :disabled="!opt.available"
                  :aria-checked="chosen(slot)?.productId === opt.productId"
                  @click="selectOption(slot, opt)"
                >
                  <span class="combo-choice-img" aria-hidden="true" :style="opt.imageUrl ? { backgroundImage: `url(${opt.imageUrl})` } : null"></span>
                  <span class="combo-choice-name">{{ opt.productName }}</span>
                  <span v-if="!opt.available" class="combo-choice-out">Sin stock</span>
                </button>
              </div>

              <div v-if="chosenOption(slot)?.sizes" class="size-options" role="group" :aria-label="`Talle de ${chosenOption(slot).productName}`">
                <span class="combo-size-label">Talle:</span>
                <button
                  v-for="size in chosenOption(slot).sizes" :key="size.id"
                  type="button"
                  class="size-btn" :class="{ active: chosen(slot)?.sizeId === size.id, disabled: !size.available }"
                  :disabled="!size.available"
                  :aria-pressed="chosen(slot)?.sizeId === size.id"
                  :title="size.available ? null : `Talle ${size.name}, sin stock`"
                  @click="selectSize(slot, size)"
                >{{ size.name }}</button>
              </div>
            </div>
            <span v-if="selectionError" class="invalid-feedback d-block" role="alert">{{ selectionError }}</span>
          </div>

          <div class="form-group">
            <label id="qty-label">Cantidad</label>
            <div class="qty-control">
              <button type="button" class="btn btn-secondary btn-sm" aria-label="Disminuir cantidad" @click="quantity = Math.max(1, quantity - 1)">−</button>
              <span class="qty-value" role="status" aria-labelledby="qty-label" aria-live="polite">{{ quantity }}</span>
              <button type="button" class="btn btn-secondary btn-sm" aria-label="Aumentar cantidad" @click="quantity++">+</button>
            </div>
          </div>

          <button type="button" class="btn btn-primary btn-lg w-100" :disabled="!combo.available" @click="handleAddToCart">
            {{ combo.available ? '🛒 Agregar al carrito' : 'Sin stock' }}
          </button>
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
    // selections: { [comboItemId]: { productId, sizeId } }
    return { combo: null, loading: true, quantity: 1, added: false, selections: {}, selectionError: '' }
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
        this.initSelections()
      } catch {
        this.combo = null
      } finally {
        this.loading = false
      }
    },
    formatMoney(v) { return Number(v || 0).toLocaleString('es-AR') },
    initSelections() {
      const selections = {}
      for (const slot of this.combo?.items || []) {
        // Los lugares de una sola opción quedan elegidos; con varias, el cliente elige.
        const only = slot.options.length === 1 ? slot.options[0] : null
        selections[slot.id] = { productId: only ? only.productId : null, sizeId: null }
      }
      this.selections = selections
      this.selectionError = ''
    },
    slotTitle(slot) {
      if (slot.label) return slot.label
      return slot.options.length === 1 ? slot.options[0].productName : 'Elegí una opción'
    },
    chosen(slot) { return this.selections[slot.id] },
    chosenOption(slot) {
      const productId = this.selections[slot.id]?.productId
      return slot.options.find(o => o.productId === productId) || null
    },
    selectOption(slot, opt) {
      this.selections[slot.id] = { productId: opt.productId, sizeId: null }
      this.selectionError = ''
      this.added = false
    },
    selectSize(slot, size) {
      this.selections[slot.id].sizeId = size.id
      this.selectionError = ''
      this.added = false
    },
    handleAddToCart() {
      const selections = []
      for (const slot of this.combo.items) {
        const opt = this.chosenOption(slot)
        if (!opt) { this.selectionError = `Elegí ${this.slotTitle(slot).toLowerCase()}`; return }
        const sizeId = this.selections[slot.id].sizeId
        const size = opt.sizes?.find(sz => sz.id === sizeId) || null
        if (opt.sizes && !size) { this.selectionError = `Elegí el talle de ${opt.productName}`; return }
        selections.push({
          comboItemId: slot.id,
          productId: opt.productId,
          sizeId: size ? size.id : null,
          label: slot.label || null,
          productName: opt.productName,
          sizeName: size ? size.name : null
        })
      }
      this.selectionError = ''
      addItem({
        type: 'combo',
        id: this.combo.id,
        sizeId: null,
        sizeName: null,
        name: this.combo.name,
        unitPrice: this.combo.priceCash ?? this.combo.price,
        imageUrl: this.combo.imageUrl,
        weightKg: 0,
        selections
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
.detail-price-note { display: block; font-family: var(--font-body); font-weight: 400; font-size: 0.78rem; color: var(--text-muted); }
.detail-description { color: var(--text-secondary); margin-bottom: 1.5rem; line-height: 1.6; }

.combo-items { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 1rem 1.25rem; margin-bottom: 1.5rem; }
.combo-items h4 { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-secondary); margin-bottom: 0.5rem; }
.combo-slot + .combo-slot { border-top: 1px solid var(--border); margin-top: 0.75rem; padding-top: 0.75rem; }
.combo-slot-title { color: var(--text-primary); font-size: 0.92rem; font-weight: 600; margin-bottom: 0; }
.combo-slot-fixed { font-weight: 400; color: var(--text-secondary); }
.combo-choices { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.5rem; margin-top: 0.5rem; }
.combo-choice {
  display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem; text-align: left;
  background: var(--bg-input); border: 1px solid var(--border); border-radius: var(--radius-sm);
  color: var(--text-primary); cursor: pointer; transition: var(--transition); position: relative;
}
.combo-choice:hover:not(.disabled) { border-color: var(--crimson); }
.combo-choice.active { border-color: var(--crimson); box-shadow: inset 0 0 0 1px var(--crimson); }
.combo-choice.disabled { opacity: 0.45; cursor: not-allowed; }
.combo-choice-img { flex: 0 0 40px; height: 40px; border-radius: var(--radius-sm); background: var(--bg-card) center / cover no-repeat; }
.combo-choice-name { font-size: 0.82rem; line-height: 1.25; }
.combo-choice-out { position: absolute; top: 0.2rem; right: 0.35rem; font-size: 0.65rem; color: var(--text-muted); }
.combo-size-label { font-size: 0.8rem; color: var(--text-secondary); align-self: center; }
.size-options { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem; }
.size-btn {
  min-width: 44px; padding: 0.4rem 0.7rem; background: var(--bg-input); border: 1px solid var(--border);
  border-radius: var(--radius-sm); color: var(--text-primary); font-family: var(--font-display); font-weight: 600;
  cursor: pointer; transition: var(--transition);
}
.size-btn:hover:not(.disabled) { border-color: var(--crimson); }
.size-btn.active { background: var(--crimson); border-color: var(--crimson); }
.size-btn.disabled { opacity: 0.4; cursor: not-allowed; text-decoration: line-through; }

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
