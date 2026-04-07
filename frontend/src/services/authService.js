import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL + '/api/auth'

export function login(username, password) {
  return axios.post(`${API_URL}/login`, { username, password })
}

export function register(username, password, role = 'USER') {
  return axios.post(`${API_URL}/register`, { username, password, role })
}

export function saveToken(token) {
  localStorage.setItem('token', token)
}

export function getToken() {
  return localStorage.getItem('token')
}

export function logout() {
  localStorage.removeItem('token')
}

export function isAuthenticated() {
  return !!localStorage.getItem('token')
}
