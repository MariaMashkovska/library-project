import React, { useState, useEffect } from 'react'
import { readersAPI } from '../api/api'
import '../App.css'

function Readers() {
  const [readers, setReaders] = useState([])
  const [filteredReaders, setFilteredReaders] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    address: '',
    telephone: '',
    category: 'REGULAR'
  })
  const [filters, setFilters] = useState({
    category: 'all'
  })
  const [sortBy, setSortBy] = useState('full_name') // full_name, category, id
  const [sortOrder, setSortOrder] = useState('asc')

  useEffect(() => {
    loadReaders()
  }, [])

  useEffect(() => {
    applyFiltersAndSort()
  }, [readers, filters, sortBy, sortOrder])

  const loadReaders = async () => {
    try {
      const response = await readersAPI.getAll()
      setReaders(response.data)
    } catch (error) {
      console.error('Error loading readers:', error)
    }
  }

  const applyFiltersAndSort = () => {
    let filtered = [...readers]

    // Apply category filter
    if (filters.category !== 'all') {
      const categoryMap = {
        'REGULAR': 'Regular',
        'STUDENT': 'Student',
        'SENIOR': 'Senior',
        'VIP': 'VIP'
      }
      const categoryValue = categoryMap[filters.category] || filters.category
      filtered = filtered.filter(reader => reader.category === categoryValue)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal
      
      switch (sortBy) {
        case 'full_name':
          aVal = a.full_name.toLowerCase()
          bVal = b.full_name.toLowerCase()
          break
        case 'category':
          aVal = a.category
          bVal = b.category
          break
        case 'id':
          aVal = a.id
          bVal = b.id
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

    setFilteredReaders(filtered)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await readersAPI.create(formData)
      setShowModal(false)
      setFormData({ full_name: '', address: '', telephone: '', category: 'REGULAR' })
      loadReaders()
    } catch (error) {
      console.error('Error creating reader:', error)
    }
  }

  const handleDeleteReader = async (readerId) => {
    if (!window.confirm('Are you sure you want to delete this reader? This action cannot be undone.')) {
      return
    }
    
    try {
      await readersAPI.delete(readerId)
      loadReaders()
    } catch (error) {
      console.error('Error deleting reader:', error)
      if (error.response?.data?.error) {
        alert(error.response.data.error)
      } else {
        alert('Failed to delete reader. Make sure they have no active rentals.')
      }
    }
  }

  const categories = [
    { value: 'REGULAR', label: 'Regular' },
    { value: 'STUDENT', label: 'Student (15% discount)' },
    { value: 'SENIOR', label: 'Senior (20% discount)' },
    { value: 'VIP', label: 'VIP (25% discount)' }
  ]

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className="card-title">Registered Readers</h2>
        <button className="button" onClick={() => setShowModal(true)}>
          + Register Reader
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
          <label style={{ fontSize: '0.9rem', fontWeight: '500' }}>Filter by Category:</label>
          <select
            className="form-select"
            style={{ width: '200px' }}
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
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
            <option value="full_name">Full Name</option>
            <option value="category">Category</option>
            <option value="id">ID</option>
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
              setFilters({ category: 'all' })
              setSortBy('full_name')
              setSortOrder('asc')
            }}
          >
            Reset Filters
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '1rem', color: '#666' }}>
        Showing {filteredReaders.length} of {readers.length} readers
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Full Name</th>
            <th>Address</th>
            <th>Telephone</th>
            <th>Category</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredReaders.map(reader => (
            <tr key={reader.id}>
              <td>{reader.id}</td>
              <td><strong>{reader.full_name}</strong></td>
              <td>{reader.address}</td>
              <td>{reader.telephone}</td>
              <td>
                <span className={`badge ${
                  reader.category === 'VIP' ? 'badge-info' :
                  reader.category === 'STUDENT' ? 'badge-success' :
                  reader.category === 'SENIOR' ? 'badge-warning' : ''
                }`}>
                  {reader.category}
                </span>
              </td>
              <td>
                <button
                  className="button button-danger"
                  style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                  onClick={() => handleDeleteReader(reader.id)}
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
              <h3 className="modal-title">Register New Reader</h3>
              <button className="close-button" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  className="form-input"
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Telephone</label>
                <input
                  className="form-input"
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="button button-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="button">
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Readers

