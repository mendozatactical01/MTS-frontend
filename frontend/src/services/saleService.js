import axios from 'axios'
const API_URL = import.meta.env.VITE_API_URL + '/api/sales'

export function getAllSales() {
  return axios.get(`${API_URL}/all`)
}

export function createSale(saleDTO) {
  return axios.post(`${API_URL}/save`, saleDTO)
}
export function getTodaySales() {
  return axios.get(`${API_URL}/today`)
}
export function getSalesByDate(date) {
  return axios.get(`${API_URL}/by-date`, { params: { date } })
  
}
export function searchSalesByName(name) {
  return axios.get(`${API_URL}/search-by-name`, { params: { name } })
}

export function searchSalesByIdentification(identification) {
  return axios.get(`${API_URL}/search-by-identification`, { params: { identification } })
}

export function updateSale(id, saleDTO) {
  return axios.put(`${API_URL}/${id}`, saleDTO)
}
export function deleteSale(id) {
  return axios.delete(`${API_URL}/${id}`)
}
