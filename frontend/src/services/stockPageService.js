import axios from 'axios'
const API_URL = import.meta.env.VITE_API_URL + '/api/stock'

// Una página de productos con su stock por talle. page empieza en 0.
export function getStockPage({ page = 0, size = 20, search = '', categoryId = null, onlyLow = false } = {}) {
  return axios.get(`${API_URL}/page`, {
    params: { page, size, search: search || undefined, categoryId: categoryId || undefined, onlyLow }
  })
}

export function getProductStock(productId) {
  return axios.get(`${API_URL}/product/${productId}`)
}

export function getStockSummary() {
  return axios.get(`${API_URL}/summary`)
}
