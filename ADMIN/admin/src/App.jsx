import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Subjects from './pages/Subjects'
import AddSubject from './pages/AddSubject'
import Questions from './pages/Questions'
import AddQuestion from './pages/AddQuestion'
import PrivateRoute from './components/PrivateRoute'

export default function App(){
  return (
    <Routes>

      {/* Default route */}
      <Route path="/" element={<Login />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/dashboard" element={
        <PrivateRoute><Dashboard /></PrivateRoute>
      } />

      <Route path="/subjects" element={
        <PrivateRoute><Subjects /></PrivateRoute>
      } />
      <Route path="/subjects/add" element={
        <PrivateRoute><AddSubject /></PrivateRoute>
      } />

      <Route path="/questions" element={
        <PrivateRoute><Questions /></PrivateRoute>
      } />
      <Route path="/questions/add" element={
        <PrivateRoute><AddQuestion /></PrivateRoute>
      } />

      {/* last route: redirect all unknown routes */}
      <Route path="*" element={<Navigate to="/login" replace />} />

    </Routes>
  )
}
