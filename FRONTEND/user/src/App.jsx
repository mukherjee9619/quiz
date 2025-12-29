import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// User Pages
import Home from "./pages/Home";
import StartQuiz from "./pages/StartQuiz";
import Quiz from "./pages/Quiz";
import Result from "./pages/Result";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Review from "./pages/Review";

// Route Protection
import ProtectedRoute from "./routes/ProtectedRoute";

export default function App() {
  return (
    <>
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#1e293b",
            color: "#fff",
            fontSize: "14px",
          },
        }}
      />

      {/* Routes */}
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* 🔒 Start Quiz (PROTECTED) */}
        <Route
          path="/start/:subjectId"
          element={
            <ProtectedRoute>
              <StartQuiz />
            </ProtectedRoute>
          }
        />

        {/* 🔒 Exam Page */}
        <Route
          path="/quiz/:subjectId"
          element={
            <ProtectedRoute>
              <Quiz />
            </ProtectedRoute>
          }
        />

        {/* 🔒 Result Page */}
        <Route
          path="/result"
          element={
            <ProtectedRoute>
              <Result />
            </ProtectedRoute>
          }
        />

        {/* 🔒 Review Page */}
        <Route
          path="/review"
          element={
            <ProtectedRoute>
              <Review />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
