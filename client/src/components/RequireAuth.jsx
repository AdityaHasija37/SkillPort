import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../lib/auth.jsx";
import { Loading } from "./ui.jsx";

export default function RequireAuth({ role, children }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <Loading />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (role && user.role !== role) return <Navigate to="/dashboard" replace />;
  return children;
}
