import httpPublic from './httpPublic'
import { mockOrders, delay } from './mock/mockData'

const USE_MOCK = true

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
