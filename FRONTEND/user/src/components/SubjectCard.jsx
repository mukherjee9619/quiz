import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaBookOpen } from "react-icons/fa";
import toast from "react-hot-toast";
import "../styles/Home.css";

export default function SubjectCard({ subject }) {
  const navigate = useNavigate();

  const handleClick = (e) => {
    const user = JSON.parse(localStorage.getItem("smquiz_user"));

    // ❌ Not logged in
    if (!user) {
      e.preventDefault();
      toast.error("Please login to start the exam");
      navigate("/login", {
        state: { from: `/start/${subject._id}` },
      });
      return;
    }

    // ❌ Admin blocked
    if (user.role === "admin") {
      e.preventDefault();
      toast.error("Admin cannot appear for exam");
      return;
    }
  };

  return (
    <Link
      to={`/start/${subject._id}`}
      className="subject-card"
      onClick={handleClick}
    >
      <div className="subject-icon">
        <FaBookOpen />
      </div>

      <h3 className="subject-title">
        {subject.name.toUpperCase()}
      </h3>

      <p className="subject-desc">
        {subject.description || "Practice questions and test your knowledge"}
      </p>

      <span className="subject-btn">Start Practice →</span>
    </Link>
  );
}
