<template>
  <StoreLayout>
    <div class="section">
      <router-link to="/carrito" class="back-link">← Volver al carrito</router-link>
      <h1>Checkout</h1>

      <div v-if="items.length === 0" class="empty-state">
        <div class="empty-state-icon">🛒</div>
        <p>Tu carrito está vacío</p>
        <router-link to="/tienda" class="btn btn-primary mt-3">Ir al catálogo</router-link>
      </div>

      <div v-else class="checkout-layout">
        <form class="checkout-form" @submit.prevent="handleSubmit">
          <div class="tac-card mb-3">
            <div class="tac-card-header"><h5>Datos de contacto</h5></div>
            <div class="tac-card-body">
              <div class="form-row">
                <div class="form-group">
                  <label>Nombre y apellido</label>
                  <input v-model.trim="form.customerName" class="form-control" required :disabled="submitting" />
                </div>
                <div class="form-group">
                  <label>DNI</label>
                  <input v-model.trim="form.customerDni" class="form-control" required :disabled="submitting" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Email</label>
                  <input v-model.trim="form.customerEmail" type="email" class="form-control" required :disabled="submitting" />
                </div>
                <div class="form-group">
                  <label>Teléfono</label>
                  <input v-model.trim="form.customerPhone" class="form-control" required :disabled="submitting" />
                </div>
              </div>
            </div>
          </div>

          <div class="tac-card mb-3">
            <div class="tac-card-header"><h5>Envío</h5></div>
            <div class="tac-card-body">
              <div class="form-group mb-2">
                <label>Provincia</label>
                <select v-model.number="form.shippingZoneId" class="form-select" required :disabled="submitting" @change="handleQuoteShipping">
                  <option value="" disabled>Seleccioná provincia</option>
                  <option v-for="zone in zones" :key="zone.id" :value="zone.id">{{ zone.provinceName }}</option>
                </select>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Calle</label>
                  <input v-model.trim="form.shippingStreet" class="form-control" required :disabled="submitting" />
                </div>
                <div class="form-group" style="max-width:120px">
                  <label>Número</label>
                  <input v-model.trim="form.shippingNumber" class="form-control" required :disabled="submitting" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Ciudad</label>
                  <input v-model.trim="form.shippingCity" class="form-control" required :disabled="submitting" />
                </div>
                <div class="form-group" style="max-width:160px">
                  <label>Código Postal</label>
                  <input v-model.trim="form.shippingPostalCode" class="form-control" required :disabled="submitting" />
                </div>
              </div>
              <div class="form-group">
                <label>Notas (opcional)</label>
                <textarea v-model.trim="form.notes" class="form-control" rows="2" :disabled="submitting"></textarea>
              </div>
            </div>
          </div>
        </form>

        <div class="checkout-summary tac-card">
          <div class="tac-card-body">
            <h5>Tu pedido</h5>
            <div class="checkout-summary-items">
              <div v-for="item in items" :key="item.key" class="checkout-summary-row">
                <span>{{ item.quantity }}× {{ item.name }}<span v-if="item.sizeName"> ({{ item.sizeName }})</span></span>
                <span>${{ formatMoney(item.unitPrice * item.quantity) }}</span>
              </div>
            </div>
            <div class="checkout-summary-row">
              <span>Subtotal</span>
              <span>${{ formatMoney(subtotal) }}</span>
            </div>
            <div class="checkout-summary-row">
              <span>Envío</span>
              <span v-if="quotingShipping"><span class="spinner spinner-sm"></span></span>
              <span v-else-if="shippingQuote">{{ shippingQuote.free ? 'Gratis' : `$${formatMoney(shippingQuote.cost)}` }}</span>
              <span v-else class="text-muted">Seleccioná provincia</span>
            </div>
            <div class="checkout-summary-row checkout-total">
              <span>Total</span>
              <span>${{ formatMoney(total) }}</span>
            </div>
            <span v-if="error" class="invalid-feedback d-block mb-2">{{ error }}</span>
            <button type="submit" class="btn btn-primary btn-lg w-100" :disabled="submitting || !form.shippingZoneId" @click="handleSubmit">
              <span v-if="submitting" class="spinner spinner-sm"></span>
              <span v-else>Pagar con Mercado Pago</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </StoreLayout>
