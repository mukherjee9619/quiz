import React from 'react'
import { Navigate } from 'react-router-dom'

export default function PrivateRoute({ children }) {
  const token = localStorage.getItem('admin_token')
  const user = localStorage.getItem('admin_user')

  if (!token || !user) return <Navigate to="/login" replace />

  try {
    const u = JSON.parse(user)
    if (!u.role || (u.role !== 'Admin' && u.role !== 'owner')) {
      return <Navigate to="/login" replace />
    }
  } catch {
    return <Navigate to="/login" replace />
  }

  return children
}
