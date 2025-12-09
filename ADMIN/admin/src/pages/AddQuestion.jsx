import React, { useEffect, useState } from "react";
import Topbar from "../components/Topbar";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";

export default function AddQuestion() {
  const [subjects, setSubjects] = useState([]);
  const [subject, setSubject] = useState("");
  const [q, setQ] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [answer, setAnswer] = useState(0);

  const navigate = useNavigate();

  // 🔥 Fetch subjects from backend
  const loadSubjects = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8081/api/subjects");
      const data = await res.json();

      if (Array.isArray(data)) {
        setSubjects(data);
      }
    } catch (err) {
      console.log("Subjects fetch error:", err);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const setOpt = (index, value) => {
    setOptions((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  // 🔥 Submit question
  const submit = async (e) => {
    e.preventDefault();

    if (!subject) return alert("Please select subject.");
    if (!q.trim()) return alert("Enter question.");
    if (options.some((o) => !o.trim())) return alert("All 4 options required.");

    if (answer < 0 || answer > 3) return alert("Correct answer index must be 0–3.");

    const payload = {
      subjectId: subject,
      question: q,
      options,
      answer: Number(answer),
    };

    try {
      const res = await fetch("http://127.0.0.1:8081/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Question added successfully!");
        navigate("/questions");
      } else {
        alert(data.message || "Error adding question");
      }
    } catch (err) {
      console.log("Add question error:", err);
      alert("Server error");
    }
  };

  return (
    <div className="layout">
      <Sidebar />

      <main className="main">
        <Topbar title="Add Question" />

        <div className="content">
          <div className="card-admin">
            <form onSubmit={submit}>
              {/* Subject Dropdown */}
              <div className="mb-3">
                <label className="form-label">Subject</label>
                <select
                  className="form-select"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                >
                  <option value="">Select Subject</option>
                  {subjects.map((sub) => (
                    <option key={sub._id} value={sub._id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Question */}
              <div className="mb-3">
                <label className="form-label">Question</label>
                <textarea
                  className="form-control"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  required
                />
              </div>

              {/* Options */}
              {options.map((opt, i) => (
                <div className="mb-3" key={i}>
                  <label className="form-label">Option {i + 1}</label>
                  <input
                    className="form-control"
                    value={opt}
                    onChange={(e) => setOpt(i, e.target.value)}
                    required
                  />
                </div>
              ))}

              {/* Correct Answer */}
              <div className="mb-3">
                <label className="form-label">Correct Answer Index (0-3)</label>
                <input
                  type="number"
                  min="0"
                  max="3"
                  className="form-control"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  required
                />
              </div>

              <button className="btn btn-primary">Add Question</button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
