import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentUser } from "../redux/slices/authSlice";

const ProtectedRoute = ({ children, adminOnly = false, hrOnly = false }) => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!user) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, user]);

  if (loading) return <div>Loading...</div>;

  if (!user) return <Navigate to="/login" replace />;

  if (!hrOnly && user.role == "hr") {
    // Redirect non-admins to EmployeeProfile
    return <Navigate to="/section-component" replace />;
  }

  if (adminOnly && user.role !== "admin") {
    // Redirect non-admins to EmployeeProfile
    return <Navigate to="/profile" replace />;
  }

  return children;
};

export default ProtectedRoute;
