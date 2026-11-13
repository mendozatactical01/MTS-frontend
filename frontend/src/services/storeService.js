import httpPublic from './httpPublic'
import { mockProducts, mockCombos, delay } from './mock/mockData'

// Etapa A: mientras /api/store/** no existe todavía en el backend, estas
// funciones devuelven fixtures con la misma forma que van a tener las
// respuestas reales. Cambiar a false reemplaza cada función por la llamada
// real a httpPublic (ya están escritas, comentadas abajo de cada mock).
const USE_MOCK = false

export function getPublishedProducts({ categoryId, search } = {}) {
  if (USE_MOCK) {
    return delay().then(() => {
      let items = mockProducts.filter(p => p.published)
      if (categoryId) items = items.filter(p => p.category?.id === categoryId)
      if (search) {
        const q = search.toLowerCase()
        items = items.filter(p => p.name.toLowerCase().includes(q))
      }
      return { data: items }
    })
  }
  return httpPublic.get('/api/store/products', { params: { categoryId, search } })
}

export function getPublishedProductById(id) {
  if (USE_MOCK) {
    return delay().then(() => {
      const product = mockProducts.find(p => p.id === Number(id) && p.published)
      if (!product) return Promise.reject({ response: { status: 404 } })
      return { data: product }
    })
  }
  return httpPublic.get(`/api/store/products/${id}`)
}

export function getPublishedCombos() {
  if (USE_MOCK) {
    return delay().then(() => ({ data: mockCombos.filter(c => c.published) }))
  }
  return httpPublic.get('/api/store/combos')
}

export function getPublishedComboById(id) {
  if (USE_MOCK) {
    return delay().then(() => {
      const combo = mockCombos.find(c => c.id === Number(id) && c.published)
      if (!combo) return Promise.reject({ response: { status: 404 } })
      return { data: combo }
    })
  }
  return httpPublic.get(`/api/store/combos/${id}`)
}

// ── Envíos con Correo Argentino ──

// [{ code: 'M', name: 'Mendoza' }, ...]
export function getProvinces() {
  return httpPublic.get('/api/store/shipping/provinces')
}

// items: los mismos del checkout (toCheckoutItems). Devuelve { options: [{ deliveryType: 'D'|'S',
//   productType: 'CP'|'EP', name, price, daysMin, daysMax }] }
export function quoteShipping({ postalCode, items }) {
  return httpPublic.post('/api/store/shipping/quote', { postalCode, items })
}

// Sucursales de retiro: [{ code, name, address, locality, postalCode }], las del CP del cliente primero.
export function getAgencies(provinceCode, postalCode) {
  return httpPublic.get('/api/store/shipping/agencies', { params: { provinceCode, postalCode } })
}

// Cajas para cotizar: [{ code, label, lengthCm, widthCm, heightCm, defaultWeightG }]
export function getPackageSizes() {
  return httpPublic.get('/api/store/shipping/package-sizes')
}
