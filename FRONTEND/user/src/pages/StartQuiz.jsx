import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import "../styles/StartQuiz.css";

export default function StartQuiz() {
  const { subjectId } = useParams();

  const [questions, setQuestions] = useState([]);
  const [subjectName, setSubjectName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  /* ---------------- Fullscreen Detection ---------------- */
  useEffect(() => {
    const onChange = () =>
      setIsFullscreen(!!document.fullscreenElement);

    document.addEventListener("fullscreenchange", onChange);
    return () =>
      document.removeEventListener("fullscreenchange", onChange);
  }, []);

  /* ---------------- Fetch Subject & Questions ---------------- */
  useEffect(() => {
    fetch("http://127.0.0.1:8081/api/admin/subjects")
      .then(res => res.json())
      .then(data => {
        const s = data.find(x => x._id === subjectId);
        if (s) setSubjectName(s.name.toUpperCase());
      });

    fetch("http://127.0.0.1:8081/api/admin/questions")
      .then(res => res.json())
      .then(data => {
        const filtered = data.filter(
          q => q.subjectId === subjectId
        );
        setQuestions(filtered);
      });
  }, [subjectId]);

  /* ---------------- Exam Calculations ---------------- */
  const totalQuestions = questions.length;

  const totalMarks = totalQuestions;
  const passingMarks = Math.ceil(totalQuestions * 0.4);

  // ⏱ Duration = questions × 0.7 minutes
  const durationMinutes = Math.ceil(totalQuestions * 0.7);

  const startAllowed = accepted && isFullscreen;

  /* ---------------- UI ---------------- */
  return (
    <div className="start-quiz-page">
      <div className="start-card">
        <h2>{subjectName || "Instructions..."}</h2>

        <div className="exam-meta">
          <div>Total Questions: {totalQuestions}</div>
          <div>Total Marks: {totalMarks}</div>
          <div>Passing Marks: {passingMarks}</div>
          <div>Duration: {durationMinutes} Minutes</div>
        </div>

        <ul className="instructions">
          <li>
            <strong>Negative Marking:</strong> −1/3 for each wrong answer
          </li>
          <li>Unattempted questions carry no penalty</li>
          <li>Do not refresh or switch tabs</li>
          <li>Fullscreen mode is mandatory</li>
          <li>Exam will auto-submit on time expiry</li>
        </ul>

        <label className="rules-check">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />
          I agree to all instructions
        </label>

        {!isFullscreen && (
          <button
            className="fullscreen-btn"
            onClick={() =>
              document.documentElement.requestFullscreen()
            }
          >
            Enter Fullscreen
          </button>
        )}

        <Link
          to={startAllowed ? `/quiz/${subjectId}` : "#"}
          className={`start-btn ${!startAllowed ? "disabled" : ""}`}
        >
          Start Test
        </Link>
      </div>
    </div>
  );
}
