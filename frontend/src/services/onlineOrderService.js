import axios from 'axios'
import { mockOrders, delay } from './mock/mockData'

const API_URL = import.meta.env.VITE_API_URL + '/api/online-orders'
const USE_MOCK = false

export function getAllOrders() {
  if (USE_MOCK) return delay().then(() => ({ data: mockOrders }))
  return axios.get(API_URL)
}

export function getOrderById(id) {
  if (USE_MOCK) {
    return delay().then(() => {
      const order = mockOrders.find(o => o.id === Number(id))
      return order ? { data: order } : Promise.reject({ response: { status: 404 } })
    })
  }
  return axios.get(`${API_URL}/${id}`)
}
