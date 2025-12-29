import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const location = useLocation();

  let user = null;

  try {
    const storedUser = localStorage.getItem("smquiz_user");
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("Invalid user data in localStorage");
    user = null;
  }
console.log("ProtectedRoute user:", user);

  /* ❌ Not logged in */
  if (!user || !user.email) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  /* ❌ Admin should NOT access student/exam routes */
  if (user.role === "admin") {
    return <Navigate to="/" replace />;
  }

  /* ✅ Student allowed */
  return children;
}
