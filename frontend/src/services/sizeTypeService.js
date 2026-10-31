import axios from 'axios'
const API_URL = import.meta.env.VITE_API_URL + '/api/size-types'

export function getAllSizeTypes() {
  return axios.get(`${API_URL}/all`)
}
export function saveSizeType(sizeType) {
  return axios.post(`${API_URL}/save`, sizeType)
}
export function deleteSizeType(id) {
  return axios.delete(`${API_URL}/${id}`)
}
