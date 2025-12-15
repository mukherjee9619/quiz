import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

export default function EditQuestion() {
  const { id } = useParams(); // question ID from URL
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    subjectId: "",
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
  });

  // ============================
  // Load all subjects
  // ============================
  const fetchSubjects = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8081/api/admin/subjects");
      setSubjects(res.data);
    } catch (err) {
      toast.error("Failed to load subjects");
    }
  };

  // ============================
  // Load question details
  // ============================
  const fetchQuestion = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8081/api/admin/questions");
      const question = res.data.find((q) => q._id === id);

      if (!question) {
        toast.error("Question not found!");
        return navigate("/questions");
      }

      setForm({
        subjectId: question.subjectId,
        question: question.question,
        options: [...question.options],
        correctAnswer: question.correctAnswer,
      });
    } catch (err) {
      toast.error("Failed to load question");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
    fetchQuestion();
  }, []);

  // ============================
  // Handle Input Change
  // ============================
  const handleOptionChange = (value, index) => {
    const updatedOptions = [...form.options];
    updatedOptions[index] = value;

    setForm({ ...form, options: updatedOptions });
  };

  // ============================
  // Submit Updated Question
  // ============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.put(`http://127.0.0.1:8081/api/admin/questions/${id}`, form);

      toast.success("Question updated successfully!");
      navigate("/questions");
    } catch (err) {
      toast.error("Update failed!");
    }
  };

  if (loading) return <p className="p-4">Loading...</p>;

  return (
    <div className="container my-4" style={{ maxWidth: "700px" }}>
      <h2 className="mb-4">✏️ Edit Question</h2>

      <form onSubmit={handleSubmit}>
        {/* Subject Dropdown */}
        <div className="mb-3">
          <label className="form-label">Select Subject</label>
          <select
            className="form-select"
            value={form.subjectId}
            onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
            required
          >
            <option value="">Choose Subject</option>
            {subjects.map((sub) => (
              <option key={sub._id} value={sub._id}>
                {sub.name.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Question */}
        <div className="mb-3">
          <label className="form-label">Question</label>
          <textarea
            className="form-control"
            rows="3"
            value={form.question}
            onChange={(e) =>
              setForm({ ...form, question: e.target.value })
            }
            required
          ></textarea>
        </div>

        {/* Options */}
        {form.options.map((opt, index) => (
          <div className="mb-3" key={index}>
            <label className="form-label">Option {index + 1}</label>
            <input
              type="text"
              className="form-control"
              value={opt}
              onChange={(e) => handleOptionChange(e.target.value, index)}
              required
            />
          </div>
        ))}

        {/* Correct Answer */}
        <div className="mb-3">
          <label className="form-label">Correct Answer (0-3)</label>
          <select
            className="form-select"
            value={form.correctAnswer}
            onChange={(e) =>
              setForm({ ...form, correctAnswer: Number(e.target.value) })
            }
            required
          >
            <option value={0}>Option 1</option>
            <option value={1}>Option 2</option>
            <option value={2}>Option 3</option>
            <option value={3}>Option 4</option>
          </select>
        </div>

        <button className="btn btn-primary w-100">Update Question</button>
      </form>
    </div>
  );
}
