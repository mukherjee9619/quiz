import React from 'react'
import { useNavigate } from 'react-router-dom'
import "../styles/navbar.css";

export default function Topbar({ title }) {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('admin_user') || '{}')

  const logout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    navigate('/login')
  }

  return (
    <div className="topbar">
      <div className="topbar-left">
        <h3>{title}</h3>
      </div>

      <div className="topbar-right">
        <div className="topbar-user">
          {user.email || 'admin'}
        </div>
        
        {/* Removed Toggle Theme */}

        <button 
          className="btn btn-sm btn-outline-danger"
          onClick={logout}
        >
          Logout
        </button>
      </div>
    </div>
  )
}
