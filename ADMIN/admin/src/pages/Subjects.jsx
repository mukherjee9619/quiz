import React, { useEffect, useState } from "react";
import Topbar from "../components/Topbar";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import "../styles/addsubject.css";

export default function Subjects() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ----------------------------------------
  // ✅ Fetch subjects from backend
  // ----------------------------------------
  const loadSubjects = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8081/api/admin/subjects");
      const data = await res.json();

      // Remove null values + sort alphabetically
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
  // 🗑️ Delete Subject
  // ----------------------------------------
  const remove = async (id) => {
    if (!window.confirm("Delete this subject permanently?")) return;

    try {
      const res = await fetch(
        `http://127.0.0.1:8081/api/admin/subjects/${id}`,
        { method: "DELETE" }
      );

      const data = await res.json();
      alert(data.message || "Deleted successfully");

      // Remove subject from UI without full reload
      setList((prev) => prev.filter((sub) => sub._id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete subject");
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

            {/* Loading State */}
            {loading && <p className="muted mt-3">Loading...</p>}

            {/* Empty State */}
            {!loading && list.length === 0 && (
              <p className="muted mt-3">No subjects found.</p>
            )}

            {/* Subject List */}
            {!loading && list.length > 0 && (
              <div style={{ marginTop: 12 }}>
                {list.map((s) => (
                  <div key={s._id} className="list-row">
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800 }}>
                        {s.name.toUpperCase()}
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
                ))}
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
