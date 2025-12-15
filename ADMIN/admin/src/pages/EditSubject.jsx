import React, { useEffect, useState } from "react";
import Topbar from "../components/Topbar";
import Sidebar from "../components/Sidebar";
import { useNavigate, useParams } from "react-router-dom";

export default function EditSubject() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Load single subject (backend has NO GET id route, so filter manually)
  const loadSubject = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8081/api/admin/subjects`);
      const list = await res.json();

      if (!res.ok) {
        alert("Failed to load subjects");
        navigate("/subjects");
        return;
      }

      const subject = list.find((s) => s._id === id);

      if (!subject) {
        alert("Subject not found!");
        navigate("/subjects");
        return;
      }

      setName(subject.name);
      setDescription(subject.description || "");
      setLoading(false);
    } catch (err) {
      console.error(err);
      alert("Could not load subject");
      navigate("/subjects");
    }
  };

  useEffect(() => {
    loadSubject();
  }, []);

  // Update Subject
  const updateSubject = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Subject name is required");
      return;
    }

    try {
      setUpdating(true);

      const res = await fetch(
        `http://127.0.0.1:8081/api/admin/subjects/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, description }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Update failed");
        setUpdating(false);
        return;
      }

      alert("Subject updated successfully!");
      navigate("/subjects");
    } catch (err) {
      console.error(err);
      alert("Server error! Try again");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="layout">
        <Sidebar />
        <main className="main">
          <Topbar title="Edit Subject" />
          <div className="content">
            <div className="card-admin">
              <h4>Loading subject...</h4>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="layout">
      <Sidebar />

      <main className="main">
        <Topbar title="Edit Subject" />

        <div className="content">
          <div className="card-admin">
            <h4>Edit Subject</h4>

            <form onSubmit={updateSubject} className="mt-3">
              <div className="mb-3">
                <label className="form-label fw-bold">Subject Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter subject name"
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Description</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description"
                ></textarea>
              </div>

              <button className="btn btn-primary" disabled={updating}>
                {updating ? "Updating..." : "Update Subject"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
