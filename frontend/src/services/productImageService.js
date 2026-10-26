import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL + '/api/products'

export function getProductImages(productId) {
  return axios.get(`${API_URL}/${productId}/images`)
}

// Reemplaza todas las fotos del producto; la primera queda como portada.
export function saveProductImages(productId, urls) {
  return axios.put(`${API_URL}/${productId}/images`, urls)
}
