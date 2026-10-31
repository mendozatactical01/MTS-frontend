import axios from 'axios'
const API_URL = import.meta.env.VITE_API_URL + '/api/sizes'

// sizeTypeId vacío/null = talle sin tipo (sirve para cualquier categoría)
const typeRef = (sizeTypeId) => (sizeTypeId ? { id: sizeTypeId } : null)

export function getAllSizes() {
  return axios.get(`${API_URL}/all`)
}
// { categoryId: [talles permitidos] }
export function getSizesByCategory() {
  return axios.get(`${API_URL}/by-category`)
}
export function addSize(name, sizeTypeId = null) {
  return axios.post(`${API_URL}/save`, { name, sizeType: typeRef(sizeTypeId) })
}
export function deleteSize(id) {
  return axios.delete(`${API_URL}/${id}`)
}
export function editSize(id, name, sizeTypeId = null) {
  return axios.post(`${API_URL}/save`, { id, name, sizeType: typeRef(sizeTypeId) })
}
export function searchSizes(name) {
  return axios.get(`${API_URL}/search`, { params: { name } })
}
