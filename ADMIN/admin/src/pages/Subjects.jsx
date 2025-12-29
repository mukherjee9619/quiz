import React, { useEffect, useState } from "react";
import Topbar from "../components/Topbar";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "../styles/subject.css";

const LIMIT = 8;

export default function Subjects() {
  const [list, setList] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  /* =====================
     🔹 Load Subjects
  ===================== */
  const loadSubjects = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `http://127.0.0.1:8081/api/admin/subjects?page=${page}&limit=${LIMIT}&search=${search}`
      );

      const data = await res.json();

      setList(data.subjects || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      toast.error("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, [page, search]);

  /* =====================
     🔹 Delete Subject
  ===================== */
  const remove = async (id) => {
    if (!window.confirm("Delete subject and all questions?")) return;

    try {
      const res = await fetch(
        `http://127.0.0.1:8081/api/admin/subjects/${id}`,
        { method: "DELETE" }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      toast.success("Subject deleted");
      loadSubjects();
    } catch (err) {
      toast.error(err.message || "Delete failed");
    }
  };

  return (
    <div className="layout">
      <Sidebar />

      <main className="main">
        <Topbar title="Subjects" />

        <div className="content">
          <div className="card-admin">

            {/* ===== HEADER ===== */}
            <div className="subject-header">
              <h5>Subject Lists</h5>

              <input
                className="subject-search"
                placeholder="Search subject..."
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
              />

              <button
                className="btn btn-primary"
                onClick={() => navigate("/subjects/add")}
              >
                Add Subject
              </button>
            </div>

            {/* ===== LIST ===== */}
            {loading ? (
              <p className="text-center muted">Loading...</p>
            ) : (
              list.map((s) => (
                <div key={s._id} className="list-row">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800 }}>
                      {(s.displayName || s.name).toUpperCase()}
                    </div>
                    <div className="muted">
                      {s.description || "No description"}
                    </div>
                  </div>

                  <div>
                    <button
                      className="btn btn-outline-secondary btn-sm me-2"
                      onClick={() => navigate(`/subjects/edit/${s._id}`)}
                    >
                      Edit
                    </button>

                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => remove(s._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* ===== PAGINATION ===== */}
            {totalPages > 1 && (
              <div className="pagination-bar">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Prev
                </button>

                <span>
                  Page {page} / {totalPages}
                </span>

                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
