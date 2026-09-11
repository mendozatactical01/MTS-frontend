import axios from 'axios'
import { mockShippingZones, delay } from './mock/mockData'

const API_URL = import.meta.env.VITE_API_URL + '/api/shipping-zones'
const USE_MOCK = true

export function getAllZones() {
  if (USE_MOCK) return delay().then(() => ({ data: mockShippingZones }))
  return axios.get(`${API_URL}/all`)
}

export function addZone(zone) {
  if (USE_MOCK) {
    return delay().then(() => {
      const newZone = { ...zone, id: Math.max(0, ...mockShippingZones.map(z => z.id)) + 1 }
      mockShippingZones.push(newZone)
      return { data: newZone }
    })
  }
  return axios.post(`${API_URL}/save`, zone)
}

export function editZone(zone) {
  if (USE_MOCK) {
    return delay().then(() => {
      const idx = mockShippingZones.findIndex(z => z.id === zone.id)
      if (idx !== -1) mockShippingZones[idx] = { ...mockShippingZones[idx], ...zone }
      return { data: zone }
    })
  }
  return axios.post(`${API_URL}/save`, zone)
}

export function deleteZone(id) {
  if (USE_MOCK) {
    return delay().then(() => {
      const idx = mockShippingZones.findIndex(z => z.id === Number(id))
      if (idx !== -1) mockShippingZones.splice(idx, 1)
      return { data: {} }
    })
  }
  return axios.delete(`${API_URL}/${id}`)
}
