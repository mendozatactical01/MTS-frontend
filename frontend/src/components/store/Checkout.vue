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
            <div class="tac-card-header"><h5>Envío por Correo Argentino</h5></div>
            <div class="tac-card-body">
              <div class="form-row">
                <div class="form-group">
                  <label for="f-province">Provincia</label>
                  <select id="f-province" v-model="form.shippingProvinceCode" class="form-select" autocomplete="off" required :disabled="submitting" @change="onProvinceChange">
                    <option value="" disabled>Seleccioná provincia</option>
                    <option v-for="p in provinces" :key="p.code" :value="p.code">{{ p.name }}</option>
                  </select>
                </div>
                <div class="form-group form-group-postal">
                  <label for="f-postal">Código Postal</label>
                  <input id="f-postal" v-model.trim="form.shippingPostalCode" class="form-control" autocomplete="postal-code" required maxlength="8"
                    pattern="[0-9]{4}|[A-Za-z][0-9]{4}[A-Za-z]{3}" title="4 números (ej: 5500) o formato completo (ej: M5500ABC)"
                    placeholder="Ej: 5500" :disabled="submitting" @input="scheduleQuote" />
                </div>
              </div>
              <div class="form-group">
                <label for="f-city">Ciudad / Localidad</label>
                <input id="f-city" v-model.trim="form.shippingCity" class="form-control" autocomplete="address-level2" required maxlength="60"
                  pattern="\p{L}[\p{L} .'\-]*" title="Solo letras" :disabled="submitting" />
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
                <div class="form-group form-group-small">
                  <label for="f-floor">Piso</label>
                  <input id="f-floor" v-model.trim="form.shippingFloor" class="form-control" autocomplete="off" maxlength="3" placeholder="Opc." :disabled="submitting" />
                </div>
                <div class="form-group form-group-small">
                  <label for="f-apartment">Depto</label>
                  <input id="f-apartment" v-model.trim="form.shippingApartment" class="form-control" autocomplete="off" maxlength="3" placeholder="Opc." :disabled="submitting" />
                </div>
              </div>

              <fieldset class="ship-options" aria-live="polite">
                <legend>Forma de envío</legend>
                <p v-if="quotingShipping" class="ship-hint"><span class="spinner spinner-sm" aria-hidden="true"></span> Cotizando con Correo Argentino…</p>
                <p v-else-if="quoteError" class="invalid-feedback d-block" role="alert">{{ quoteError }}</p>
                <p v-else-if="!shippingOptions.length" class="ship-hint">Ingresá tu código postal para ver las opciones y el costo.</p>
                <template v-else>
                  <label v-for="o in shippingOptions" :key="optionKey(o)" class="ship-option" :class="{ selected: selectedOptionKey === optionKey(o) }">
                    <input type="radio" name="ship-option" :value="optionKey(o)" v-model="selectedOptionKey" :disabled="submitting" @change="onOptionChange" />
                    <span class="ship-option-text">
                      <strong>{{ o.deliveryType === 'S' ? 'Retiro en sucursal' : 'A domicilio' }} · {{ o.name }}</strong>
                      <small v-if="o.daysMin && o.daysMax">{{ o.daysMin }} a {{ o.daysMax }} días hábiles</small>
                    </span>
                    <span class="ship-option-price">${{ formatMoney(o.price) }}</span>
                  </label>
                </template>
              </fieldset>

              <div v-if="selectedOption?.deliveryType === 'S'" class="form-group">
                <label for="f-agency">Sucursal donde retirás</label>
                <select id="f-agency" v-model="form.shippingAgencyCode" class="form-select" required :disabled="submitting || loadingAgencies">
                  <option value="" disabled>{{ loadingAgencies ? 'Cargando sucursales…' : 'Elegí la sucursal' }}</option>
                  <option v-for="a in agencies" :key="a.code" :value="a.code">{{ a.name }} — {{ a.address }}, {{ a.locality }}</option>
                </select>
                <small v-if="agenciesError" class="invalid-feedback d-block" role="alert">{{ agenciesError }}</small>
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
              <span v-else-if="selectedOption">${{ formatMoney(selectedOption.price) }}</span>
              <span v-else class="text-muted">{{ shippingOptions.length ? 'Elegí una opción' : 'Ingresá tu CP' }}</span>
            </div>
            <div class="checkout-summary-row checkout-total">
              <span>Total</span>
              <span>${{ formatMoney(total) }}</span>
            </div>
            <span v-if="error" class="invalid-feedback d-block mb-2" role="alert">{{ error }}</span>
            <button type="submit" form="checkout-form" class="btn btn-primary btn-lg w-100" :disabled="submitting || quotingShipping || !canSubmitShipping">
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
import { getCart, getSubtotal, describeSelections } from '../../services/cartService'
import { getProvinces, quoteShipping, getAgencies } from '../../services/storeService'
import { createOrder, toCheckoutItems, getPendingOrderToken, setPendingOrderToken, getSavedCheckoutForm, saveCheckoutForm } from '../../services/checkoutService'

