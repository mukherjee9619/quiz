import { getJSON } from "./authApi";

/*
  GET /api/admin/activity
  Returns:
  [
    {
      _id,
      type: "SUBJECT" | "QUESTION" | "USER" | "RESULT",
      message: "New subject added — JavaScript",
      createdAt
    }
  ]
*/

// src/services/activityApi.js
export async function getAdminActivity() {
  const token = localStorage.getItem("admin_token");

  const res = await fetch("http://127.0.0.1:8081/admin/activities", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to load activity");
  return res.json();
}
