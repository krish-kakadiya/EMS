import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { createEmployee } from "../redux/slices/employeeSlice"; // adjust path
import toast from "react-hot-toast";
import "./AddNewUserPage.css";

const AddNewUserPage = () => {
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    salary: "",
    department: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const resultAction = await dispatch(createEmployee(formData));

      if (createEmployee.fulfilled.match(resultAction)) {
        toast.success(
          `✅ Employee created! ID: ${resultAction.payload.employeeId}`
        );

        // Reset form after success
        setFormData({
          name: "",
          email: "",
          role: "",
          salary: "",
          department: "",
        });
      } else {
        toast.error(resultAction.payload || "❌ Failed to add employee");
      }
    } catch (err) {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="add-new-user-page">
      <div className="form-container">
        <h2 className="form-title">Add New User</h2>

        <form className="add-user-form" onSubmit={handleSubmit}>
          {/* Name */}
          <div className="form-row">
            <label htmlFor="name" className="form-label">
              NAME:
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="form-input"
              autoComplete="true"
              required
            />
          </div>

          {/* Email */}
          <div className="form-row">
            <label htmlFor="email" className="form-label">
              EMAIL:
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="form-input"
              autoComplete="true"
              required
            />
          </div>

          {/* Role */}
          <div className="form-row">
            <label htmlFor="role" className="form-label">
              ROLE:
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="form-input"
              required
            >
              <option value="">Select Role</option>
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
              <option value="hr">HR</option>
            </select>
          </div>

          {/* Department */}
          <div className="form-row">
            <label htmlFor="department" className="form-label">
              DEPARTMENT:
            </label>
            <select
              id="department"
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              className="form-input"
              required
            >
              <option value="">Select Department</option>
              <option value="FRONTEND DEVELOPER">FRONTEND DEVELOPER</option>
              <option value="BACKEND DEVELOPER">BACKEND DEVELOPER</option>
              <option value="FULL STACK DEVELOPER">FULL STACK DEVELOPER</option>
              <option value="UI/UX DESIGNER">UI/UX DESIGNER</option>
              <option value="QA TESTER">QA TESTER</option>
            </select>
          </div>

          {/* Salary */}
          <div className="form-row">
            <label htmlFor="salary" className="form-label">
              SALARY:
            </label>
            <input
              type="number"
              id="salary"
              name="salary"
              value={formData.salary}
              onChange={handleInputChange}
              className="form-input"
              required
            />
          </div>

          {/* Submit */}
          <div className="form-actions">
            <button type="submit" className="submit-btn">
              SUBMIT
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default AddNewUserPage;
