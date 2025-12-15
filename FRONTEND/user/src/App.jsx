import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// User Pages
import Home from "./pages/Home";
import StartQuiz from "./pages/StartQuiz";
import Quiz from "./pages/Quiz";
import Result from "./pages/Result";

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
        <Route path="/" element={<Home />} />
        <Route path="/start/:subjectId" element={<StartQuiz />} />
        <Route path="/quiz/:subjectId" element={<Quiz />} />
        <Route path="/result" element={<Result />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}
