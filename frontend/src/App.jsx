import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Toaster } from "react-hot-toast";

// Pages
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import EmployeePage from "./pages/EmployeeData";
import AddNewUserPage from "./pages/AddNewUserPage";
import LeavePage from "./pages/LeavePage";
import EmployeeProfile from "./pages/employee/EmployeeProfile";
import SalaryManagement from "./pages/SalaryManagement";
import SectionComponent from "./components/project-manager/SectionComponent.jsx";

// Components
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const { user } = useSelector((state) => state.auth);

  return (
    <>
      <Routes>
        {/* Login route */}
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <LoginPage />}
        />

        {/* Dynamic Home Route */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              {user?.role === "hr" && (
                <Layout activePage="dashboard">
                  <DashboardPage />
                </Layout>
              )}
              {user?.role === "pm" && <SectionComponent />}
              {user?.role === "employee" && <EmployeeProfile />}
            </ProtectedRoute>
          }
        />

        {/* HR-only Routes */}
        <Route
          path="/employees"
          element={
            <ProtectedRoute hrOnly={true}>
              <Layout activePage="employees">
                <EmployeePage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/add-new-user"
          element={
            <ProtectedRoute hrOnly={true}>
              <Layout activePage="employees">
                <AddNewUserPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/salary"
          element={
            <ProtectedRoute hrOnly={true}>
              <Layout activePage="salary">
                <SalaryManagement />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/leave"
          element={
            <ProtectedRoute hrOnly={true}>
              <Layout activePage="leave">
                <LeavePage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Employee Profile (All logged in users) */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <EmployeeProfile />
            </ProtectedRoute>
          }
        />

        {/* PM-only section */}
        <Route
          path="/section-component"
          element={
            <ProtectedRoute pmOnly={true}>
              <SectionComponent />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
    </>
  );
}

export default App;
