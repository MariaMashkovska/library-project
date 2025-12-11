import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Books from './components/Books'
import Readers from './components/Readers'
import Rentals from './components/Rentals'
import Reports from './components/Reports'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-container">
            <h1 className="nav-title">📚 Library Management System</h1>
            <div className="nav-links">
              <Link to="/books" className="nav-link">Books</Link>
              <Link to="/readers" className="nav-link">Readers</Link>
              <Link to="/rentals" className="nav-link">Rentals</Link>
              <Link to="/reports" className="nav-link">Reports</Link>
            </div>
          </div>
        </nav>
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Books />} />
            <Route path="/books" element={<Books />} />
            <Route path="/readers" element={<Readers />} />
            <Route path="/rentals" element={<Rentals />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App

