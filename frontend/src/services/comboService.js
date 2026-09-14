import axios from 'axios'
import { mockCombos, delay } from './mock/mockData'

const API_URL = import.meta.env.VITE_API_URL + '/api/combos'
const USE_MOCK = false

export function getAllCombos() {
  if (USE_MOCK) return delay().then(() => ({ data: mockCombos }))
  return axios.get(`${API_URL}/all`)
}

export function getComboById(id) {
  if (USE_MOCK) {
    return delay().then(() => {
      const combo = mockCombos.find(c => c.id === Number(id))
      return combo ? { data: combo } : Promise.reject({ response: { status: 404 } })
    })
  }
  return axios.get(`${API_URL}/${id}`)
}

export function addCombo(combo) {
  if (USE_MOCK) {
    return delay().then(() => {
      const newCombo = { ...combo, id: Math.max(0, ...mockCombos.map(c => c.id)) + 1 }
      mockCombos.push(newCombo)
      return { data: newCombo }
    })
  }
  return axios.post(`${API_URL}/save`, combo)
}

export function editCombo(combo) {
  if (USE_MOCK) {
    return delay().then(() => {
      const idx = mockCombos.findIndex(c => c.id === combo.id)
      if (idx !== -1) mockCombos[idx] = { ...mockCombos[idx], ...combo }
      return { data: combo }
    })
  }
  return axios.post(`${API_URL}/save`, combo)
}

export function deleteCombo(id) {
  if (USE_MOCK) {
    return delay().then(() => {
      const idx = mockCombos.findIndex(c => c.id === Number(id))
      if (idx !== -1) mockCombos.splice(idx, 1)
      return { data: {} }
    })
  }
  return axios.delete(`${API_URL}/${id}`)
}
