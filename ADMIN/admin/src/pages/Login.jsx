import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import "../styles/login.css";
import { loginUser } from "../services/authApi";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    const response = await loginUser({ email, password });
    const { status, data } = response;

    if (status === 200) {
      // Save session details
      localStorage.setItem("admin_token", "sample_token_123");
      localStorage.setItem("admin_user", JSON.stringify(data));

      toast.success("LOGIN SUCCESSFUL 🎉 WELCOME TO SM QUIZ APP");
      navigate("/dashboard")

      return;
    }

    if (status === 401) {
      setError("Invalid email or password!");
      return;
    }

    setError("Server error. Try again!");
  };

  return (
    <div className="auth-container">
      <div className="glass-card">
        <h2 className="title">Admin Login</h2>

        <form onSubmit={submit}>
          <div className="input-field">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-field">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="error">{error}</p>}

          <button type="submit" className="btn-primary">Login</button>

          <p className="switch-text">
            New User?{" "}
            <span onClick={() => navigate("/register")}>Register</span>
          </p>
        </form>
      </div>
    </div>
  );
}
