import React, { useEffect, useState } from "react";
import Topbar from "../components/Topbar";
import Sidebar from "../components/Sidebar";
import { getJSON, del, uploadJSONFile } from "../services/api";
import { useNavigate } from "react-router-dom";
import "../styles/question.css";

export default function Questions() {
  const [list, setList] = useState([]);
  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  // Fetch questions on load
  useEffect(() => {
    getJSON("/api/admin/questions").then((res) => {
      if (Array.isArray(res)) setList(res);
    });
  }, []);

  const remove = async (id) => {
    if (!confirm("Delete question?")) return;
    await del(`/api/admin/questions/${id}`);
    setList((prev) => prev.filter((q) => q._id !== id));
  };

  const upload = async () => {
    if (!file) return alert("Please select a JSON file.");

    const res = await uploadJSONFile("/api/admin/questions/import", file);

    if (res?.ok) {
      alert(`Imported ${res.inserted || 0} questions.`);

      // Refresh list after import
      const updated = await getJSON("/api/admin/questions");
      setList(updated);
    } else {
      alert(res?.message || "Import failed.");
    }
  };

  return (
    <div className="layout">
      <Sidebar />
      <main className="main">
        <Topbar title="Questions" />

        <div className="content">
          {/* ========= TOP CARD: Add Question + Upload ========= */}
          <div className="card-admin mb-4">
            <h5 className="mb-3">Add & Import Questions</h5>

            {/* Add Question button */}
            <button
              className="btn btn-primary mb-3"
              onClick={() => navigate("/questions/add")}
            >
              Add Question
            </button>

            <hr />

            {/* Upload JSON */}
            <div className="d-flex align-items-center mt-3">
              <input
                type="file"
                accept=".json"
                onChange={(e) => setFile(e.target.files[0])}
                style={{ width: 200 }}
              />

              <button
                className="btn btn-outline-secondary ms-2"
                onClick={upload}
              >
                Upload JSON
              </button>
            </div>
          </div>

          {/* ========= BOTTOM CARD: Questions List ========= */}
          {/* ========= BOTTOM CARD: Questions List ========= */}
          <div className="card-admin">
            <h5 className="mb-3">Questions List</h5>

            {/* Scrollable area */}
            <div
            className="question-scroll"
              style={{
                maxHeight: "400px", // adjust height as you like
                overflowY: "auto",
                paddingRight: "10px",
              }}
            >
              {list.map((q) => (
                <div key={q._id} className="list-row">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800 }}>{q.question}</div>
                    <div className="muted">Subject: {q.subjectName}</div>
                  </div>

                  <div>
                    <button
                      onClick={() => navigate(`/questions/edit/${q._id}`)}
                      className="btn btn-outline-secondary btn-sm me-2"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => remove(q._id)}
                      className="btn btn-danger btn-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
