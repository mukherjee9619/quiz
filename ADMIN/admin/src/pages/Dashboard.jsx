import React, { useEffect, useState } from "react";
import Topbar from "../components/Topbar";
import Sidebar from "../components/Sidebar";
import "../styles/dashboard.css";

export default function Dashboard() {
  const [stats, setStats] = useState({
    subjects: 0,
    questions: 0,
    users: 0,
    results: 0,
  });

  const [loading, setLoading] = useState(true);

  // ⭐ Updated greeting logic
  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) return "Good Morning ☀️";
    if (hour >= 12 && hour < 16) return "Good Afternoon 🌤️";
    if (hour >= 16 && hour < 21) return "Good Evening 🌙";

    // Night time
    if ((hour >= 21 && hour <= 24) || (hour >= 0 && hour < 5))
      return "Good Night 🌙";

    return "Hello 👋";
  };

  // ⭐ Fetch LIVE stats from backend
  const loadStats = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8081/api/admin/stats");
      const data = await res.json();

      setStats({
        subjects: data.subjects ?? 0,
        questions: data.questions ?? 0,
        users: data.users ?? 0,
        results: data.results ?? 0,
      });
    } catch (err) {
      console.log("Stats error:", err);

      // fallback values
      setStats({
        subjects: 12,
        questions: 250,
        users: 87,
        results: 340,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="layout">
      <Sidebar />

      <main className="main">
        <Topbar title="Dashboard" />

        <div className="content dashboard-content">

          {/* Greeting Section */}
          <div className="welcome-box">
            <h2>{getGreeting()}, Admin! 👋</h2>
            <p>Here is the summary of your quiz system.</p>
          </div>

          {/* Widget Boxes */}
          <div className="cards-grid">
            <div className="widget card-admin pop">
              <div className="w-title">Subjects</div>
              <div className="w-value">{loading ? "..." : stats.subjects}</div>
            </div>

            <div className="widget card-admin pop">
              <div className="w-title">Questions</div>
              <div className="w-value">{loading ? "..." : stats.questions}</div>
            </div>

            <div className="widget card-admin pop">
              <div className="w-title">Users</div>
              <div className="w-value">{loading ? "..." : stats.users}</div>
            </div>

            <div className="widget card-admin pop">
              <div className="w-title">Results</div>
              <div className="w-value">{loading ? "..." : stats.results}</div>
            </div>
          </div>

          {/* Activity */}
          <div className="card-admin mt-3 fade-in">
            <h4 className="activity-title">Recent Activity</h4>

            <div className="timeline">
              <div className="timeline-item">
                <span className="dot"></span>
                <p>New subject added — <strong>JavaScript</strong></p>
              </div>
              <div className="timeline-item">
                <span className="dot"></span>
                <p>User <strong>Rohit Kumar</strong> completed a quiz</p>
              </div>
              <div className="timeline-item">
                <span className="dot"></span>
                <p>5 new questions added to <strong>HTML</strong></p>
              </div>
              <div className="timeline-item">
                <span className="dot"></span>
                <p>System generated daily report</p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
