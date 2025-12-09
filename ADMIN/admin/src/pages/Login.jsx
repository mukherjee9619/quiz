import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "../styles/login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    setError("");

    // use the same key you used when registering. earlier code used "admin_user"
    const savedUser = JSON.parse(localStorage.getItem("admin_user"));

    if (!savedUser) {
      setError("User does not exist. Please register first.");
      // small delay so user sees error briefly, then go to register
      setTimeout(() => navigate("/register"), 600);
      return;
    }

    if (savedUser.email === email && savedUser.password === password) {
      localStorage.setItem("admin_token", "sample_token_123");
      toast.success("LOGIN SUCCESSFUL 🎉 WELCOME TO SM QUIZ APP");
      // redirect to dashboard after short delay so toast shows
      setTimeout(() => navigate("/dashboard"), 900);
    } else {
      setError("Invalid email or password");
    }
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

            New User? <span onClick={() => navigate("/register")}>Register59459</span>

         

          </p>
        </form>
      </div>
    </div>
  );
}
