import React, { useEffect, useState } from "react";
import Topbar from "../components/Topbar";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "../styles/addsubject.css";
import "../styles/confirmModal.css";

export default function Subjects() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);

  const navigate = useNavigate();

  const shortText = (text, max = 40) => {
    if (!text) return "No description";
    return text.length > max ? text.substring(0, max) + "..." : text;
  };

  // ----------------------------------------
  // ✅ Fetch subjects
  // ----------------------------------------
  const loadSubjects = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8081/api/admin/subjects");
      const data = await res.json();

      const cleanData = data
        .filter((x) => x?.name)
        .sort((a, b) => a.name.localeCompare(b.name));

      setList(cleanData);
    } catch (err) {
      console.error("Failed to load subjects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  // ----------------------------------------
  // 🗑️ Open delete confirmation
  // ----------------------------------------
  const openDeleteModal = (subject) => {
    setSelectedSubject(subject);
    setShowModal(true);
  };

  // ----------------------------------------
  // ❌ Cancel delete
  // ----------------------------------------
  const cancelDelete = () => {
    setShowModal(false);
    setSelectedSubject(null);
  };

  // ----------------------------------------
  // ✅ Confirm delete
  // ----------------------------------------
  const confirmDelete = async () => {
    if (!selectedSubject) return;

    try {
      const res = await fetch(
        `http://127.0.0.1:8081/api/admin/questions/subject/${selectedSubject._id}`,
        { method: "DELETE" }
      );

      const data = await res.json();
     toast(data.message || "Deleted successfully");

      setList((prev) =>
        prev.filter((sub) => sub._id !== selectedSubject._id)
      );
    } catch (err) {
      console.error("Delete failed:", err);
      toast("Failed to delete subject");
    } finally {
      cancelDelete();
    }
  };

  return (
    <div className="layout">
      <Sidebar />

      <main className="main">
        <Topbar title="Subjects" />

        <div className="content">
          <div className="card-admin">

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center">
              <h5>Subjects</h5>

              <button
                className="btn btn-primary"
                onClick={() => navigate("/subjects/add")}
              >
                Add Subject
              </button>
            </div>

            {/* Loading */}
            {loading && <p className="muted mt-3">Loading...</p>}

            {/* Empty */}
            {!loading && list.length === 0 && (
              <p className="muted mt-3">No subjects found.</p>
            )}

            {/* List */}
            {!loading && list.length > 0 && (
              <div style={{ marginTop: 12 }}>
                {list.map((s) => (
                  <div key={s._id} className="list-row">
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800 }}>
                        {s.name.toUpperCase()}
                      </div>
                      <div className="muted">
                        {shortText(s.description, 270)}
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
                        onClick={() => openDeleteModal(s)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </main>

      {/* ================= DELETE CONFIRM MODAL ================= */}
      {showModal && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <h4>Are you want to delete this {selectedSubject?.name.toUpperCase()} ?</h4>

            <p>
              This will permanently delete
              <span> {selectedSubject?.name.toUpperCase()} </span>
              and all its questions.
            </p>

            <div className="confirm-actions">
              <button
                className="btn btn-secondary"
                onClick={cancelDelete}
              >
                Cancel
              </button>

              <button
                className="btn btn-danger"
                onClick={confirmDelete}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
