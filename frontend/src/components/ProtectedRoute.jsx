import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentUser } from "../redux/slices/authSlice";

const ProtectedRoute = ({ children, hrOnly = false, pmOnly = false }) => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!user) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, user]);

  if (loading) return <div>Loading...</div>;

  if (!user) return <Navigate to="/login" replace />;

  // HR-only → block if not HR
  if (hrOnly && user.role !== "hr") {
    return <Navigate to="/profile" replace />;
  }

  // PM-only → block if not PM
  if (pmOnly && user.role !== "pm") {
    if (user.role === "hr") return <Navigate to="/" replace />;
    return <Navigate to="/profile" replace />;
  }

  return children;
};

export default ProtectedRoute;
