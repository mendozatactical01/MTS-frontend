import axios from 'axios'
const API_URL = import.meta.env.VITE_API_URL + '/api/stock'

export function getAllStock() {
  return axios.get(`${API_URL}/all`)
}

export function addStock(productId, sizeId, quantity) {
  return axios.post(`${API_URL}/add`, null, {
    params: { productId, sizeId, quantity }
  })
}

export function discountStock(productId, sizeId, quantity) {
  return axios.post(`${API_URL}/discount`, null, {
    params: { productId, sizeId, quantity }
  })
}