import React, { useEffect, useState } from "react";
import SubjectCard from "../components/SubjectCard";
import Header from "../components/Header";
import toast from "react-hot-toast";
import "../styles/Home.css";

export default function Home() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8081/api/admin/subjects")
      .then((res) => res.json())
      .then((data) => {
        setSubjects(data);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to fetch subjects");
        setLoading(false);
      });
  }, []);

  return (
    <>
      <Header />

      <div className="home-page">
        <div className="home-hero">
          <h1>Choose Your Subject</h1>
          <p>Practice, improve & crack your exams 🚀</p>
        </div>

        {loading ? (
          <div className="home-loading">Loading subjects...</div>
        ) : (
          <div className="subjects-grid">
            {subjects.map((sub) => (
              <SubjectCard key={sub._id} subject={sub} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
