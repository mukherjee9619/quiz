import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const location = useLocation();

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("smquiz_user"));
  } catch (err) {
    user = null;
  }

  /* ❌ Not logged in */
  if (!user || !user.email) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  /* ❌ Admin should NOT access exam routes */
  if (user.role && user.role === "admin") {
    return <Navigate to="/" replace />;
  }

  /* ✅ Student allowed */
  return children;
}
