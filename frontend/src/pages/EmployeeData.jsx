// src/pages/EmployeePage.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaChevronDown, FaUser, FaTrash, FaPlus, FaSearch } from "react-icons/fa";
import {
  getAllEmployees,
  deleteEmployee,
  clearMessages,
} from "../redux/slices/employeeSlice";

import "./EmployeeData.css";

const EmployeePage = () => {
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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
    const confirmed = window.confirm("Are you sure you want to delete this employee?");
    if (confirmed) {
      dispatch(deleteEmployee(id));
    }
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

  // ✅ Filtering employees by department and search term
  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch = employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedFilter === "ALL") {
      return matchesSearch;
    } else {
      const matchesDepartment = (() => {
        if (selectedFilter === "FRONTEND") {
          return employee.department.includes("FRONTEND");
        } else if (selectedFilter === "BACKEND") {
          return employee.department.includes("BACKEND");
        } else if (selectedFilter === "FULL STACK") {
          return employee.department.includes("FULL STACK");
        } else if (selectedFilter === "UI/UX DESIGN") {
          return employee.department.includes("UI/UX DESIGN");
        } else if (selectedFilter === "Q/A TESTER") {
          return employee.department.includes("Q/A TESTER");
        }
        return false;
      })();
      return matchesSearch && matchesDepartment;
    }
  });

  return (
    <div className="employee-page">
      {/* ---------- Header ---------- */}
      <div className="employee-header">
        <div className="header-content">
          <h1 className="employee-title">Employee Management</h1>
          <p className="employee-subtitle">Manage your team members and their information</p>
        </div>
      </div>

      {/* ---------- Actions ---------- */}
      <div className="employee-actions">
        <div className="left-actions">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search employees by Id"
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-dropdown">
            <button
              className="filter-btn"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <span>Filter: {selectedFilter}</span>
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
                  All Departments
                </div>
                <div
                  className="dropdown-item"
                  onClick={() => handleFilterChange("FRONTEND")}
                >
                  Frontend Developer
                </div>
                <div
                  className="dropdown-item"
                  onClick={() => handleFilterChange("BACKEND")}
                >
                  Backend Developer
                </div>
                <div
                  className="dropdown-item"
                  onClick={() => handleFilterChange("FULL STACK")}
                >
                  Full Stack Developer
                </div>
                <div
                  className="dropdown-item"
                  onClick={() => handleFilterChange("UI/UX DESIGN")}
                >
                  UI/UX Designer
                </div>
                <div
                  className="dropdown-item"
                  onClick={() => handleFilterChange("Q/A TESTER")}
                >
                  QA Tester
                </div>
              </div>
            )}
          </div>
        </div>

        <button className="add-employee-btn" onClick={handleAddNewEmployee}>
          <FaPlus className="btn-icon" />
          Add New Employee
        </button>
      </div>

      {/* ---------- Status Messages ---------- */}
      {loading && (
        <div className="status-message loading-message">
          <div className="loading-spinner"></div>
          Loading employees...
        </div>
      )}
      {error && <div className="status-message error-message">{error}</div>}
      {success && <div className="status-message success-message">{success}</div>}

      {/* ---------- Stats Cards ---------- */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-number">{employees.length}</div>
          <div className="stat-label">Total Employees</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{filteredEmployees.length}</div>
          <div className="stat-label">Filtered Results</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {new Set(employees.map(emp => emp.department)).size}
          </div>
          <div className="stat-label">Departments</div>
        </div>
      </div>

      {/* ---------- Employee Table ---------- */}
      <div className="employee-header-table-container">
        <table className="employee-header-table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Profile</th>
              <th>Name</th>
              <th>Department</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {/* ✅ Map employees with unique key */}
            {filteredEmployees.map((employee, index) => (
              <tr
                key={employee._id || `${employee.employeeId}-${index}`}
                className="employee-row"
              >
                <td>
                  <span className="employee-id">{employee.employeeId}</span>
                </td>
                <td>
                  <button
                    className="profile-avatar"
                    type="button"
                    title="View Profile"
                    onClick={() => navigate(`/employees/${employee._id}`)}
                    style={{cursor:'pointer'}}
                  >
                    {employee.profilePicture ? (
                      <img
                        src={employee.profilePicture}
                        alt={employee.name}
                        style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}}
                        onError={(e)=>{e.currentTarget.src='https://avatar.iran.liara.run/public/46'}}
                      />
                    ) : (
                      <FaUser />
                    )}
                  </button>
                </td>
                <td>
                  <span className="employee-fullname">{employee.name}</span>
                </td>
                <td>
                  <span className="department-badge">
                    {employee.department}
                  </span>
                </td>
                <td>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(employee._id)}
                    title="Delete Employee"
                  >
                    <FaTrash />
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {/* ✅ No Employees Fallback */}
            {filteredEmployees.length === 0 && !loading && (
              <tr className="empty-row">
                <td colSpan="5">
                  <div className="empty-state">
                    <FaUser className="empty-icon" />
                    <p className="empty-message">
                      {searchTerm || selectedFilter !== "ALL" 
                        ? "No employees match your search criteria" 
                        : "No employees found"}
                    </p>
                    {!searchTerm && selectedFilter === "ALL" && (
                      <button className="empty-action-btn" onClick={handleAddNewEmployee}>
                        Add Your First Employee
                      </button>
                    )}
                  </div>
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