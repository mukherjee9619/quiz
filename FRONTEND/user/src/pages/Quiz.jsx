import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import TimerRing from "../components/TimerRing";
import QuestionPalette from "../components/QuestionPalette";
import { formatQuestion } from "../utils/formatQuestion";
import Prism from "prismjs";

import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-java";
import "prismjs/components/prism-python";

import "../styles/Quiz.css";

export default function Quiz() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const submittedRef = useRef(false);

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [review, setReview] = useState({});
  const [visited, setVisited] = useState({});
  const [timeLeft, setTimeLeft] = useState(60 * 30);
  const [fullscreenStarted, setFullscreenStarted] = useState(false);

  /* ================= FETCH QUESTIONS ================= */
  useEffect(() => {
    fetch("http://127.0.0.1:8081/api/admin/questions")
      .then((res) => res.json())
      .then((data) => {
        const filtered = data.filter(q => q.subjectId === subjectId);
        const normalized = filtered.map(q => ({
          ...q,
          question: q.title,
          answer: q.correctAnswer
        }));
        setQuestions(normalized);
      })
      .catch(() => toast.error("Failed to load exam"));
  }, [subjectId]);

  /* ================= VISITED ================= */
  useEffect(() => {
    setVisited(prev => ({ ...prev, [current]: true }));
  }, [current]);

  /* ================= TIMER ================= */
  useEffect(() => {
    if (timeLeft <= 0 && !submittedRef.current) {
      handleSubmit(true);
      return;
    }
    const t = setInterval(() => setTimeLeft(v => v - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  /* ================= SECURITY ================= */
  useEffect(() => {
    const block = e => e.preventDefault();
    const keyBlock = e => {
      if (
        e.key === "F5" ||
        e.key === "F11" ||
        (e.ctrlKey && ["r", "R", "w", "W"].includes(e.key))
      ) {
        e.preventDefault();
        toast.error("Action blocked during exam");
      }
    };
    document.addEventListener("contextmenu", block);
    document.addEventListener("keydown", keyBlock);
    return () => {
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("keydown", keyBlock);
    };
  }, []);

  /* ================= PRISM ================= */
  useEffect(() => {
    Prism.highlightAll();
  }, [current, questions]);

  /* ================= ACTIONS ================= */
  const selectOption = (index) => {
    if (submittedRef.current) return;
    setAnswers(prev => ({ ...prev, [current]: index }));
  };

  const toggleReview = () => {
    if (submittedRef.current) return;
    setReview(prev => ({ ...prev, [current]: !prev[current] }));
  };

  const handleSubmit = (auto = false) => {
    if (submittedRef.current) return;
    if (!auto && !window.confirm("Submit test?")) return;

    submittedRef.current = true;

    const total = questions.length;
    const attempted = Object.keys(answers).length;
    let correct = 0;

    Object.keys(answers).forEach(i => {
      if (answers[i] === questions[i].answer) correct++;
    });

    navigate("/result", {
      state: {
        subjectId,
        total,
        attempted,
        unattempted: total - attempted,
        correct,
        wrong: attempted - correct,
        score: correct,
        percentage: Math.round((correct / total) * 100),
        pass: correct / total >= 0.4,
        timeTaken: 60 * 30 - timeLeft,
        questions,
        answers,
        review,
      },
    });
  };

  if (!questions.length) {
    return <div className="loading">Loading Exam...</div>;
  }

  if (!fullscreenStarted) {
    return (
      <div className="loading">
        <button
          onClick={() => {
            document.documentElement.requestFullscreen?.();
            setFullscreenStarted(true);
          }}
        >
          Start Exam
        </button>
      </div>
    );
  }

  const q = questions[current];
  const formatted = formatQuestion(q, current);

  return (
    <div className="cbt-root">
      <header className="cbt-header">
        <div>CBT EXAM</div>
        <TimerRing timeLeft={timeLeft} />
        <div>{current + 1} / {questions.length}</div>
      </header>

      <div className="cbt-body">
        <QuestionPalette
          questions={questions}
          answers={answers}
          review={review}
          visited={visited}
          current={current}
          setCurrent={setCurrent}
        />

        <main className="cbt-main">
          <p className="question-text">{formatted.questionPart}</p>

          {formatted.codePart && (
            <pre className={`language-${formatted.language}`}>
              <code className={`language-${formatted.language}`}>
                {formatted.codePart}
              </code>
            </pre>
          )}

          <div className="options">
            {formatted.isInvalid ? (
              <div className="question-error-box">
                ⚠ Invalid or incomplete question
              </div>
            ) : (
              q.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => selectOption(i)}
                  className={`option ${answers[current] === i ? "selected" : ""}`}
                >
                  {opt}
                </button>
              ))
            )}
          </div>

          <div className="cbt-actions">
            <button onClick={() => setCurrent(c => c - 1)} disabled={current === 0}>
              Prev
            </button>
            <button className={`review-btn ${review[current] ? "marked" : ""}`} onClick={toggleReview}>
              Review
            </button>
            <button onClick={() => setCurrent(c => c + 1)} disabled={current === questions.length - 1}>
              Next
            </button>
            <button className="submit-btn" onClick={() => handleSubmit(false)}>
              Submit
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
