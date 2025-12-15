import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'

import Subjects from './pages/Subjects'
import AddSubject from './pages/AddSubject'
import EditSubject from './pages/EditSubject'   // ⭐ NEW

import Questions from './pages/Questions'
import AddQuestion from './pages/AddQuestion'
import EditQuestion from './pages/EditQuestion' // ⭐ NEW

import PrivateRoute from './components/PrivateRoute'

export default function App() {
  return (
    <Routes>

      {/* Default route */}
      <Route path="/" element={<Login />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={<PrivateRoute><Dashboard /></PrivateRoute>}
      />

      {/* Subjects */}
      <Route
        path="/subjects"
        element={<PrivateRoute><Subjects /></PrivateRoute>}
      />

      <Route
        path="/subjects/add"
        element={<PrivateRoute><AddSubject /></PrivateRoute>}
      />

      {/* ⭐ Edit Subject Route */}
      <Route
        path="/subjects/edit/:id"
        element={<PrivateRoute><EditSubject /></PrivateRoute>}
      />

      {/* Questions */}
      <Route
        path="/questions"
        element={<PrivateRoute><Questions /></PrivateRoute>}
      />

      <Route
        path="/questions/add"
        element={<PrivateRoute><AddQuestion /></PrivateRoute>}
      />

      {/* ⭐ Edit Question Route */}
      <Route
        path="/questions/edit/:id"
        element={<PrivateRoute><EditQuestion /></PrivateRoute>}
      />

      {/* Redirect unknown routes */}
      <Route path="*" element={<Navigate to="/login" replace />} />

    </Routes>
  )
}
