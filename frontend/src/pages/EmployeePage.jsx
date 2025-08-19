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

  // Fetch employees on page load
  useEffect(() => {
    dispatch(getAllEmployees());
  }, [dispatch]);

  // Clear success/error messages after few seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        dispatch(clearMessages());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success, dispatch]);

  const handleDelete = (id) => {
    dispatch(deleteEmployee(id));
  };

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    setShowDropdown(false);
  };

  const handleAddNewEmployee = () => {
    navigate("/add-new-user");
  };

  // Filtering logic
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
      <div className="employee-header">
        <h1 className="employee-title">MANAGE EMPLOYEES</h1>
      </div>

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

      {/* Show loading/error/success */}
      {loading && <p>Loading employees...</p>}
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}

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
            {filteredEmployees.map((employee, index) => (
              <tr
                key={employee._id}
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
            {filteredEmployees.length === 0 && !loading && (
              <tr>
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
