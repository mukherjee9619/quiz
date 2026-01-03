import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Topbar from "../components/Topbar";
import Sidebar from "../components/Sidebar";
import "../styles/dashboard.css";
import { getAdminActivity } from "../services/activityApi";

export default function Dashboard() {
  const navigate = useNavigate();

  /* ================= STATE ================= */
  const [stats, setStats] = useState({
    subjects: 0,
    questions: 0,
    users: 0,
    results: 0,
  });

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const prevStats = useRef(stats);

  /* ================= AUTH CHECK ================= */
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const expiry = localStorage.getItem("admin_token_expiry");

    if (!token || !expiry || Date.now() > Number(expiry)) {
      localStorage.clear();
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  /* ================= GREETING ================= */
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good Morning ☀️";
    if (hour >= 12 && hour < 16) return "Good Afternoon 🌤️";
    if (hour >= 16 && hour < 21) return "Good Evening 🌙";
    return "Good Night 🌙";
  };

  /* ================= LOAD STATS ================= */
  const loadStats = async () => {
    try {
      const token = localStorage.getItem("admin_token");

      const res = await fetch("http://127.0.0.1:8081/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      setStats({
        subjects: data.subjects ?? 0,
        questions: data.questions ?? 0,
        users: data.users ?? 0,
        results: data.results ?? 0,
      });

      /* 🔁 Fallback activity from stat changes */
      const fallback = [];

      if (data.questions > prevStats.current.questions) {
        fallback.push({
          _id: "q",
          message: `${data.questions - prevStats.current.questions} questions added`,
          createdAt: new Date(),
        });
      }

      if (data.subjects > prevStats.current.subjects) {
        fallback.push({
          _id: "s",
          message: `${data.subjects - prevStats.current.subjects} subjects added`,
          createdAt: new Date(),
        });
      }

      if (fallback.length && activities.length === 0) {
        setActivities(fallback);
      }

      prevStats.current = data;
    } catch (err) {
      console.error("Stats error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= LOAD ACTIVITY ================= */
  const loadActivity = async () => {
    try {
      const data = await getAdminActivity();
      if (Array.isArray(data) && data.length > 0) {
        setActivities(data);
      }
    } catch (err) {
      console.error("Activity error:", err);
    }
  };

  /* ================= INIT + AUTO REFRESH ================= */
  useEffect(() => {
    loadStats();
    loadActivity();

    const interval = setInterval(loadActivity, 30000); // every 30s
    return () => clearInterval(interval);
  }, []);

  /* ================= UI ================= */
  return (
    <div className="layout">
      <Sidebar />

      <main className="main">
        <Topbar title="Dashboard" />

        <div className="content dashboard-content">
          <div className="welcome-box">
            <h2>{getGreeting()}, Admin 👋</h2>
            <p>Here is the summary of your quiz system.</p>
          </div>

          {/* Stats */}
          <div className="cards-grid">
            {["Subjects", "Questions", "Users", "Results"].map((t, i) => (
              <div key={t} className="widget card-admin pop">
                <div className="w-title">{t}</div>
                <div className="w-value">
                  {loading ? "..." : Object.values(stats)[i]}
                </div>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="card-admin mt-3 fade-in">
            <h4 className="activity-title">Recent Activity</h4>

            <div className="timeline">
              {activities.length === 0 && (
                <p className="muted">No recent activity</p>
              )}

              {activities.map((item, i) => (
                <div className="timeline-item" key={i}>
                  <span className="dot"></span>
                  <p>{item.message}</p>
                  <small className="time">
                    {new Date(item.createdAt).toLocaleString()}
                  </small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
