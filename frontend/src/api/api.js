import axios from 'axios'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Books API
export const booksAPI = {
  getAll: (availableOnly = false) => 
    api.get('/books', { params: { available_only: availableOnly } }),
  getById: (id) => api.get(`/books/${id}`),
  create: (book) => api.post('/books', book),
  delete: (id) => api.delete(`/books/${id}`)
}

// Readers API
export const readersAPI = {
  getAll: () => api.get('/readers'),
  getById: (id) => api.get(`/readers/${id}`),
  create: (reader) => api.post('/readers', reader),
  getRentals: (id) => api.get(`/readers/${id}/rentals`),
  delete: (id) => api.delete(`/readers/${id}`)
}

// Rentals API
export const rentalsAPI = {
  getAll: (status = 'all') => 
    api.get('/rentals', { params: { status } }),
  create: (rental) => api.post('/rentals', rental),
  returnBook: (id, damageLevel = null) => 
    api.post(`/rentals/${id}/return`, { damage_level: damageLevel })
}

// Reports API
export const reportsAPI = {
  getAvailableBooks: () => api.get('/reports/available-books'),
  getIssuedBooks: () => api.get('/reports/issued-books'),
  getFinancialStatus: () => api.get('/reports/financial-status'),
  getFinancialHistory: () => api.get('/reports/financial-history')
}

export default api

