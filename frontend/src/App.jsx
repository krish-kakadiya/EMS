import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import EmployeePage from "./pages/EmployeeData";
import AddNewUserPage from "./pages/AddNewUserPage";
import LeavePage from "./pages/LeavePage";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Toaster } from "react-hot-toast";
import EmployeeProfile from "./pages/employee/EmployeeProfile";
import SalaryManagement from "./pages/SalaryManagement";
import SectionComponent from "./components/project-manager/SectionComponent.jsx";


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

        {/* Admin Dashboard */}
        <Route
          path="/"
          element={
            <ProtectedRoute adminOnly={true}>
              <Layout activePage="dashboard">
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Employees Page (Admin Only) */}
        <Route
          path="/employees"
          element={
            <ProtectedRoute adminOnly={true}>
              <Layout activePage="employees">
                <EmployeePage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Add New User Page (Admin Only) */}
        <Route
          path="/add-new-user"
          element={
            <ProtectedRoute adminOnly={true}>
              <Layout activePage="employees">
                <AddNewUserPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/salary"
          element={
            <ProtectedRoute adminOnly={true}>
              <Layout activePage="salary">
                <SalaryManagement />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Leave Page (Admin Only) */}
        <Route
          path="/leave"
          element={
            <ProtectedRoute adminOnly={true}>
              <Layout activePage="leave">
                <LeavePage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Employee Profile Page */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <EmployeeProfile />
            </ProtectedRoute>
          }
        />

        {/* hr Dashboard */}
        <Route
          path="/section-component"
          element={
            <ProtectedRoute hrOnly={true}>
              <SectionComponent />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <EmployeeProfile />
            </ProtectedRoute>
          }
        />
      </Routes>

      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
    </>
  );
}

export default App;
