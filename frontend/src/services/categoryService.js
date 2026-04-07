import axios from 'axios'
const API_URL = 'http://localhost:8080/api/categories'

export function getAllCategories() {
  return axios.get(`${API_URL}/all`)
}
export function addCategory(name) {
  return axios.post(`${API_URL}/save`, { name })
}
export function deleteCategory(id) {
  return axios.delete(`${API_URL}/${id}`)
}
export function editCategory(id, name) {
  return axios.post(`${API_URL}/save`, { id, name })
}