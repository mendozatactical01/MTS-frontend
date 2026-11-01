import axios from 'axios'
const API_URL = import.meta.env.VITE_API_URL + '/api/categories'

const ref = (id) => (id ? { id } : null)
const toPayload = ({ id, name, section, sizeTypeId }) =>
  ({ id, name, section: section || null, sizeType: ref(sizeTypeId) })

export function getAllCategories() {
  return axios.get(`${API_URL}/all`)
}
// Secciones del menú de la tienda ya usadas
export function getCategorySections() {
  return axios.get(`${API_URL}/sections`)
}
// category: { name, section, sizeTypeId } (sizeTypeId vacío = no usa talles)
export function addCategory(category) {
  return axios.post(`${API_URL}/save`, toPayload(category))
}
export function deleteCategory(id) {
  return axios.delete(`${API_URL}/${id}`)
}
// category: { id, name, section, sizeTypeId }
export function editCategory(category) {
  return axios.post(`${API_URL}/save`, toPayload(category))
}
