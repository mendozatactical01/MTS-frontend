import httpPublic from './httpPublic'
import { mockProducts, mockCombos, mockShippingZones, delay } from './mock/mockData'

// Etapa A: mientras /api/store/** no existe todavía en el backend, estas
// funciones devuelven fixtures con la misma forma que van a tener las
// respuestas reales. Cambiar a false reemplaza cada función por la llamada
// real a httpPublic (ya están escritas, comentadas abajo de cada mock).
const USE_MOCK = true

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

export function getShippingZones() {
  if (USE_MOCK) {
    return delay().then(() => ({ data: mockShippingZones.filter(z => z.active) }))
  }
  return httpPublic.get('/api/shipping-zones')
}

export function quoteShipping({ shippingZoneId, weightKg, subtotal }) {
  if (USE_MOCK) {
    return delay().then(() => {
      const zone = mockShippingZones.find(z => z.id === Number(shippingZoneId))
      if (!zone) return Promise.reject({ response: { status: 404 } })
      const free = zone.freeShippingThreshold != null && subtotal >= zone.freeShippingThreshold
      const cost = free ? 0 : zone.baseCost + zone.costPerExtraKg * Math.max(0, weightKg - 1)
      return { data: { cost, estimatedDays: zone.estimatedDays, free } }
    })
  }
  return httpPublic.post('/api/store/shipping/quote', { shippingZoneId, weightKg, subtotal })
}
