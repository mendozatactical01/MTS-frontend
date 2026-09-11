import axios from 'axios'

// Instancia separada para la tienda pública: sin los interceptors de JWT/401
// de main.js, para que un error ahí nunca dispare el redirect a /login del panel.
const httpPublic = axios.create({
  baseURL: import.meta.env.VITE_API_URL
})

export default httpPublic
