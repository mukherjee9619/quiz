import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { loginUser } from "../services/authApi";
import "../styles/Login.css"; // Use the same CSS

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await loginUser({ email, password });

      if (response.status === 200) {
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem("user_token", response.data.token);

        toast.success(`Welcome back ${response.data.user.name}`);
        navigate("/dashboard");
      } else {
        setError("Invalid email or password");
      }
    } catch {
      setError("Login failed");
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2 className="login-title">Login</h2>
        {/* <p className="login-subtitle">Sign in to continue</p> */}

        <form onSubmit={submit}>
          {/* EMAIL */}
          <div className="input-group">
            <label>Email address</label>
            <input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* PASSWORD */}
          <div className="input-group">
            <label>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: "40px" }}
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  color: "#2563eb",
                }}
              >
                {showPassword ? "🙈" : "👁️"}
              </span>
            </div>
          </div>

          {/* OPTIONS */}
          <div className="options-row">
            <label className="remember">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>Remember me</span>
            </label>

            <span
              className="forgot"
              role="button"
              onClick={() => navigate("/forgot-password")}
            >
              Forgot password?
            </span>
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button type="submit" className="login-btn">
            Login →
          </button>

          <div className="register">
            Don’t have an account?
            <span onClick={() => navigate("/register")}> Register</span>
          </div>
        </form>
      </div>
    </div>
  );
}
