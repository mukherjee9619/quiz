import React from "react";
import { NavLink } from "react-router-dom";
import "../styles/Header.css";

export default function Header() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm sticky-top">
      <div className="container">
        {/* Brand */}
        <NavLink className="navbar-brand fw-bold d-flex align-items-center" to="/">
          <span className="me-2">🧠</span>
          Quiz App
        </NavLink>

        {/* Mobile Toggle */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Menu */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-2">
            <li className="nav-item">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `nav-link px-3 ${isActive ? "active fw-semibold" : ""}`
                }
              >
                Home
              </NavLink>
            </li>

            {/* 🔒 Ready for future expansion */}
            {/* 
            <li className="nav-item">
              <NavLink to="/subjects" className="nav-link px-3">
                Subjects
              </NavLink>
            </li>
            */}
          </ul>
        </div>
      </div>
    </nav>
  );
}
