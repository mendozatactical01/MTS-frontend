<template>
  <StoreLayout>
    <div class="section">
      <h1>Carrito</h1>

      <div v-if="items.length === 0" class="empty-state">
        <div class="empty-state-icon">🛒</div>
        <p>Tu carrito está vacío</p>
        <router-link to="/tienda" class="btn btn-primary mt-3">Ir al catálogo</router-link>
      </div>

      <div v-else class="cart-layout">
        <div class="cart-items">
          <div v-for="item in items" :key="item.key" class="cart-row">
            <div class="cart-row-img" role="img" :aria-label="item.name" :style="{ backgroundImage: `url(${item.imageUrl})` }"></div>
            <div class="cart-row-info">
              <h3>{{ item.name }}</h3>
              <span v-if="item.sizeName" class="badge badge-neutral">Talle {{ item.sizeName }}</span>
              <span v-if="item.type === 'combo'" class="badge badge-amber">Combo</span>
              <p class="cart-row-price">${{ formatMoney(item.unitPrice) }} c/u</p>
            </div>
            <div class="cart-row-qty">
              <button type="button" class="btn btn-secondary btn-sm" :aria-label="`Disminuir cantidad de ${item.name}`" @click="changeQty(item, item.quantity - 1)">−</button>
              <span class="qty-value" role="status" aria-live="polite">{{ item.quantity }}</span>
              <button type="button" class="btn btn-secondary btn-sm" :aria-label="`Aumentar cantidad de ${item.name}`" @click="changeQty(item, item.quantity + 1)">+</button>
            </div>
            <div class="cart-row-subtotal">${{ formatMoney(item.unitPrice * item.quantity) }}</div>
            <button type="button" class="cart-row-remove" @click="handleRemove(item.key)" :aria-label="`Quitar ${item.name} del carrito`" title="Quitar">✕</button>
          </div>
        </div>

        <div class="cart-summary tac-card">
          <div class="tac-card-body">
            <h5>Resumen</h5>
            <div class="cart-summary-row">
              <span>Subtotal</span>
              <span>${{ formatMoney(subtotal) }}</span>
            </div>
            <p class="cart-summary-note">El envío se calcula en el siguiente paso.</p>
            <router-link to="/checkout" class="btn btn-primary btn-lg w-100 mt-2">Ir a Checkout →</router-link>
            <router-link to="/tienda" class="btn btn-secondary w-100 mt-2">Seguir comprando</router-link>
          </div>
        </div>
      </div>
    </div>
  </StoreLayout>
</template>

<script>
import StoreLayout from './StoreLayout.vue'
import { getCart, updateQuantity, removeItem, getSubtotal } from '../../services/cartService'

export default {
  name: 'Cart',
  components: { StoreLayout },
  data() {
    return { items: [] }
  },
  computed: {
    subtotal() { return getSubtotal(this.items) }
  },
  mounted() {
    this.refresh()
  },
  methods: {
    refresh() {
      this.items = getCart()
    },
    changeQty(item, qty) {
      updateQuantity(item.key, qty)
      this.refresh()
    },
    handleRemove(key) {
      removeItem(key)
      this.refresh()
    },
    formatMoney(v) { return Number(v || 0).toLocaleString('es-AR') }
  }
}
</script>

<style scoped>
h1 { font-size: 1.8rem; margin-bottom: 1.5rem; }

.cart-layout { display: grid; grid-template-columns: 1fr 320px; gap: 2rem; align-items: start; }

.cart-items { display: flex; flex-direction: column; gap: 0.75rem; }
.cart-row {
  display: grid; grid-template-columns: 64px 1fr auto auto auto; gap: 1rem; align-items: center;
  background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 0.75rem;
}
.cart-row-img { width: 64px; height: 64px; border-radius: var(--radius-sm); background-size: cover; background-position: center; background-color: var(--bg-input); }
.cart-row-info h3 { font-size: 0.95rem; margin-bottom: 0.3rem; }
.cart-row-info .badge { margin-right: 0.35rem; }
.cart-row-price { color: var(--text-muted); font-size: 0.82rem; margin-top: 0.25rem; }
.cart-row-qty { display: flex; align-items: center; gap: 0.5rem; }
.qty-value { font-family: var(--font-display); font-weight: 700; min-width: 1.2rem; text-align: center; }
.cart-row-subtotal { font-family: var(--font-display); font-weight: 700; min-width: 80px; text-align: right; }
.cart-row-remove { background: transparent; border: none; color: var(--text-muted); cursor: pointer; font-size: 1rem; padding: 0.3rem; }
.cart-row-remove:hover { color: var(--red-light); }

.cart-summary h5 { margin-bottom: 1rem; }
.cart-summary-row { display: flex; justify-content: space-between; font-size: 1.05rem; font-weight: 600; padding: 0.5rem 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
.cart-summary-note { color: var(--text-muted); font-size: 0.8rem; margin-top: 0.75rem; }

@media (max-width: 768px) {
  .cart-layout { grid-template-columns: 1fr; }
  .cart-row {
    position: relative;
    grid-template-columns: 56px 1fr;
    grid-template-areas: "img info" "img qty" "img subtotal";
    row-gap: 0.5rem;
  }
  .cart-row-img { grid-area: img; }
  .cart-row-info { grid-area: info; padding-right: 1.5rem; }
  .cart-row-qty { grid-area: qty; }
  .cart-row-subtotal { grid-area: subtotal; text-align: left; }
  .cart-row-remove { position: absolute; top: 0.5rem; right: 0.5rem; }
}
</style>
