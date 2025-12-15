import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import "../styles/StartQuiz.css";

export default function StartQuiz() {
  const { subjectId } = useParams();

  const [questions, setQuestions] = useState([]);
  const [subjectName, setSubjectName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () =>
      setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () =>
      document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    fetch("http://127.0.0.1:8081/api/admin/subjects")
      .then(res => res.json())
      .then(data => {
        const s = data.find(x => x._id === subjectId);
        if (s) setSubjectName(s.name.toUpperCase());
      });

    fetch("http://127.0.0.1:8081/api/admin/questions")
      .then(res => res.json())
      .then(data =>
        setQuestions(data.filter(q => q.subjectId === subjectId))
      );
  }, [subjectId]);

  const startAllowed = accepted && isFullscreen;

  return (
    <div className="start-quiz-page">
      <div className="start-card">
        <h2>{subjectName || "Loading..."}</h2>

        <div className="exam-meta">
          <div>Total Questions: {questions.length}</div>
          <div>Total Marks: {questions.length}</div>
          <div>Passing Marks: {Math.ceil(questions.length * 0.4)}</div>
          <div>Duration: 30 Minutes</div>
        </div>

        <ul className="instructions">
          <li>No negative marking</li>
          <li>Do not refresh or switch tabs</li>
          <li>Fullscreen is mandatory</li>
          <li>Auto submit on time expiry</li>
        </ul>

        <label className="rules-check">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />
          I agree to instructions
        </label>

        {!isFullscreen && (
          <button
            onClick={() => document.documentElement.requestFullscreen()}
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
