import axios from 'axios'
const API_URL = import.meta.env.VITE_API_URL + '/api/products'

export function getAllProducts() {
  return axios.get(`${API_URL}/all`)
}
export function addProduct(product) {
  return axios.post(`${API_URL}/save`, product)
}
export function deleteProduct(id) {
  return axios.delete(`${API_URL}/${id}`)
}
export function editProduct(product) {
  return axios.post(`${API_URL}/save`, product)
}
export function searchProducts(name) {
  return axios.get(`${API_URL}/search`, { params: { name } })
}
export function getProductById(id) {
  return axios.get(`${API_URL}/${id}`)
}