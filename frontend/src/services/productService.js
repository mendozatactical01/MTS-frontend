import axios from 'axios'
const API_URL = import.meta.env.VITE_API_URL + '/api/products'

export function getAllProducts() {
  return axios.get(`${API_URL}/all`)
}
export function addProduct(product) {
  return axios.post(`${API_URL}/save`, product)
}
export function deleteProduct(id) {
  return axios.delete(`${API_URL}/${id}`)
}
export function editProduct(product) {
  return axios.post(`${API_URL}/save`, product)
}
export function searchProducts(name) {
  return axios.get(`${API_URL}/search`, { params: { name } })
}
export function getProductById(id) {
  return axios.get(`${API_URL}/${id}`)
}

// Etapa A: sin Cloudinary todavía, se simula devolviendo un data URL local
// para poder previsualizar/guardar la imagen en el mock de productos.
const USE_MOCK_UPLOAD = true

export function uploadImage(file, folder = 'products') {
  if (USE_MOCK_UPLOAD) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve({ data: { url: reader.result } })
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
  const formData = new FormData()
  formData.append('file', file)
  return axios.post(`${import.meta.env.VITE_API_URL}/api/uploads/image`, formData, {
    params: { folder },
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}