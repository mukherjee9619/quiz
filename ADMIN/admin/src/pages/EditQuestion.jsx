import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import toast from "react-hot-toast";
import "../styles/editQuestion.css";

export default function EditQuestion() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [subjectId, setSubjectId] = useState("");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");

  /* ================= LOAD QUESTION BY ID ================= */
  useEffect(() => {
    // console.log("useEffect triggered, id =", id);

    const fetchQuestion = async () => {
      console.log("fetchQuestion called");

      try {
        const res = await fetch(`/api/admin/questions/${id}`, {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("admin_token")}`,
          },
        });


        // console.log("response status", res.status);

        const data = await res.json();
        console.log("API DATA:", data);

        if (!res.ok) throw new Error(data.message);

        setSubjectId(data.subjectName);
        setQuestion(data.question);
        setOptions(data.options);
        setCorrectAnswer(String(data.correctAnswer));
      } catch (err) {
        console.error(err);
        toast.error("Failed to load question");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [id]);

  /* ================= UPDATE ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`/api/admin/questions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId,
          question,
          options,
          correctAnswer: Number(correctAnswer),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success("Question updated");
      navigate("/questions");
    } catch (err) {
      toast.error(err.message || "Update failed");
    }
  };

  if (loading) return <p className="text-center">Loading...</p>;

  return (
    <div className="admin-layout">
      <Sidebar />

      <div className="admin-main">
        <Topbar title="Edit Question" />

        <div className="admin-content">
          {/* ✅ Breadcrumb */}
          <div className="breadcrumb clean">
            <span onClick={() => navigate("/dashboard")}>Dashboard</span>
            <span>/</span>
            <span onClick={() => navigate("/questions")}>Questions</span>
            <span>/</span>
            <span className="active">Edit</span>
          </div>

          <div className="editq-card">
            <h2>Edit Question</h2>

            <form onSubmit={handleSubmit}>
              <label>Subject Name</label>
              <input value={subjectId} disabled />

              <label>Question</label>
              <textarea
                rows="3"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required
              />

              {options.map((opt, i) => (
                <div key={i}>
                  <label>Option {i + 1}</label>
                  <input
                    value={opt}
                    onChange={(e) => {
                      const copy = [...options];
                      copy[i] = e.target.value;
                      setOptions(copy);
                    }}
                    required
                  />
                </div>
              ))}

              <label>Correct Answer</label>
              <select
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                required
              >
                <option value="0">Option 1</option>
                <option value="1">Option 2</option>
                <option value="2">Option 3</option>
                <option value="3">Option 4</option>
              </select>

              <button type="submit">Update Question</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
