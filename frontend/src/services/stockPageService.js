import axios from 'axios'
const API_URL = import.meta.env.VITE_API_URL + '/api/stock'

// Una página de productos con su stock por talle. page empieza en 0.
// categoryId puede ser una sección ("sec:Pesca") para ver todas sus categorías.
export function getStockPage({ page = 0, size = 20, search = '', categoryId = null, onlyLow = false } = {}) {
  const isSection = typeof categoryId === 'string' && categoryId.startsWith('sec:')
  return axios.get(`${API_URL}/page`, {
    params: {
      page, size, search: search || undefined, onlyLow,
      categoryId: !isSection && categoryId ? categoryId : undefined,
      section: isSection ? categoryId.slice(4) : undefined
    }
  })
}

export function getProductStock(productId) {
  return axios.get(`${API_URL}/product/${productId}`)
}

export function getStockSummary() {
  return axios.get(`${API_URL}/summary`)
}
