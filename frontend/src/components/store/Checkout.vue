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
        <form id="checkout-form" class="checkout-form" @submit.prevent="handleSubmit">
          <div class="tac-card mb-3">
            <div class="tac-card-header"><h5>Datos de contacto</h5></div>
            <div class="tac-card-body">
              <div class="form-row">
                <div class="form-group">
                  <label for="f-name">Nombre y apellido</label>
                  <input id="f-name" v-model.trim="form.customerName" class="form-control" autocomplete="name" required maxlength="80"
                    pattern="\p{L}[\p{L}'.\-]*( +\p{L}[\p{L}'.\-]*)+" title="Nombre y apellido, solo letras" :disabled="submitting" />
                </div>
                <div class="form-group">
                  <label for="f-dni">DNI</label>
                  <input id="f-dni" :value="form.customerDni" @input="onlyDigits($event, 'customerDni', 8)" class="form-control" inputmode="numeric"
                    autocomplete="off" required minlength="7" maxlength="8" pattern="[0-9]{7,8}" title="7 u 8 números, sin puntos"
                    placeholder="Sin puntos" :disabled="submitting" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="f-email">Email</label>
                  <input id="f-email" v-model.trim="form.customerEmail" type="email" class="form-control" autocomplete="email" required maxlength="120"
                    pattern="[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,}" title="Ejemplo: nombre@gmail.com" :disabled="submitting" />
                </div>
                <div class="form-group">
                  <label for="f-email2">Repetir email</label>
                  <input id="f-email2" v-model.trim="form.customerEmailConfirmation" type="email" class="form-control" autocomplete="off" required maxlength="120"
                    :aria-invalid="emailMismatch" aria-describedby="f-email2-help" :disabled="submitting" @paste.prevent />
                  <small v-if="emailMismatch" id="f-email2-help" class="invalid-feedback d-block">Los emails no coinciden</small>
                  <small v-else id="f-email2-help" class="form-hint">Ahí te mandamos la confirmación del pedido</small>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="f-phone">Teléfono</label>
                  <input id="f-phone" v-model.trim="form.customerPhone" type="tel" class="form-control" autocomplete="tel" required maxlength="20"
                    pattern="\+?[0-9 \(\)\-]{8,20}" title="Con código de área, ejemplo: 261 4123456" placeholder="Ej: 261 4123456" :disabled="submitting" />
                </div>
              </div>
            </div>
          </div>

          <div class="tac-card mb-3">
            <div class="tac-card-header"><h5>Envío</h5></div>
            <div class="tac-card-body">
              <div class="form-group mb-2">
                <label for="f-zone">Provincia</label>
                <select id="f-zone" v-model.number="form.shippingZoneId" class="form-select" autocomplete="address-level1" required :disabled="submitting" @change="handleQuoteShipping">
                  <option value="" disabled>Seleccioná provincia</option>
                  <option v-for="zone in zones" :key="zone.id" :value="zone.id">{{ zone.provinceName }}</option>
                </select>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="f-street">Calle</label>
                  <input id="f-street" v-model.trim="form.shippingStreet" class="form-control" autocomplete="address-line1" required maxlength="100" :disabled="submitting" />
                </div>
                <div class="form-group form-group-number">
                  <label for="f-number">Número</label>
                  <input id="f-number" v-model.trim="form.shippingNumber" class="form-control" autocomplete="off" required maxlength="6"
                    pattern="[0-9]{1,6}|[sS]/?[nN]" title="Solo números, o S/N si no tiene" placeholder="o S/N" :disabled="submitting" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="f-city">Ciudad</label>
                  <input id="f-city" v-model.trim="form.shippingCity" class="form-control" autocomplete="address-level2" required maxlength="60"
                    pattern="\p{L}[\p{L} .'\-]*" title="Solo letras" :disabled="submitting" />
                </div>
                <div class="form-group form-group-postal">
                  <label for="f-postal">Código Postal</label>
                  <input id="f-postal" v-model.trim="form.shippingPostalCode" class="form-control" autocomplete="postal-code" required maxlength="8"
                    pattern="[0-9]{4}|[A-Za-z][0-9]{4}[A-Za-z]{3}" title="4 números (ej: 5500) o formato completo (ej: M5500ABC)" :disabled="submitting" />
                </div>
              </div>
              <div class="form-group">
                <label for="f-notes">Notas (opcional)</label>
                <textarea id="f-notes" v-model.trim="form.notes" class="form-control" rows="2" maxlength="500" :disabled="submitting"></textarea>
              </div>
            </div>
          </div>
        </form>

        <div class="checkout-summary tac-card">
          <div class="tac-card-body">
            <h5>Tu pedido</h5>
            <div class="checkout-summary-items">
              <div v-for="item in items" :key="item.key" class="checkout-summary-row">
                <span>{{ item.quantity }}× {{ item.name }}<span v-if="item.sizeName"> ({{ item.sizeName }})</span><small v-if="item.selections?.length" class="checkout-choices">{{ describeSelections(item) }}</small></span>
                <span>${{ formatMoney(item.unitPrice * item.quantity) }}</span>
              </div>
            </div>
            <div class="checkout-summary-row">
              <span>Subtotal</span>
              <span>${{ formatMoney(subtotal) }}</span>
            </div>
            <div class="checkout-summary-row" aria-live="polite">
              <span>Envío</span>
              <span v-if="quotingShipping"><span class="spinner spinner-sm" aria-hidden="true"></span> Cotizando…</span>
              <span v-else-if="shippingQuote">{{ shippingQuote.free ? 'Gratis' : `$${formatMoney(shippingQuote.cost)}` }}</span>
              <span v-else class="text-muted">Seleccioná provincia</span>
            </div>
            <div class="checkout-summary-row checkout-total">
              <span>Total</span>
              <span>${{ formatMoney(total) }}</span>
            </div>
            <span v-if="error" class="invalid-feedback d-block mb-2" role="alert">{{ error }}</span>
            <button type="submit" form="checkout-form" class="btn btn-primary btn-lg w-100" :disabled="submitting || !form.shippingZoneId">
              <span v-if="submitting" class="spinner spinner-sm" aria-hidden="true"></span>
              <span v-if="submitting">Procesando…</span>
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
import { getCart, getSubtotal, getTotalWeight, describeSelections } from '../../services/cartService'
import { getShippingZones, quoteShipping } from '../../services/storeService'
import { createOrder, getPendingOrderToken, setPendingOrderToken, getSavedCheckoutForm, saveCheckoutForm } from '../../services/checkoutService'

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
        customerName: '', customerEmail: '', customerEmailConfirmation: '', customerPhone: '', customerDni: '',
        shippingStreet: '', shippingNumber: '', shippingCity: '', shippingPostalCode: '',
        shippingZoneId: '', notes: ''
      }
    }
  },
  computed: {
    emailMismatch() {
      const a = this.form.customerEmail.toLowerCase()
      const b = this.form.customerEmailConfirmation.toLowerCase()
      return b.length > 0 && a !== b
    },
    subtotal() { return getSubtotal(this.items) },
    total() { return this.subtotal + (this.shippingQuote && !this.shippingQuote.free ? this.shippingQuote.cost : 0) }
  },
  async mounted() {
    // Si vuelve con "atrás" desde Mercado Pago, el navegador restaura la página tal cual
    // (con el botón en "Procesando…"): se reactiva.
    window.addEventListener('pageshow', this.onPageShow)
    this.items = getCart()
    // Datos de la última compra en este navegador: el cliente no tiene que cargarlos de nuevo.
    const saved = getSavedCheckoutForm()
    if (saved) {
      for (const field of Object.keys(this.form)) {
        if (saved[field] !== undefined && saved[field] !== null) this.form[field] = saved[field]
      }
    }
    const res = await getShippingZones()
    this.zones = res.data
    if (this.form.shippingZoneId && !this.zones.some(z => z.id === this.form.shippingZoneId)) {
      this.form.shippingZoneId = ''
    }
    if (this.form.shippingZoneId) this.handleQuoteShipping()
  },
  beforeUnmount() {
    window.removeEventListener('pageshow', this.onPageShow)
  },
  methods: {
    describeSelections,
    onPageShow(event) {
      if (event.persisted) this.submitting = false
    },
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
    // El DNI solo admite números: se descartan puntos, letras y espacios mientras se escribe.
    onlyDigits(event, field, max) {
      const clean = event.target.value.replace(/\D/g, '').slice(0, max)
      this.form[field] = clean
      event.target.value = clean
    },
    async handleSubmit() {
      // Dos toques rápidos disparan dos submit antes de que el botón se vea deshabilitado.
      if (this.submitting) return
      this.error = ''
      if (!this.form.shippingZoneId) { this.error = 'Seleccioná una provincia de envío'; return }
      if (this.emailMismatch) { this.error = 'Los emails no coinciden'; return }
      this.submitting = true
      try {
        const payload = {
          ...this.form,
          previousAccessToken: getPendingOrderToken(),
          items: this.items.map(i => ({
            itemType: i.type === 'combo' ? 'COMBO' : 'PRODUCT',
            productId: i.type === 'combo' ? null : i.id,
            comboId: i.type === 'combo' ? i.id : null,
            sizeId: i.sizeId,
            quantity: i.quantity,
            selections: (i.selections || []).map(s => ({ comboItemId: s.comboItemId, productId: s.productId, sizeId: s.sizeId }))
          }))
        }
        const res = await createOrder(payload)
        // El carrito se vacía recién cuando el pago se confirma (OrderStatus), por si vuelve sin pagar.
        setPendingOrderToken(res.data.accessToken)
        saveCheckoutForm(this.form)
        // El botón queda deshabilitado mientras carga Mercado Pago: si se habilitara acá,
        // un segundo toque durante la carga generaría otro pedido.
        if (res.data.initPoint) {
          window.location.href = res.data.initPoint
        } else {
          this.$router.push(`/pedido/${res.data.accessToken}`)
        }
      } catch (e) {
        this.error = e.response?.data?.message || 'No se pudo crear el pedido. Intentá de nuevo.'
        this.submitting = false
      }
    }
  }
}
</script>

<style scoped>
.checkout-choices { display: block; font-size: 0.75rem; color: var(--text-muted); }
.back-link { display: inline-block; color: var(--text-secondary); text-decoration: none; margin-bottom: 1rem; font-size: 0.88rem; }
.back-link:hover { color: var(--crimson-light); }
h1 { font-size: 1.8rem; margin-bottom: 1.5rem; }

.checkout-layout { display: grid; grid-template-columns: 1fr 340px; gap: 2rem; align-items: start; }

.form-row { display: flex; gap: 1rem; }
.form-row .form-group { flex: 1; }
.form-group { margin-bottom: 0.9rem; }
.form-group-number { max-width: 120px; flex: 0 0 auto; }
.form-group-postal { max-width: 160px; flex: 0 0 auto; }
.form-hint { display: block; margin-top: 0.25rem; font-size: 0.75rem; color: var(--text-muted); }
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
  .form-group-number, .form-group-postal { max-width: none; }
}
</style>
