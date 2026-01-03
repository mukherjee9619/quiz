import React from "react";
import { Link } from "react-router-dom";
import { FaBookOpen } from "react-icons/fa";
import "../styles/Home.css";

export default function SubjectCard({ subject }) {
  return (
    <Link to={`/quiz/${subject._id}`} className="subject-card">
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
