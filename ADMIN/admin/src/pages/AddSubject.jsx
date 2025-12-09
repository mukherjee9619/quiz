import React, { useState } from "react";
import Topbar from "../components/Topbar";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";

export default function AddSubject() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();

  const submitForm = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Subject name is required");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("http://127.0.0.1:8081/api/admin/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim().toLowerCase(),   // normalize
          description,
        }),
      });

      const data = await res.json();

      // ❌ Duplicate name (from backend 409)
      if (res.status === 409) {
        alert("⚠️ This subject already exists!");
        setSaving(false);
        return;
      }

      // ❌ Other errors
      if (!res.ok) {
        alert(data.message || "Failed to add subject");
        setSaving(false);
        return;
      }

      // ✅ Success
      alert("🎉 Subject added successfully");
      navigate("/subjects");

    } catch (err) {
      console.error(err);
      alert("Server error. Try again!");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="layout">
      <Sidebar />

      <main className="main">
        <Topbar title="Add Subject" />

        <div className="content">
          <div className="card-admin">

            <h4>Add New Subject</h4>

            <form onSubmit={submitForm} className="mt-3">

              <div className="mb-3">
                <label className="form-label fw-bold">Subject Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter subject name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Description</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Enter description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>

              <button className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Submit"}
              </button>

              <button
                type="button"
                className="btn btn-secondary ms-2"
                onClick={() => navigate("/subjects")}
              >
                Cancel
              </button>

            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
