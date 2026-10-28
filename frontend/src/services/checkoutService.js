import httpPublic from './httpPublic'
import { mockOrders, delay } from './mock/mockData'

const USE_MOCK = false

// checkoutRequest: { customerName, customerEmail, customerPhone, customerDni,
//   shippingStreet, shippingNumber, shippingCity, shippingPostalCode,
//   shippingZoneId, notes, items: [{ itemType, productId|comboId, sizeId, quantity }] }
export function createOrder(checkoutRequest) {
  if (USE_MOCK) {
    return delay(400).then(() => {
      const accessToken = 'mock-' + Math.random().toString(36).slice(2, 12)
      const order = {
        id: mockOrders.length + 1,
        accessToken,
        status: 'PENDING_PAYMENT',
        ...checkoutRequest,
        subtotal: 0,
        shippingCost: 0,
        total: 0,
        mpPaymentStatus: null,
        saleId: null,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60000).toISOString()
      }
      mockOrders.push(order)
      // En sandbox real esto sería el initPoint que devuelve Mercado Pago.
      // Acá simulamos yendo directo a la pantalla de seguimiento del pedido.
      return { data: { accessToken, initPoint: `/pedido/${accessToken}?mock=1` } }
    })
  }
  return httpPublic.post('/api/store/orders', checkoutRequest)
}

export function getOrderByAccessToken(accessToken) {
  if (USE_MOCK) {
    return delay().then(() => {
      const order = mockOrders.find(o => o.accessToken === accessToken)
      if (!order) return Promise.reject({ response: { status: 404 } })
      return { data: order }
    })
  }
  return httpPublic.get(`/api/store/orders/${accessToken}`)
}

// Respaldo del aviso de Mercado Pago: el backend re-consulta si el pedido ya se pagó.
export function syncOrderPayment(accessToken) {
  return httpPublic.post(`/api/store/orders/${accessToken}/sync-payment`)
}

export function cancelOrder(accessToken) {
  return httpPublic.post(`/api/store/orders/${accessToken}/cancel`)
}

// ── Datos que se recuerdan en este navegador ──
// Pedido sin pagar: si el cliente vuelve de Mercado Pago sin pagar, puede retomarlo,
// y si arma uno nuevo el backend cancela este y libera su stock.
const PENDING_KEY = 'mts_pending_order'
// Datos del formulario de checkout, para no tener que cargarlos de nuevo.
const FORM_KEY = 'mts_checkout_form'

function readJson(key) {
  try { return JSON.parse(localStorage.getItem(key)) } catch { return null }
}
function writeJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* sin almacenamiento: se ignora */ }
}

export function getPendingOrderToken() {
  return readJson(PENDING_KEY)?.accessToken || null
}
export function setPendingOrderToken(accessToken) {
  writeJson(PENDING_KEY, { accessToken })
  window.dispatchEvent(new Event('mts-cart-updated'))
}
export function clearPendingOrderToken(accessToken) {
  if (accessToken && getPendingOrderToken() !== accessToken) return
  try { localStorage.removeItem(PENDING_KEY) } catch { /* ignorar */ }
}

export function getSavedCheckoutForm() {
  return readJson(FORM_KEY)
}
export function saveCheckoutForm(form) {
  writeJson(FORM_KEY, form)
}
