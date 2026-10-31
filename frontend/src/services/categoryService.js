import axios from 'axios'
const API_URL = import.meta.env.VITE_API_URL + '/api/categories'

const ref = (id) => (id ? { id } : null)
const toPayload = ({ id, name, parentId, sizeTypeId }) =>
  ({ id, name, parent: ref(parentId), sizeType: ref(sizeTypeId) })

export function getAllCategories() {
  return axios.get(`${API_URL}/all`)
}
// category: { name, parentId, sizeTypeId }
export function addCategory(category) {
  return axios.post(`${API_URL}/save`, toPayload(category))
}
export function deleteCategory(id) {
  return axios.delete(`${API_URL}/${id}`)
}
// category: { id, name, parentId, sizeTypeId }
export function editCategory(category) {
  return axios.post(`${API_URL}/save`, toPayload(category))
}
