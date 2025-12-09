import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "../styles/register.css";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();

    // Check if user already exists
    const savedUser = JSON.parse(localStorage.getItem("admin_user"));
    if (savedUser && savedUser.email === email) {
      toast.error("User already exists! Please login.");
      setTimeout(() => navigate("/login"), 800);
      return;
    }

    // Save new admin user
    const user = {
      name,
      email,
      phone,
      password,
      role: "admin",   // IMPORTANT FOR PrivateRoute
    };

    localStorage.setItem("admin_user", JSON.stringify(user));

    toast.success("Registration successful! Please login.");
    setTimeout(() => navigate("/login"), 800);
  };

  return (
    <div className="register-container">
      <div className="glass-card">
        <h2 className="title">Create Admin Account</h2>

        <form onSubmit={submit}>
          <input
            type="text"
            placeholder="Full Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            type="email"
            placeholder="Email Address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="text"
            placeholder="Phone Number"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" className="btn-primary">
            Register
          </button>

          <p className="switch-text">
            Already have an account?{" "}
            <span onClick={() => navigate("/login")}>Login</span>
          </p>
        </form>
      </div>
    </div>
  );
}
