import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/Result.css";

export default function Result() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state) {
    return <div className="result-error">No Result Data</div>;
  }

  const {
    total,
    attempted,
    unattempted,
    correct,
    wrong,
    score,
    accuracy,
    percentage,
    timeTaken,
  } = state;

  // Determine pass/fail based on percentage cutoff
  const isPass = percentage >= 40; // change cutoff as needed

  const minutes = Math.floor(timeTaken / 60);
  const seconds = timeTaken % 60;

  return (
    <div className={`result-root ${isPass ? "pass-anim" : "fail-anim"}`}>
      <div className="result-card glass">
        <h1 className="result-title">Exam Result</h1>

        <div className={`result-status ${isPass ? "pass" : "fail"}`}>
          {isPass ? "PASS" : "FAIL"}
        </div>

        {/* SCORE RING */}
        <div className="score-ring">
          <svg>
            <circle cx="70" cy="70" r="60" />
            <circle
              cx="70"
              cy="70"
              r="60"
              style={{
                strokeDashoffset: 377 - (377 * percentage) / 100,
              }}
            />
          </svg>
          <div className="score-text">
            <span>{score}</span>
            <small>/ {total}</small>
          </div>
        </div>

        {/* STATS */}
        <div className="result-grid">
          <Stat label="Total Questions" value={total} />
          <Stat label="Attempted" value={attempted} />
          <Stat label="Unattempted" value={unattempted} />
          <Stat label="Correct" value={correct} />
          <Stat label="Wrong" value={wrong} />
          <Stat label="Accuracy" value={`${accuracy}%`} />
          <Stat label="Time Taken" value={`${minutes}m ${seconds}s`} />
        </div>

        {/* ACTIONS */}
        <div className="result-actions">
          <button onClick={() => navigate("/")}>Home</button>
          <button
            className="secondary"
            onClick={() => alert("Review feature coming next")}
          >
            Review Answers
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