</template>

<script>
import StoreLayout from './StoreLayout.vue'
import { getCart, getSubtotal, getTotalWeight, clearCart } from '../../services/cartService'
import { getShippingZones, quoteShipping } from '../../services/storeService'
import { createOrder } from '../../services/checkoutService'

export default {
  name: 'Checkout',
  components: { StoreLayout },
  data() {
    return {
      items: [],
      zones: [],
      shippingQuote: null,
      quotingShipping: false,
      submitting: false,
      error: '',
      form: {
        customerName: '', customerEmail: '', customerPhone: '', customerDni: '',
        shippingStreet: '', shippingNumber: '', shippingCity: '', shippingPostalCode: '',
        shippingZoneId: '', notes: ''
      }
    }
  },
  computed: {
    subtotal() { return getSubtotal(this.items) },
    total() { return this.subtotal + (this.shippingQuote && !this.shippingQuote.free ? this.shippingQuote.cost : 0) }
  },
  async mounted() {
    this.items = getCart()
    const res = await getShippingZones()
    this.zones = res.data
  },
  methods: {
    formatMoney(v) { return Number(v || 0).toLocaleString('es-AR') },
    async handleQuoteShipping() {
      if (!this.form.shippingZoneId) { this.shippingQuote = null; return }
      this.quotingShipping = true
      try {
        const res = await quoteShipping({
          shippingZoneId: this.form.shippingZoneId,
          weightKg: getTotalWeight(this.items),
          subtotal: this.subtotal
        })
        this.shippingQuote = res.data
      } finally {
        this.quotingShipping = false
      }
    },
    async handleSubmit() {
      this.error = ''
      if (!this.form.shippingZoneId) { this.error = 'Seleccioná una provincia de envío'; return }
      this.submitting = true
      try {
        const payload = {
          ...this.form,
          items: this.items.map(i => ({
            itemType: i.type === 'combo' ? 'COMBO' : 'PRODUCT',
            productId: i.type === 'combo' ? null : i.id,
            comboId: i.type === 'combo' ? i.id : null,
            sizeId: i.sizeId,
            quantity: i.quantity
          }))
        }
        const res = await createOrder(payload)
        clearCart()
        this.$router.push(`/pedido/${res.data.accessToken}`)
      } catch (e) {
        this.error = e.response?.data?.message || 'No se pudo crear el pedido. Intentá de nuevo.'
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>

<style scoped>
.back-link { display: inline-block; color: var(--text-secondary); text-decoration: none; margin-bottom: 1rem; font-size: 0.88rem; }
.back-link:hover { color: var(--crimson-light); }
h1 { font-size: 1.8rem; margin-bottom: 1.5rem; }

.checkout-layout { display: grid; grid-template-columns: 1fr 340px; gap: 2rem; align-items: start; }

.form-row { display: flex; gap: 1rem; }
.form-row .form-group { flex: 1; }
.form-group { margin-bottom: 0.9rem; }
.form-group label {
  display: block; font-family: var(--font-display); font-size: 0.75rem; font-weight: 700;
  letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 0.35rem;
}

.checkout-summary-items { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 0.75rem; font-size: 0.85rem; color: var(--text-secondary); }
.checkout-summary-row { display: flex; justify-content: space-between; padding: 0.4rem 0; border-top: 1px solid var(--border); }
.checkout-total { font-family: var(--font-display); font-weight: 700; font-size: 1.15rem; color: var(--text-primary); border-top: 2px solid var(--border); }

@media (max-width: 768px) {
  .checkout-layout { grid-template-columns: 1fr; }
  .form-row { flex-direction: column; gap: 0; }
}
</style>
