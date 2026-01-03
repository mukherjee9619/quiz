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
import "prismjs/components/prism-javascript";

import "../styles/Quiz.css";

const MAX_WARNINGS = 3;
const NEGATIVE_MARK = 1 / 3;

export default function Quiz() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const submittedRef = useRef(false);

  /* ================= STATE ================= */
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [review, setReview] = useState({});
  const [visited, setVisited] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);

  const [showInstructions, setShowInstructions] = useState(true);
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [fullscreenStarted, setFullscreenStarted] = useState(false);
  const [warnings, setWarnings] = useState(0);

  /* ================= FETCH QUESTIONS ================= */
  useEffect(() => {
    fetch(`http://127.0.0.1:8081/api/questions?subjectId=${subjectId}`)
      .then((res) => res.json())
      .then((data) => {
        const mapped = data.questions.map((q) => ({
          ...q,
          question: q.title,
          answer: q.correctAnswer,
        }));

        setQuestions(mapped);

        // ⏱ Dynamic time
        setTimeLeft(Math.ceil(mapped.length * 0.7 * 60));
      })
      .catch(() => toast.error("Failed to load exam"));
  }, [subjectId]);

  /* ================= TIMER ================= */
  useEffect(() => {
    if (!fullscreenStarted) return;

    if (timeLeft <= 0 && !submittedRef.current) {
      handleSubmit(true);
      return;
    }

    const t = setInterval(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, fullscreenStarted]);

  /* ================= TAB / BLUR DETECTION ================= */
  useEffect(() => {
    if (!fullscreenStarted) return;

    const violation = () => {
      setWarnings((w) => {
        const next = w + 1;
        if (next >= MAX_WARNINGS && !submittedRef.current) {
          toast.error("Maximum violations reached. Exam submitted!");
          handleSubmit(true);
        } else {
          toast.error(`Tab switch detected! Warning ${next}/${MAX_WARNINGS}`);
        }
        return next;
      });
    };

    const onVisibility = () => document.hidden && violation();
    const onBlur = () => violation();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
    };
  }, [fullscreenStarted]);

  /* ================= COPY / KEY BLOCK ================= */
  useEffect(() => {
    const block = (e) => e.preventDefault();
    const keyBlock = (e) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        ["c", "x", "a", "p"].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
        toast.error("Action blocked during exam");
      }
    };

    document.addEventListener("contextmenu", block);
    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    document.addEventListener("keydown", keyBlock);

    return () => {
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("keydown", keyBlock);
    };
  }, []);

  /* ================= PRISM ================= */
  useEffect(() => {
    Prism.highlightAll();
  }, [current, questions]);

  /* ================= ACTIONS ================= */
  const selectOption = (i) => {
    if (!submittedRef.current) {
      setAnswers((a) => ({ ...a, [current]: i }));
      setVisited((v) => ({ ...v, [current]: true }));
    }
  };

  const toggleReview = () => {
    if (!submittedRef.current) {
      setReview((r) => ({ ...r, [current]: !r[current] }));
    }
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = (auto = false) => {
    if (submittedRef.current) return;
    if (!auto && !window.confirm("Submit test?")) return;

    submittedRef.current = true;

    const total = questions.length;
    const attempted = Object.keys(answers).length;

    let correct = 0;
    let wrong = 0;

    Object.keys(answers).forEach((i) => {
      answers[i] === questions[i].answer ? correct++ : wrong++;
    });

    const score = correct - wrong * NEGATIVE_MARK;
    const finalScore = Math.max(0, Number(score.toFixed(2)));

    navigate("/result", {
      state: {
        subjectId,
        subjectName: questions[0]?.subjectName || "Subject",
        questions,
        answers,
        total,
        attempted,
        unattempted: total - attempted,
        correct,
        wrong,
        score: finalScore,
        percentage: Number(((finalScore / total) * 100).toFixed(2)),
        pass: finalScore / total >= 0.4,
        warnings,
        timeTaken: Math.ceil(questions.length * 0.7 * 60) - timeLeft,
      },
    });
  };

  /* ================= INSTRUCTIONS (ONLY ONCE) ================= */
  if (showInstructions) {
    return (
      <div className="instructions-overlay">
        <div className="instructions-card">
          <h2>Exam Instructions</h2>

          <ul>
            <li>⏱ Duration: {Math.ceil(questions.length * 0.7)} minutes</li>
            <li>❌ Negative marking: −1/3</li>
            <li>🚫 No tab switching</li>
            <li>⚠ Max {MAX_WARNINGS} warnings</li>
            <li>📱 Fullscreen mandatory</li>
            <li>📤 Auto-submit on timeout</li>
          </ul>

          <label className="agree">
            <input
              type="checkbox"
              checked={acceptedRules}
              onChange={(e) => setAcceptedRules(e.target.checked)}
            />
            I agree to all instructions
          </label>

          <button
            disabled={!acceptedRules}
            className="start-btn"
            onClick={() => {
              document.documentElement.requestFullscreen?.();
              setShowInstructions(false);
              setFullscreenStarted(true);
            }}
          >
            Start Exam
          </button>
        </div>
      </div>
    );
  }

  /* ================= EXAM UI ================= */
  const q = questions[current];
  const formatted = formatQuestion(q, current);

  return (
    <div className="cbt-root">
      <header className="cbt-header">
        <div>CBT EXAM</div>
        <TimerRing timeLeft={timeLeft} />
        <div>
          {current + 1}/{questions.length}
        </div>
      </header>

      <div className="cbt-body">
        <aside className="palette-wrapper">
          <QuestionPalette
            {...{ questions, answers, review, visited, current, setCurrent }}
          />
        </aside>

        <main className="cbt-main">
          <p className="question-text">{formatted.questionPart}</p>

          {q?.type === "output" && q?.code?.content && (
            <pre className="code-block">
              <code className={`language-${q.code.language || "javascript"}`}>
                {q.code.content}
              </code>
            </pre>
          )}

          <div className="options">
            {q.options.map((opt, i) => (
              <button
                key={i}
                className={`option ${answers[current] === i ? "selected" : ""}`}
                onClick={() => selectOption(i)}
              >
                {opt}
              </button>
            ))}
          </div>

          <div className="cbt-actions">
            <button
              disabled={current === 0}
              onClick={() => setCurrent((c) => c - 1)}
            >
              Prev
            </button>

            <button
              className={`review-btn ${review[current] ? "marked" : ""}`}
              onClick={toggleReview}
            >
              Review
            </button>

            <button
              disabled={current === questions.length - 1}
              onClick={() => setCurrent((c) => c + 1)}
            >
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
