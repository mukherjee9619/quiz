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
      .then((data) =>
        setQuestions(data.filter((q) => q.subjectId === subjectId))
      )
      .catch(() => toast.error("Failed to load exam"));
  }, [subjectId]);

  /* ================= VISITED TRACK ================= */
  useEffect(() => {
    setVisited((prev) => ({ ...prev, [current]: true }));
  }, [current]);

  /* ================= TIMER ================= */
  useEffect(() => {
    if (timeLeft <= 0 && !submittedRef.current) {
      handleSubmit(true);
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  /* ================= SECURITY ================= */
  useEffect(() => {
    const blockContext = (e) => e.preventDefault();
    const keyBlock = (e) => {
      if (
        e.key === "F5" ||
        e.key === "F11" ||
        (e.ctrlKey && ["r", "R", "w", "W"].includes(e.key))
      ) {
        e.preventDefault();
        toast.error("Action blocked during exam");
      }
    };
    document.addEventListener("contextmenu", blockContext);
    document.addEventListener("keydown", keyBlock);
    return () => {
      document.removeEventListener("contextmenu", blockContext);
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
    setAnswers((prev) => ({ ...prev, [current]: index }));
  };

  const toggleReview = () => {
    if (submittedRef.current) return;
    setReview((prev) => ({ ...prev, [current]: !prev[current] }));
  };

  const handleSubmit = (auto = false) => {
    if (submittedRef.current) return;

    if (!auto && !window.confirm("Submit test?")) return;

    submittedRef.current = true;

    const total = questions.length;
    const attempted = Object.keys(answers).length;

    let correct = 0;
    Object.keys(answers).forEach((i) => {
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

  /* ================= EARLY UI ================= */
  if (!questions.length) {
    return <div className="loading">Loading Exam...</div>;
  }

  if (!fullscreenStarted) {
    return (
      <div className="loading">
        <button onClick={() => {
          document.documentElement.requestFullscreen?.();
          setFullscreenStarted(true);
        }}>
          Start Exam
        </button>
      </div>
    );
  }

  /* ================= FORMAT QUESTION ================= */
  const q = questions[current];
  const formatted = formatQuestion(
    q?.question || "",
    q?.explanation || "",
    q?.answerText || ""
  );

  if (!formatted || formatted.isInvalid) {
    return (
      <div className="question-error-box">
        ⚠ Question data is incomplete. Please skip.
      </div>
    );
  }

  /* ================= UI ================= */
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
          <p>{formatted.questionPart}</p>

          {formatted.codePart && (
            <pre className={`language-${formatted.language}`}>
              <code className={`language-${formatted.language}`}>
                {formatted.codePart}
              </code>
            </pre>
          )}

          <div className="options">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => selectOption(i)}
                className={answers[current] === i ? "selected" : ""}
              >
                {opt}
              </button>
            ))}
          </div>

          <div className="cbt-actions">
            <button onClick={() => setCurrent(current - 1)} disabled={current === 0}>Prev</button>
            <button onClick={toggleReview}>Review</button>
            <button onClick={() => setCurrent(current + 1)} disabled={current === questions.length - 1}>Next</button>
            <button onClick={() => handleSubmit(false)}>Submit</button>
          </div>
        </main>
      </div>
    </div>
  );
}
