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

export async function getAdminActivity() {
  return getJSON("/api/admin/activity");
}
