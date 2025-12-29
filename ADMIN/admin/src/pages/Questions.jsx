import React, { useEffect, useState } from "react";
import Topbar from "../components/Topbar";
import Sidebar from "../components/Sidebar";
import { getJSON, del } from "../services/api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "../styles/question.css";

/* 🔹 Helpers */
const toTitleCase = (str = "") =>
  str
    .toLowerCase()
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const truncate = (text = "", max = 20) =>
  text.length > max ? text.slice(0, max) + "..." : text;

export default function Questions() {
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [search, setSearch] = useState("");
  const [subjectId, setSubjectId] = useState("all");

  const [page, setPage] = useState(1);
  const limit = 10;

  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  /* ================= Fetch Subjects ================= */
  useEffect(() => {
    getJSON("/api/admin/subjects?limit=all").then(res => {
      if (res?.subjects) setSubjects(res.subjects);
    });
  }, []);

  /* ================= Fetch Questions ================= */
  useEffect(() => {
    loadQuestions();
  }, [page, search, subjectId]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const res = await getJSON(
        `/api/admin/questions?page=${page}&limit=${limit}&search=${search}&subjectId=${subjectId}`
      );
      setQuestions(res.questions || []);
      setTotalPages(res.totalPages || 1);
    } catch {
      toast.error("Failed to load questions");
    }
    setLoading(false);
  };

  /* ================= Delete ================= */
  const remove = async (id) => {
    if (!window.confirm("Delete question?")) return;
    const res = await del(`/api/admin/questions/${id}`);
    if (res?.message) toast.success(res.message);
    loadQuestions();
  };

  return (
    <div className="layout">
      <Sidebar />

      <main className="main">
        <Topbar title="Questions" />

        <div className="content">

          {/* ================= HEADER FILTER BAR ================= */}
          <div className="question-header-bar">
            {/* Search */}
            <input
              className="question-search"
              placeholder="Search question..."
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />

            {/* Subject */}
            <select
              className="question-subject"
              value={subjectId}
              onChange={(e) => {
                setPage(1);
                setSubjectId(e.target.value);
              }}
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => {
                const name = toTitleCase(s.displayName || s.name);
                return (
                  <option key={s._id} value={s._id}>
                    {truncate(name, 25)}
                  </option>
                );
              })}
            </select>

            {/* Button */}
            <button
              className="question-add-btn"
              onClick={() => navigate("/questions/add")}
            >
              Add Question
            </button>
          </div>

          {/* ================= QUESTIONS LIST ================= */}
          <div className="card-admin question-scroll">
            {loading && <p className="text-center">Loading...</p>}

            {!loading && questions.length === 0 && (
              <p className="text-center muted">No questions found</p>
            )}

            {questions.map((q) => (
              <div key={q._id} className="list-row">
                <div style={{ flex: 1 }}>
                  <strong>{q.title}</strong>
                  <div className="muted">
                    Subject: {toTitleCase(q.subjectName)}
                  </div>
                </div>

                <div>
                  <button
                    className="btn btn-outline-secondary btn-sm me-2"
                    onClick={() => navigate(`/questions/edit/${q._id}`)}
                  >
                    Edit
                  </button>

                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => remove(q._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {/* ================= PAGINATION ================= */}
            {totalPages > 1 && (
              <div className="pagination-wrapper">
                <button
                  className="page-btn"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  ◀ Prev
                </button>

                <span className="page-info">
                  Page <strong>{page}</strong> of{" "}
                  <strong>{totalPages}</strong>
                </span>

                <button
                  className="page-btn"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next ▶
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
