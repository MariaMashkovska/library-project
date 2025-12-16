import React, { useState, useEffect } from 'react'
import { reportsAPI } from '../api/api'
import * as XLSX from 'xlsx'
import '../App.css'

function Reports() {
  const [issuedBooks, setIssuedBooks] = useState(null)
  const [financialStatus, setFinancialStatus] = useState(null)
  const [financialHistory, setFinancialHistory] = useState(null)
  const [activeTab, setActiveTab] = useState('financial')
  
  // Sorting states for different tabs
  const [issuedBooksSort, setIssuedBooksSort] = useState({ by: 'issue_date', order: 'desc' })
  const [historySort, setHistorySort] = useState({ by: 'date', order: 'desc' })

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      const [issuedRes, financialRes, historyRes] = await Promise.all([
        reportsAPI.getIssuedBooks(),
        reportsAPI.getFinancialStatus(),
        reportsAPI.getFinancialHistory()
      ])
      setIssuedBooks(issuedRes.data)
      setFinancialStatus(financialRes.data)
      setFinancialHistory(historyRes.data)
    } catch (error) {
      console.error('Error loading reports:', error)
    }
  }

  const sortData = (data, sortBy, sortOrder) => {
    if (!data || !Array.isArray(data)) return data
    
    return [...data].sort((a, b) => {
      let aVal, bVal
      
      switch (sortBy) {
        case 'issue_date':
        case 'date':
          aVal = new Date(a[sortBy] || a.issue_date || 0)
          bVal = new Date(b[sortBy] || b.issue_date || 0)
          break
        case 'expected_return_date':
          aVal = new Date(a.expected_return_date || 0)
          bVal = new Date(b.expected_return_date || 0)
          break
        case 'book_title':
          aVal = (a.book_title || '').toLowerCase()
          bVal = (b.book_title || '').toLowerCase()
          break
        case 'reader_name':
          aVal = (a.reader_name || '').toLowerCase()
          bVal = (b.reader_name || '').toLowerCase()
          break
        case 'days_overdue':
          aVal = a.days_overdue || 0
          bVal = b.days_overdue || 0
          break
        case 'type':
          aVal = a.type || ''
          bVal = b.type || ''
          break
        case 'amount':
          aVal = a.amount || 0
          bVal = b.amount || 0
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
  }

  const downloadCSV = () => {
    if (!financialHistory || financialHistory.length === 0) return

    const sortedData = sortData(financialHistory, historySort.by, historySort.order)
    
    // Prepare CSV headers
    const headers = ['Date', 'Type', 'Description', 'Amount', 'Transaction Type']
    
    // Convert data to CSV format
    const csvRows = [
      headers.join(','),
      ...sortedData.map(transaction => {
        const date = new Date(transaction.date).toLocaleDateString()
        const type = transaction.type
        const description = `"${transaction.description.replace(/"/g, '""')}"` // Escape quotes in CSV
        const amount = transaction.amount.toFixed(2)
        const transactionType = transaction.transaction_type === 'income' ? 'Income' :
                               transaction.transaction_type === 'fine' ? 'Fine' : 'Deposit'
        return [date, type, description, amount, transactionType].join(',')
      })
    ]
    
    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `financial_history_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadExcel = () => {
    if (!financialHistory || financialHistory.length === 0) return

    const sortedData = sortData(financialHistory, historySort.by, historySort.order)
    
    // Prepare data for Excel
    const excelData = sortedData.map(transaction => ({
      'Date': new Date(transaction.date).toLocaleDateString(),
      'Type': transaction.type,
      'Description': transaction.description,
      'Amount': transaction.amount,
      'Transaction Type': transaction.transaction_type === 'income' ? 'Income' :
                         transaction.transaction_type === 'fine' ? 'Fine' : 'Deposit'
    }))
    
    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Financial History')
    
    // Set column widths
    const columnWidths = [
      { wch: 12 }, // Date
      { wch: 15 }, // Type
      { wch: 50 }, // Description
      { wch: 12 }, // Amount
      { wch: 18 }  // Transaction Type
    ]
    worksheet['!cols'] = columnWidths
    
    // Download file
    XLSX.writeFile(workbook, `financial_history_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  return (
    <div>
      <div className="card">
        <h2 className="card-title">Reports</h2>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid #e0e0e0' }}>
          <button
            className={`button ${activeTab === 'issued' ? '' : 'button-secondary'}`}
            onClick={() => setActiveTab('issued')}
            style={{ marginBottom: '1rem' }}
          >
            Issued Books
          </button>
          <button
            className={`button ${activeTab === 'financial' ? '' : 'button-secondary'}`}
            onClick={() => setActiveTab('financial')}
            style={{ marginBottom: '1rem' }}
          >
            Financial Status
          </button>
          <button
            className={`button ${activeTab === 'history' ? '' : 'button-secondary'}`}
            onClick={() => setActiveTab('history')}
            style={{ marginBottom: '1rem' }}
          >
            Financial History
          </button>
        </div>

        {activeTab === 'issued' && issuedBooks && (
          <div>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '2rem' }}>
                <div>
                  <strong>Total Issued:</strong> {issuedBooks.total_issued}
                </div>
                <div style={{ color: '#dc3545' }}>
                  <strong>Total Overdue:</strong> {issuedBooks.total_overdue}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: '500' }}>Sort by:</label>
                <select
                  className="form-select"
                  style={{ width: '180px' }}
                  value={issuedBooksSort.by}
                  onChange={(e) => setIssuedBooksSort({ ...issuedBooksSort, by: e.target.value })}
                >
                  <option value="issue_date">Issue Date</option>
                  <option value="expected_return_date">Expected Return</option>
                  <option value="book_title">Book</option>
                  <option value="reader_name">Reader</option>
                  <option value="days_overdue">Days Overdue</option>
                </select>
                <select
                  className="form-select"
                  style={{ width: '120px' }}
                  value={issuedBooksSort.order}
                  onChange={(e) => setIssuedBooksSort({ ...issuedBooksSort, order: e.target.value })}
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Rental ID</th>
                  <th>Book</th>
                  <th>Reader</th>
                  <th>Issue Date</th>
                  <th>Expected Return</th>
                  <th>Days Overdue</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sortData(issuedBooks.rentals, issuedBooksSort.by, issuedBooksSort.order).map(rental => (
                  <tr
                    key={rental.rental_id}
                    style={{ backgroundColor: rental.is_overdue ? '#fff3cd' : 'transparent' }}
                  >
                    <td>{rental.rental_id}</td>
                    <td>{rental.book_title}</td>
                    <td>{rental.reader_name}</td>
                    <td>{new Date(rental.issue_date).toLocaleDateString()}</td>
                    <td>{new Date(rental.expected_return_date).toLocaleDateString()}</td>
                    <td>{rental.days_overdue}</td>
                    <td>
                      {rental.is_overdue ? (
                        <span className="badge badge-danger">OVERDUE</span>
                      ) : (
                        <span className="badge badge-success">Active</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'financial' && financialStatus && (
          <div>
            <div className="grid" style={{ marginBottom: '2rem' }}>
              <div className="stat-card">
                <div className="stat-value">${financialStatus.total_revenue.toFixed(2)}</div>
                <div className="stat-label">Total Revenue</div>
              </div>
              <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                <div className="stat-value">${financialStatus.total_rental_income.toFixed(2)}</div>
                <div className="stat-label">Rental Income</div>
              </div>
              <div className="stat-card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                <div className="stat-value">${financialStatus.total_fines.toFixed(2)}</div>
                <div className="stat-label">Fines Collected</div>
              </div>
              <div className="stat-card" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                <div className="stat-value">${financialStatus.total_deposits.toFixed(2)}</div>
                <div className="stat-label">Total Deposits</div>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div style={{ padding: '1.5rem', background: '#f8f9fa', borderRadius: '8px' }}>
                <h4 style={{ marginBottom: '0.5rem' }}>Active Rentals</h4>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea' }}>
                  {financialStatus.active_rentals}
                </div>
              </div>
              <div style={{ padding: '1.5rem', background: '#f8f9fa', borderRadius: '8px' }}>
                <h4 style={{ marginBottom: '0.5rem' }}>Total Rentals</h4>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea' }}>
                  {financialStatus.total_rentals}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && financialHistory && (
          <div>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                  Financial Operations History
                </h3>
                <p style={{ color: '#666', fontSize: '0.9rem' }}>
                  Complete history of all financial transactions
                </p>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '500' }}>Sort by:</label>
                  <select
                    className="form-select"
                    style={{ width: '150px' }}
                    value={historySort.by}
                    onChange={(e) => setHistorySort({ ...historySort, by: e.target.value })}
                  >
                    <option value="date">Date</option>
                    <option value="type">Type</option>
                    <option value="amount">Amount</option>
                  </select>
                  <select
                    className="form-select"
                    style={{ width: '120px' }}
                    value={historySort.order}
                    onChange={(e) => setHistorySort({ ...historySort, order: e.target.value })}
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="button button-secondary"
                    onClick={downloadCSV}
                    disabled={!financialHistory || financialHistory.length === 0}
                    style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                  >
                    Download CSV
                  </button>
                  <button
                    className="button button-secondary"
                    onClick={downloadExcel}
                    disabled={!financialHistory || financialHistory.length === 0}
                    style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                  >
                    Download Excel
                  </button>
                </div>
              </div>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Transaction Type</th>
                </tr>
              </thead>
              <tbody>
                {financialHistory.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                      No financial operations yet
                    </td>
                  </tr>
                ) : (
                  sortData(financialHistory, historySort.by, historySort.order).map((transaction, index) => (
                    <tr key={`${transaction.id}-${transaction.type}-${index}`}>
                      <td>{new Date(transaction.date).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge ${
                          transaction.transaction_type === 'income' ? 'badge-success' :
                          transaction.transaction_type === 'fine' ? 'badge-danger' :
                          'badge-info'
                        }`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td>{transaction.description}</td>
                      <td style={{ 
                        fontWeight: 'bold',
                        color: transaction.transaction_type === 'income' || transaction.transaction_type === 'fine' ? '#28a745' : '#667eea'
                      }}>
                        ${transaction.amount.toFixed(2)}
                      </td>
                      <td>
                        <span className={`badge ${
                          transaction.transaction_type === 'income' ? 'badge-success' :
                          transaction.transaction_type === 'fine' ? 'badge-warning' :
                          'badge-info'
                        }`}>
                          {transaction.transaction_type === 'income' ? 'Income' :
                           transaction.transaction_type === 'fine' ? 'Fine' : 'Deposit'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Reports