const POSTAL_RE = /^([0-9]{4}|[A-Za-z][0-9]{4}[A-Za-z]{3})$/

export default {
  name: 'Checkout',
  components: { StoreLayout },
  data() {
    return {
      items: [],
      provinces: [],
      shippingOptions: [],
      selectedOptionKey: '',
      quotingShipping: false,
      quoteError: '',
      quotedPostalCode: '',
      quoteTimer: null,
      agencies: [],
      agenciesFor: '',
      loadingAgencies: false,
      agenciesError: '',
      submitting: false,
      error: '',
      form: {
        customerName: '', customerEmail: '', customerEmailConfirmation: '', customerPhone: '', customerDni: '',
        shippingStreet: '', shippingNumber: '', shippingFloor: '', shippingApartment: '',
        shippingCity: '', shippingPostalCode: '', shippingProvinceCode: '',
        shippingDeliveryType: '', shippingProductType: '', shippingAgencyCode: '', notes: ''
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
    selectedOption() { return this.shippingOptions.find(o => this.optionKey(o) === this.selectedOptionKey) || null },
    canSubmitShipping() {
      if (!this.selectedOption || !this.form.shippingProvinceCode) return false
      return this.selectedOption.deliveryType !== 'S' || !!this.form.shippingAgencyCode
    },
    total() { return this.subtotal + (this.selectedOption ? this.selectedOption.price : 0) }
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
    if (this.form.shippingDeliveryType && this.form.shippingProductType) {
      this.selectedOptionKey = `${this.form.shippingDeliveryType}-${this.form.shippingProductType}`
    }
    const res = await getProvinces()
    this.provinces = res.data
    if (this.form.shippingProvinceCode && !this.provinces.some(p => p.code === this.form.shippingProvinceCode)) {
      this.form.shippingProvinceCode = ''
    }
    if (this.items.length) this.handleQuoteShipping()
  },
  beforeUnmount() {
    window.removeEventListener('pageshow', this.onPageShow)
    clearTimeout(this.quoteTimer)
  },
  methods: {
    describeSelections,
    onPageShow(event) {
      if (event.persisted) this.submitting = false
    },
    formatMoney(v) { return Number(v || 0).toLocaleString('es-AR') },
    optionKey(o) { return `${o.deliveryType}-${o.productType}` },
    // Se cotiza cuando el CP queda completo (con una pausa corta mientras se escribe).
    scheduleQuote() {
      clearTimeout(this.quoteTimer)
      this.quoteTimer = setTimeout(this.handleQuoteShipping, 450)
    },
    async handleQuoteShipping() {
      const cp = (this.form.shippingPostalCode || '').toUpperCase()
      if (!POSTAL_RE.test(cp)) {
        this.shippingOptions = []
        this.quoteError = ''
        this.quotedPostalCode = ''
        return
      }
      if (cp === this.quotedPostalCode && this.shippingOptions.length) return
      this.quotingShipping = true
      this.quoteError = ''
      try {
        const res = await quoteShipping({ postalCode: cp, items: toCheckoutItems(this.items) })
        // Si mientras tanto cambió el CP, esta respuesta ya no sirve.
        if (cp !== (this.form.shippingPostalCode || '').toUpperCase()) return
        this.shippingOptions = res.data.options || []
        this.quotedPostalCode = cp
        if (!this.selectedOption) this.selectedOptionKey = ''
        this.onOptionChange()
      } catch (e) {
        this.shippingOptions = []
        this.quotedPostalCode = ''
        this.quoteError = e.response?.data?.message || 'No se pudo cotizar el envío. Probá de nuevo.'
      } finally {
        this.quotingShipping = false
      }
    },
    onProvinceChange() {
      this.form.shippingAgencyCode = ''
      this.loadAgencies()
    },
    onOptionChange() {
      const o = this.selectedOption
      this.form.shippingDeliveryType = o ? o.deliveryType : ''
      this.form.shippingProductType = o ? o.productType : ''
      if (o?.deliveryType === 'S') this.loadAgencies()
    },
    async loadAgencies() {
      if (this.selectedOption?.deliveryType !== 'S' || !this.form.shippingProvinceCode) return
      const key = `${this.form.shippingProvinceCode}|${this.form.shippingPostalCode}`
      if (key === this.agenciesFor && this.agencies.length) return
      this.loadingAgencies = true
      this.agenciesError = ''
      try {
        const res = await getAgencies(this.form.shippingProvinceCode, this.form.shippingPostalCode)
        this.agencies = res.data
        this.agenciesFor = key
        if (!this.agencies.some(a => a.code === this.form.shippingAgencyCode)) this.form.shippingAgencyCode = ''
      } catch (e) {
        this.agencies = []
        this.agenciesError = e.response?.data?.message || 'No se pudieron cargar las sucursales. Probá de nuevo.'
      } finally {
        this.loadingAgencies = false
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
      if (!this.form.shippingProvinceCode) { this.error = 'Seleccioná la provincia'; return }
      if (!this.selectedOption) { this.error = 'Elegí la forma de envío'; return }
      if (this.selectedOption.deliveryType === 'S' && !this.form.shippingAgencyCode) { this.error = 'Elegí la sucursal donde vas a retirar'; return }
      if (this.emailMismatch) { this.error = 'Los emails no coinciden'; return }
      this.submitting = true
      try {
        const payload = {
          ...this.form,
          shippingAgencyCode: this.selectedOption.deliveryType === 'S' ? this.form.shippingAgencyCode : null,
          previousAccessToken: getPendingOrderToken(),
          items: toCheckoutItems(this.items)
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
.form-group-small { max-width: 80px; flex: 0 0 auto; }

.ship-options { border: 0; padding: 0; margin: 0.4rem 0 1rem; }
.ship-options legend {
  font-family: var(--font-display); font-size: 0.75rem; font-weight: 700; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--text-secondary); margin-bottom: 0.5rem;
}
.ship-hint { font-size: 0.85rem; color: var(--text-muted); margin: 0; }
.ship-option {
  display: flex; align-items: center; gap: 0.75rem; padding: 0.65rem 0.85rem; margin-bottom: 0.5rem;
  border: 1px solid var(--border); border-radius: 6px; cursor: pointer;
}
.ship-option:hover { border-color: var(--text-muted); }
.ship-option.selected { border-color: var(--crimson-light); }
.ship-option input { accent-color: var(--crimson-light); flex: 0 0 auto; }
.ship-option-text { flex: 1; display: flex; flex-direction: column; font-size: 0.9rem; }
.ship-option-text small { color: var(--text-muted); font-size: 0.78rem; }
.ship-option-price { font-family: var(--font-display); font-weight: 700; white-space: nowrap; }
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
  .form-group-number, .form-group-postal, .form-group-small { max-width: none; }
}
</style>
