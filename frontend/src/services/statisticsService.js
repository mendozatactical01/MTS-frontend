import axios from 'axios'
const API_URL = 'http://localhost:8080/api/statistics'

export function getStatisticsToday() {
  return axios.get(`${API_URL}/today`)
}
export function getStatisticsMonth() {
  return axios.get(`${API_URL}/month`)
}
export function getStatisticsYear() {
  return axios.get(`${API_URL}/year`)
}
export function getStatisticsByRange(from, to) {
  return axios.get(`${API_URL}/range`, { params: { from, to } })
}
export function getStatisticsByMonth(year) {
  return axios.get(`${API_URL}/by-month`, { params: { year } })
}
export function getStatisticsByCategory() {
  return axios.get(`${API_URL}/by-category`)
}
