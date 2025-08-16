import LoginPage from "./pages/LoginPage";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import EmployeePage from "./pages/EmployeePage";
import AddNewUserPage from "./pages/AddNewUserPage";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { useSelector } from "react-redux";
import { Toaster } from "react-hot-toast";

function App() {
  const { user } = useSelector((state) => state.auth);

  return (
    <>
    <Routes>
      {/* If user already logged in → redirect login → dashboard */}
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout activePage="dashboard">
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees"
        element={
          <ProtectedRoute>
            <Layout activePage="employees">
              <EmployeePage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-new-user"
        element={
          <ProtectedRoute>
            <Layout activePage="employees">
              <AddNewUserPage />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
    <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
    </>
    
  );
}

export default App;
