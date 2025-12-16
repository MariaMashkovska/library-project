import React, { useState, useEffect } from 'react'
import { booksAPI } from '../api/api'
import '../App.css'

function Books() {
  const [books, setBooks] = useState([])
  const [filteredBooks, setFilteredBooks] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    genre: 'FICTION',
    value: '',
    copies: ''
  })
  const [filters, setFilters] = useState({
    availability: 'all',
    genre: 'all'
  })
  const [sortBy, setSortBy] = useState('title') 
  const [sortOrder, setSortOrder] = useState('asc')

  useEffect(() => {
    loadBooks()
  }, [])

  useEffect(() => {
    applyFiltersAndSort()
  }, [books, filters, sortBy, sortOrder])

  const loadBooks = async () => {
    try {
      const response = await booksAPI.getAll()
      setBooks(response.data)
    } catch (error) {
      console.error('Error loading books:', error)
    }
  }

  const applyFiltersAndSort = () => {
    let filtered = [...books]

    if (filters.availability === 'available') {
      filtered = filtered.filter(book => book.is_available)
    } else if (filters.availability === 'unavailable') {
      filtered = filtered.filter(book => !book.is_available)
    }

    if (filters.genre !== 'all') {
      const genreMap = {
        'FICTION': 'Fiction',
        'NON_FICTION': 'Non-Fiction',
        'SCIENCE': 'Science',
        'HISTORY': 'History',
        'BIOGRAPHY': 'Biography',
        'MYSTERY': 'Mystery',
        'ROMANCE': 'Romance',
        'FANTASY': 'Fantasy'
      }
      const genreValue = genreMap[filters.genre] || filters.genre
      filtered = filtered.filter(book => book.genre === genreValue)
    }

    filtered.sort((a, b) => {
      let aVal, bVal
      
      switch (sortBy) {
        case 'title':
          aVal = a.title.toLowerCase()
          bVal = b.title.toLowerCase()
          break
        case 'author':
          aVal = a.author.toLowerCase()
          bVal = b.author.toLowerCase()
          break
        case 'genre':
          aVal = a.genre
          bVal = b.genre
          break
        case 'value':
          aVal = a.value
          bVal = b.value
          break
        case 'available_copies':
          aVal = a.available_copies
          bVal = b.available_copies
          break
        case 'total_copies':
          aVal = a.total_copies
          bVal = b.total_copies
          break
        default:
          return 0
      }

      if (typeof aVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      } else {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
      }
    })

    setFilteredBooks(filtered)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await booksAPI.create({
        ...formData,
        value: parseFloat(formData.value),
        copies: parseInt(formData.copies)
      })
      setShowModal(false)
      setFormData({ title: '', author: '', genre: 'FICTION', value: '', copies: '' })
      loadBooks()
    } catch (error) {
      console.error('Error creating book:', error)
    }
  }

  const handleDeleteBook = async (bookId) => {
    if (!window.confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
      return
    }
    
    try {
      await booksAPI.delete(bookId)
      loadBooks()
    } catch (error) {
      console.error('Error deleting book:', error)
      if (error.response?.data?.error) {
        alert(error.response.data.error)
      } else {
        alert('Failed to delete book. Make sure it has no active rentals.')
      }
    }
  }

  const genres = ['FICTION', 'NON_FICTION', 'SCIENCE', 'HISTORY', 'BIOGRAPHY', 'MYSTERY', 'ROMANCE', 'FANTASY']

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className="card-title">Books Collection</h2>
        <button className="button" onClick={() => setShowModal(true)}>
          + Add Book
        </button>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '1.5rem', 
        flexWrap: 'wrap',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: '500' }}>Filter by Availability:</label>
          <select
            className="form-select"
            style={{ width: '200px' }}
            value={filters.availability}
            onChange={(e) => setFilters({ ...filters, availability: e.target.value })}
          >
            <option value="all">All Books</option>
            <option value="available">Available Only</option>
            <option value="unavailable">Unavailable Only</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: '500' }}>Filter by Genre:</label>
          <select
            className="form-select"
            style={{ width: '200px' }}
            value={filters.genre}
            onChange={(e) => setFilters({ ...filters, genre: e.target.value })}
          >
            <option value="all">All Genres</option>
            {genres.map(genre => (
              <option key={genre} value={genre}>{genre.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: '500' }}>Sort by:</label>
          <select
            className="form-select"
            style={{ width: '200px' }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="title">Title</option>
            <option value="author">Author</option>
            <option value="genre">Genre</option>
            <option value="value">Value</option>
            <option value="available_copies">Available Copies</option>
            <option value="total_copies">Total Copies</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: '500' }}>Order:</label>
          <select
            className="form-select"
            style={{ width: '150px' }}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button 
            className="button button-secondary"
            onClick={() => {
              setFilters({ availability: 'all', genre: 'all' })
              setSortBy('title')
              setSortOrder('asc')
            }}
          >
            Reset Filters
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '1rem', color: '#666' }}>
        Showing {filteredBooks.length} of {books.length} books
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>Genre</th>
            <th>Value</th>
            <th>Deposit</th>
            <th>Rental/Day</th>
            <th>Copies</th>
            <th>Available</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredBooks.map(book => (
            <tr key={book.id}>
              <td><strong>{book.title}</strong></td>
              <td>{book.author}</td>
              <td>{book.genre}</td>
              <td>${book.value.toFixed(2)}</td>
              <td>${book.deposit_cost.toFixed(2)}</td>
              <td>${book.base_rental_cost.toFixed(2)}</td>
              <td>{book.total_copies}</td>
              <td>{book.available_copies}</td>
              <td>
                {book.is_available ? (
                  <span className="badge badge-success">Available</span>
                ) : (
                  <span className="badge badge-danger">Unavailable</span>
                )}
              </td>
              <td>
                <button
                  className="button button-danger"
                  style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                  onClick={() => handleDeleteBook(book.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add New Book</h3>
              <button className="close-button" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  className="form-input"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Author</label>
                <input
                  className="form-input"
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Genre</label>
                <select
                  className="form-select"
                  value={formData.genre}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                  required
                >
                  {genres.map(genre => (
                    <option key={genre} value={genre}>{genre.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Book Value ($)</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Number of Copies</label>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  value={formData.copies}
                  onChange={(e) => setFormData({ ...formData, copies: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="button button-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="button">
                  Add Book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Books
