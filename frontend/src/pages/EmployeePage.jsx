// src/pages/EmployeePage.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaChevronDown, FaUser, FaTrash } from "react-icons/fa";
import {
  getAllEmployees,
  deleteEmployee,
  clearMessages,
} from "../redux/slices/employeeSlice";
import "./EmployeePage.css";

const EmployeePage = () => {
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [showDropdown, setShowDropdown] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { employees, loading, error, success } = useSelector(
    (state) => state.employees
  );

  // ✅ Fetch employees on mount
  useEffect(() => {
    dispatch(getAllEmployees());
  }, [dispatch]);

  // ✅ Auto clear error/success after 3 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        dispatch(clearMessages());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success, dispatch]);

  // ✅ Delete employee
  const handleDelete = (id) => {
    dispatch(deleteEmployee(id));
  };

  // ✅ Handle filter dropdown
  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    setShowDropdown(false);
  };

  // ✅ Navigate to add employee page
  const handleAddNewEmployee = () => {
    navigate("/add-new-user");
  };

  // ✅ Filtering employees by department
  const filteredEmployees =
    selectedFilter === "ALL"
      ? employees
      : employees.filter((employee) => {
          if (selectedFilter === "FRONTEND") {
            return employee.department.includes("FRONTEND");
          } else if (selectedFilter === "BACKEND") {
            return employee.department.includes("BACKEND");
          } else if (selectedFilter === "FULL STACK") {
            return employee.department.includes("FULL STACK");
          }
          return false;
        });

  return (
    <div className="employee-page">
      {/* ---------- Header ---------- */}
      <div className="employee-header">
        <h1 className="employee-title">MANAGE EMPLOYEES</h1>
      </div>

      {/* ---------- Actions ---------- */}
      <div className="employee-actions">
        <div className="filter-dropdown">
          <button
            className="filter-btn"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            {selectedFilter}
            <FaChevronDown
              className={`chevron-icon ${showDropdown ? "rotated" : ""}`}
            />
          </button>

          {showDropdown && (
            <div className="dropdown-menu">
              <div
                className="dropdown-item"
                onClick={() => handleFilterChange("ALL")}
              >
                ALL
              </div>
              <div
                className="dropdown-item"
                onClick={() => handleFilterChange("FRONTEND")}
              >
                FRONTEND DEVELOPER
              </div>
              <div
                className="dropdown-item"
                onClick={() => handleFilterChange("BACKEND")}
              >
                BACKEND DEVELOPER
              </div>
              <div
                className="dropdown-item"
                onClick={() => handleFilterChange("FULL STACK")}
              >
                FULL STACK DEVELOPER
              </div>
            </div>
          )}
        </div>

        <button className="add-employee-btn" onClick={handleAddNewEmployee}>
          ADD NEW EMPLOYEE
        </button>
      </div>

      {/* ---------- Status Messages ---------- */}
      {loading && <p>Loading employees...</p>}
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}

      {/* ---------- Employee Table ---------- */}
      <div className="employee-table-container">
        <table className="employee-table">
          <thead>
            <tr>
              <th>EMP ID</th>
              <th>PROFILE</th>
              <th>NAME</th>
              <th>DEPARTMENT</th>
              <th>ACTION</th>
            </tr>
          </thead>

          <tbody>
            {/* ✅ Map employees with unique key */}
            {filteredEmployees.map((employee, index) => (
              <tr
                key={employee._id || `${employee.employeeId}-${index}`}
                className={index % 2 === 0 ? "even-row" : "odd-row"}
              >
                <td>{employee.employeeId}</td>
                <td>
                  <div className="profile-icon">
                    <FaUser />
                  </div>
                </td>
                <td>{employee.name}</td>
                <td>{employee.department}</td>
                <td>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(employee._id)}
                  >
                    <FaTrash /> DELETE
                  </button>
                </td>
              </tr>
            ))}

            {/* ✅ No Employees Fallback */}
            {filteredEmployees.length === 0 && !loading && (
              <tr key="no-employees">
                <td colSpan="5" style={{ textAlign: "center" }}>
                  No employees found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeePage;
