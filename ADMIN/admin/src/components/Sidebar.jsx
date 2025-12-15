import React from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo">SM</div>
        <div className="brand-name">Quiz Admin</div>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? "active" : ""}>
          Dashboard
        </NavLink>

        <NavLink to="/subjects" className={({ isActive }) => isActive ? "active" : ""}>
          Subjects
        </NavLink>

        <NavLink to="/questions" className={({ isActive }) => isActive ? "active" : ""}>
          Questions
        </NavLink>
      </nav>
    </aside>
  );
}
