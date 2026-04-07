import axios from 'axios'
const API_URL = import.meta.env.VITE_API_URL + '/api/sizes'

export function getAllSizes() {
  return axios.get(`${API_URL}/all`)
}
export function addSize(name) {
  return axios.post(API_URL, { name })
}
export function deleteSize(id) {
  return axios.delete(`${API_URL}/${id}`)
}
export function editSize(id, name) {
  return axios.post(API_URL, { id, name })
}
export function searchSizes(name) {
  return axios.get(`${API_URL}/search`, { params: { name } })
}
