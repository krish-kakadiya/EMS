import React, { useState } from 'react';
import './AddNewUserPage.css';

const AddNewUserPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    empId: '',
    email: '',
    password: '',
    salary: '',
    department: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Handle form submission logic here
  };

  return (
    <div className="add-new-user-page">
      {/* Main Form Container */}
      <div className="form-container">
        <h2 className="form-title">Add New User</h2>
        
        <form className="add-user-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="form-label">NAME:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-row">
            <label className="form-label">EMP ID:</label>
            <input
              type="text"
              name="empId"
              value={formData.empId}
              onChange={handleInputChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-row">
            <label className="form-label">EMAIL:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-row">
            <label className="form-label">PASSWORD:</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-row">
            <label className="form-label">SALARY:</label>
            <input
              type="text"
              name="salary"
              value={formData.salary}
              onChange={handleInputChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-row">
            <label className="form-label">DEPARTMENT:</label>
            <select
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
            </select>
          </div>

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