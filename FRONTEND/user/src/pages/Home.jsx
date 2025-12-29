import React, { useEffect, useRef, useState } from "react";
import SubjectCard from "../components/SubjectCard";
import Header from "../components/Header";
import toast from "react-hot-toast";
import "../styles/Home.css";
import { FiArrowUp } from "react-icons/fi";

const LIMIT = 8;

export default function Home() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showTop, setShowTop] = useState(false);

  const pageRef = useRef(1);          // current page
  const fetchingRef = useRef(false);  // hard lock
  const observerRef = useRef(null);

  // ================= FETCH SUBJECTS =================
  const fetchSubjects = async () => {
    if (fetchingRef.current || !hasMore) return;

    fetchingRef.current = true;
    setLoading(true);

    try {
      const res = await fetch(
        `http://127.0.0.1:8081/api/admin/subjects?page=${pageRef.current}&limit=${LIMIT}`
      );

      if (!res.ok) throw new Error("Fetch failed");

      const data = await res.json();

      setSubjects((prev) => [...prev, ...data.subjects]);

      if (pageRef.current >= data.totalPages) {
        setHasMore(false);
      } else {
        pageRef.current += 1; // increment AFTER success
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load subjects");
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  };

  // ================= INITIAL LOAD =================
  useEffect(() => {
    fetchSubjects();
  }, []);

  // ================= INFINITE OBSERVER =================
  useEffect(() => {
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          fetchSubjects();
        }
      },
      { threshold: 0.3 }
    );

    if (observerRef.current) observer.observe(observerRef.current);

    return () => observer.disconnect();
  }, [hasMore]);

  // ================= BACK TO TOP VISIBILITY =================
  useEffect(() => {
    const handleScroll = () => {
      setShowTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <Header />

      <div className="home-page">
        <div className="home-hero">
          <h1>Choose Your Subject</h1>
          <p>Practice, improve & crack your exams 🚀</p>
        </div>

        <div className="subjects-grid">
          {subjects.map((sub) => (
            <SubjectCard key={sub._id} subject={sub} />
          ))}
        </div>

        {loading && <div className="home-loading">Loading...</div>}

        {hasMore && <div ref={observerRef} style={{ height: "20px" }} />}

        {/* {!hasMore && subjects.length > 0 && (
          <div className="end-wrapper">
            <div className="end-card">
              <span className="end-icon">🎉</span>
              <h3>That’s all for now</h3>
              <p>You’ve explored all available subjects</p>
            </div>
          </div>
        )} */}
      </div>

      {showTop && (
        <button
          className="back-to-top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          title="Back to Top"
        >
          <FiArrowUp size={25} />
        </button>
      )}
    </>
  );
}
