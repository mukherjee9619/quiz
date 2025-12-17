import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import "../styles/Login.css";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.from || "/";

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  /* ================= HANDLE CHANGE ================= */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const { email, password } = form;

    if (!email || !password) {
      return toast.error("Email and password required");
    }

    try {
      setLoading(true);

      const res = await fetch("http://127.0.0.1:8081/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Invalid credentials");
      }

      /* ================= SAVE SESSION ================= */
      localStorage.setItem(
        "smquiz_user",
        JSON.stringify({
          id: data.user._id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role, // admin | student
        })
      );

      toast.success(`Welcome ${data.user.name}`);

      /* ================= REDIRECT ================= */
      if (data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate(redirectTo);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-card glass">
        <h1 className="login-title">Login</h1>
        <p className="login-subtitle">
          Login to continue your mock exam
        </p>

        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="login-field">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter password"
              value={form.password}
              onChange={handleChange}
            />
          </div>

          <button className="login-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="login-footer">
          New user?
          <Link to="/register"> Create account</Link>
        </div>
      </div>
    </div>
  );
}
