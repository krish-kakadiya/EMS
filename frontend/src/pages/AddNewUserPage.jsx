import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { createEmployee } from "../redux/slices/employeeSlice";
import toast from "react-hot-toast";
import { 
  FaUser, 
  FaEnvelope, 
  FaUserTie, 
  FaDollarSign, 
  FaBuilding,
  FaArrowLeft,
  FaPlus,
  FaCheckCircle 
} from "react-icons/fa";
import "./AddNewUserPage.css";

const AddNewUserPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "employee",
    salary: "",
    department: "",
  });

  const [formErrors, setFormErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }
    
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }
    
    if (!formData.role) {
      errors.role = "Please select a role";
    }
    
    if (!formData.department) {
      errors.department = "Please select a department";
    }
    
    if (!formData.salary) {
      errors.salary = "Salary is required";
    } else if (formData.salary <= 0) {
      errors.salary = "Salary must be greater than 0";
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsLoading(true);

    try {
      const resultAction = await dispatch(createEmployee(formData));

      if (createEmployee.fulfilled.match(resultAction)) {
        toast.success(
          `✅ Employee created successfully! ID: ${resultAction.payload.employeeId}`,
          { duration: 4000 }
        );

        // Reset form after success
        setFormData({
          name: "",
          email: "",
          role: "employee",
          salary: "",
          department: "",
        });
        setFormErrors({});
        
        // Optional: Navigate back to employee list after a delay
        setTimeout(() => {
          navigate("/employees");
        }, 2000);
      } else {
        toast.error(resultAction.payload || "❌ Failed to add employee");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate("/employees");
  };

  return (
    <div className="add-new-user-page">
      {/* Header */}
      <div className="page-header">
        <button className="back-btn" onClick={handleGoBack}>
          <FaArrowLeft />
          Back to Employees
        </button>
        <div className="header-content">
          <h1 className="page-title">Add New Employee</h1>
          <p className="page-subtitle">Create a new employee profile in your organization</p>
        </div>
      </div>

      {/* Form Container */}
      <div className="form-container">
        <div className="form-header">
          <div className="form-icon">
            <FaPlus />
          </div>
          <h2 className="form-title">Employee Information</h2>
          <p className="form-description">Please fill in all the required fields below</p>
        </div>

        <form className="add-user-form" onSubmit={handleSubmit}>
          {/* Personal Information Section */}
          <div className="form-section">
            <h3 className="section-title">Personal Information</h3>
            
            {/* Name */}
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                <FaUser className="label-icon" />
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`form-input ${formErrors.name ? 'error' : ''}`}
                placeholder="Enter full name"
                autoComplete="name"
              />
              {formErrors.name && <span className="error-text">{formErrors.name}</span>}
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                <FaEnvelope className="label-icon" />
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`form-input ${formErrors.email ? 'error' : ''}`}
                placeholder="Enter email address"
                autoComplete="email"
              />
              {formErrors.email && <span className="error-text">{formErrors.email}</span>}
            </div>
          </div>

          {/* Professional Information Section */}
          <div className="form-section">
            <h3 className="section-title">Professional Information</h3>
            

            {/* Department */}
            <div className="form-group">
              <label htmlFor="department" className="form-label">
                <FaBuilding className="label-icon" />
                Department *
              </label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className={`form-input ${formErrors.department ? 'error' : ''}`}
              >
                <option value="">Select Department</option>
                <option value="FRONTEND DEVELOPER">Frontend Developer</option>
                <option value="BACKEND DEVELOPER">Backend Developer</option>
                <option value="FULL STACK DEVELOPER">Full Stack Developer</option>
                <option value="UI/UX DESIGNER">UI/UX Designer</option>
                <option value="QA TESTER">QA Tester</option>
              </select>
              {formErrors.department && <span className="error-text">{formErrors.department}</span>}
            </div>

            {/* Salary */}
            <div className="form-group">
              <label htmlFor="salary" className="form-label">
                <FaDollarSign className="label-icon" />
                Monthly Salary *
              </label>
              <div className="input-with-prefix">
                <span className="input-prefix">$</span>
                <input
                  type="number"
                  id="salary"
                  name="salary"
                  value={formData.salary}
                  onChange={handleInputChange}
                  className={`form-input with-prefix ${formErrors.salary ? 'error' : ''}`}
                  placeholder="Enter Monthly salary"
                  min="0"
                  step="1000"
                />
              </div>
              {formErrors.salary && <span className="error-text">{formErrors.salary}</span>}
            </div>
          </div>

          {/* Submit Actions */}
          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-btn" 
              onClick={handleGoBack}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner"></div>
                  Creating...
                </>
              ) : (
                <>
                  <FaCheckCircle />
                  Create Employee
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNewUserPage;