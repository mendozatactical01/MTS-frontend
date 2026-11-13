import axios from 'axios'
const API_URL = import.meta.env.VITE_API_URL + '/api/categories'

const ref = (id) => (id ? { id } : null)
const toPayload = ({ id, name, section, sizeTypeId, packageSize }) =>
  ({ id, name, section: section || null, sizeType: ref(sizeTypeId), packageSize: packageSize || null })

export function getAllCategories() {
  return axios.get(`${API_URL}/all`)
}
// Secciones del menú de la tienda ya usadas
export function getCategorySections() {
  return axios.get(`${API_URL}/sections`)
}
// category: { name, section, sizeTypeId, packageSize } (sizeTypeId vacío = no usa talles;
//   packageSize = caja para cotizar envíos, vacío = la de por defecto)
export function addCategory(category) {
  return axios.post(`${API_URL}/save`, toPayload(category))
}
export function deleteCategory(id) {
  return axios.delete(`${API_URL}/${id}`)
}
// category: { id, name, section, sizeTypeId, packageSize }
export function editCategory(category) {
  return axios.post(`${API_URL}/save`, toPayload(category))
}
