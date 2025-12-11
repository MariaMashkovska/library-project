import React, { useState, useEffect } from 'react'
import { rentalsAPI, booksAPI, readersAPI } from '../api/api'
import '../App.css'

function Rentals() {
  const [rentals, setRentals] = useState([])
  const [books, setBooks] = useState([])
  const [readers, setReaders] = useState([])
  const [showRentalModal, setShowRentalModal] = useState(false)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [selectedRental, setSelectedRental] = useState(null)
  const [rentalForm, setRentalForm] = useState({
    book_id: '',
    reader_id: '',
    rental_days: 14
  })
  const [damageLevel, setDamageLevel] = useState('')
  const [warningMessage, setWarningMessage] = useState('')
  const [filteredRentals, setFilteredRentals] = useState([])
  const [filters, setFilters] = useState({
    status: 'all' // all, active, overdue
  })
  const [sortBy, setSortBy] = useState('issue_date') // issue_date, expected_return_date, book, reader, rental_cost
  const [sortOrder, setSortOrder] = useState('desc')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    applyFiltersAndSort()
  }, [rentals, filters, sortBy, sortOrder])

  const loadData = async () => {
    try {
      const [rentalsRes, booksRes, readersRes] = await Promise.all([
        rentalsAPI.getAll('active'),
        booksAPI.getAll(), // Load all books to see updated available copies
        readersAPI.getAll()
      ])
      setRentals(rentalsRes.data)
      setBooks(booksRes.data)
      setReaders(readersRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const handleRentBook = async (e) => {
    e.preventDefault()
    
    // Check if book is available
    const selectedBook = books.find(b => b.id === parseInt(rentalForm.book_id))
    if (selectedBook && !selectedBook.is_available) {
      setWarningMessage(`⚠️ Warning: "${selectedBook.title}" is not available. Available copies: ${selectedBook.available_copies}/${selectedBook.total_copies}`)
      return
    }
    
    setWarningMessage('')
    try {
      await rentalsAPI.create({
        ...rentalForm,
        book_id: parseInt(rentalForm.book_id),
        reader_id: parseInt(rentalForm.reader_id)
      })
      setShowRentalModal(false)
      setRentalForm({ book_id: '', reader_id: '', rental_days: 14 })
      setWarningMessage('')
      loadData()
    } catch (error) {
      console.error('Error renting book:', error)
      if (error.response?.status === 400) {
        setWarningMessage('⚠️ Failed to rent book. The book may not be available or the request is invalid.')
      }
    }
  }

  const handleReturnBook = async () => {
    try {
      await rentalsAPI.returnBook(selectedRental.id, damageLevel || null)
      setShowReturnModal(false)
      setSelectedRental(null)
      setDamageLevel('')
      loadData()
    } catch (error) {
      console.error('Error returning book:', error)
    }
  }

  const getBookTitle = (bookId) => {
    const book = books.find(b => b.id === bookId)
    return book ? `${book.title} by ${book.author}` : 'Unknown'
  }

  const getReaderName = (readerId) => {
    const reader = readers.find(r => r.id === readerId)
    return reader ? reader.full_name : 'Unknown'
  }

  const applyFiltersAndSort = () => {
    let filtered = [...rentals]

    // Apply status filter
    if (filters.status === 'active') {
      filtered = filtered.filter(rental => !rental.is_overdue)
    } else if (filters.status === 'overdue') {
      filtered = filtered.filter(rental => rental.is_overdue)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal
      
      switch (sortBy) {
        case 'issue_date':
          aVal = new Date(a.issue_date)
          bVal = new Date(b.issue_date)
          break
        case 'expected_return_date':
          aVal = new Date(a.expected_return_date)
          bVal = new Date(b.expected_return_date)
          break
        case 'book':
          aVal = getBookTitle(a.book_id).toLowerCase()
          bVal = getBookTitle(b.book_id).toLowerCase()
          break
        case 'reader':
          aVal = getReaderName(a.reader_id).toLowerCase()
          bVal = getReaderName(b.reader_id).toLowerCase()
          break
        case 'rental_cost':
          aVal = a.rental_cost
          bVal = b.rental_cost
          break
        default:
          return 0
      }

      if (aVal instanceof Date) {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
      } else if (typeof aVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      } else {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
      }
    })

    setFilteredRentals(filtered)
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className="card-title">Active Rentals</h2>
        <button className="button" onClick={() => setShowRentalModal(true)}>
          + Rent Book
        </button>
      </div>

      {/* Filters and Sorting */}
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
          <label style={{ fontSize: '0.9rem', fontWeight: '500' }}>Filter by Status:</label>
          <select
            className="form-select"
            style={{ width: '200px' }}
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="all">All Rentals</option>
            <option value="active">Active Only</option>
            <option value="overdue">Overdue Only</option>
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
            <option value="issue_date">Issue Date</option>
            <option value="expected_return_date">Expected Return</option>
            <option value="book">Book</option>
            <option value="reader">Reader</option>
            <option value="rental_cost">Rental Cost</option>
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
              setFilters({ status: 'all' })
              setSortBy('issue_date')
              setSortOrder('desc')
            }}
          >
            Reset Filters
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '1rem', color: '#666' }}>
        Showing {filteredRentals.length} of {rentals.length} rentals
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Book</th>
            <th>Reader</th>
            <th>Issue Date</th>
            <th>Expected Return</th>
            <th>Deposit</th>
            <th>Rental Cost</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredRentals.map(rental => (
            <tr key={rental.id} style={{ backgroundColor: rental.is_overdue ? '#fff3cd' : 'transparent' }}>
              <td>{rental.id}</td>
              <td>{getBookTitle(rental.book_id)}</td>
              <td>{getReaderName(rental.reader_id)}</td>
              <td>{new Date(rental.issue_date).toLocaleDateString()}</td>
              <td>{new Date(rental.expected_return_date).toLocaleDateString()}</td>
              <td>${rental.deposit_paid.toFixed(2)}</td>
              <td>${rental.rental_cost.toFixed(2)}</td>
              <td>
                {rental.is_overdue ? (
                  <span className="badge badge-danger">OVERDUE</span>
                ) : (
                  <span className="badge badge-success">Active</span>
                )}
              </td>
              <td>
                <button
                  className="button button-secondary"
                  onClick={() => {
                    setSelectedRental(rental)
                    setShowReturnModal(true)
                  }}
                >
                  Return
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showRentalModal && (
        <div className="modal" onClick={() => {
          setShowRentalModal(false)
          setWarningMessage('')
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Rent a Book</h3>
              <button className="close-button" onClick={() => {
                setShowRentalModal(false)
                setWarningMessage('')
              }}>×</button>
            </div>
            <form onSubmit={handleRentBook}>
              {warningMessage && (
                <div style={{
                  padding: '1rem',
                  marginBottom: '1rem',
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: '8px',
                  color: '#856404'
                }}>
                  {warningMessage}
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Book</label>
                <select
                  className="form-select"
                  value={rentalForm.book_id}
                  onChange={(e) => {
                    setRentalForm({ ...rentalForm, book_id: e.target.value })
                    setWarningMessage('') // Clear warning when book selection changes
                  }}
                  required
                >
                  <option value="">Select a book</option>
                  {books.map(book => (
                    <option 
                      key={book.id} 
                      value={book.id}
                      disabled={!book.is_available}
                    >
                      {book.title} by {book.author} 
                      {book.is_available 
                        ? ` ($${book.deposit_cost.toFixed(2)} deposit, ${book.available_copies} available)`
                        : ` (UNAVAILABLE - ${book.available_copies}/${book.total_copies} copies)`
                      }
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Reader</label>
                <select
                  className="form-select"
                  value={rentalForm.reader_id}
                  onChange={(e) => setRentalForm({ ...rentalForm, reader_id: e.target.value })}
                  required
                >
                  <option value="">Select a reader</option>
                  {readers.map(reader => (
                    <option key={reader.id} value={reader.id}>
                      {reader.full_name} ({reader.category})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Rental Period (days)</label>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  value={rentalForm.rental_days}
                  onChange={(e) => setRentalForm({ ...rentalForm, rental_days: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="button button-secondary" onClick={() => {
                  setShowRentalModal(false)
                  setWarningMessage('')
                }}>
                  Cancel
                </button>
                <button type="submit" className="button">
                  Rent Book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReturnModal && selectedRental && (
        <div className="modal" onClick={() => setShowReturnModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Return Book</h3>
              <button className="close-button" onClick={() => setShowReturnModal(false)}>×</button>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <p><strong>Book:</strong> {getBookTitle(selectedRental.book_id)}</p>
              <p><strong>Reader:</strong> {getReaderName(selectedRental.reader_id)}</p>
              {selectedRental.is_overdue && (
                <p style={{ color: '#dc3545' }}>
                  <strong>This book is overdue!</strong>
                </p>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Damage Level (optional)</label>
              <select
                className="form-select"
                value={damageLevel}
                onChange={(e) => setDamageLevel(e.target.value)}
              >
                <option value="">No damage</option>
                <option value="minor">Minor damage</option>
                <option value="moderate">Moderate damage</option>
                <option value="severe">Severe damage</option>
                <option value="destroyed">Destroyed</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button type="button" className="button button-secondary" onClick={() => setShowReturnModal(false)}>
                Cancel
              </button>
              <button type="button" className="button" onClick={handleReturnBook}>
                Return Book
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Rentals

