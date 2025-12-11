import React, { useState, useEffect } from 'react'
import { booksAPI } from '../api/api'
import '../App.css'

function Books() {
  const [books, setBooks] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    genre: 'FICTION',
    value: '',
    copies: ''
  })

  useEffect(() => {
    loadBooks()
  }, [])

  const loadBooks = async () => {
    try {
      const response = await booksAPI.getAll()
      setBooks(response.data)
    } catch (error) {
      console.error('Error loading books:', error)
    }
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

  const genres = ['FICTION', 'NON_FICTION', 'SCIENCE', 'HISTORY', 'BIOGRAPHY', 'MYSTERY', 'ROMANCE', 'FANTASY']

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className="card-title">Books Collection</h2>
        <button className="button" onClick={() => setShowModal(true)}>
          + Add Book
        </button>
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
          </tr>
        </thead>
        <tbody>
          {books.map(book => (
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
