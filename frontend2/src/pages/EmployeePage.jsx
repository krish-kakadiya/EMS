import React, { useState } from 'react';
import './EmployeePage.css';
import { FaChevronDown, FaUser, FaTrash } from 'react-icons/fa';

const EmployeePage = () => {
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [showDropdown, setShowDropdown] = useState(false);

  const employees = [
    {
      id: 'EMP1',
      name: 'HARDIK HADIYA',
      dob: '21/08/2006',
      department: 'FRONTEND DEVELOPER',
      profile: '👤'
    },
    {
      id: 'EMP2',
      name: 'JAGDISH HADIYAL',
      dob: '07/01/2006',
      department: 'FULL STACK DEVELOPER',
      profile: '👤'
    },
    {
      id: 'EMP3',
      name: 'KRISH KAKADIYA',
      dob: '19/11/2005',
      department: 'BACKEND DEVELOPER',
      profile: '👤'
    }
  ];

  const handleDelete = (employeeId) => {
    // Handle delete functionality
    console.log('Delete employee:', employeeId);
  };

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    setShowDropdown(false);
  };

  const filteredEmployees = selectedFilter === 'ALL' 
    ? employees 
    : employees.filter(employee => {
        if (selectedFilter === 'FRONTEND') {
          return employee.department.includes('FRONTEND');
        } else if (selectedFilter === 'BACKEND') {
          return employee.department.includes('BACKEND');
        } else if (selectedFilter === 'FULL STACK') {
          return employee.department.includes('FULL STACK');
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
            <FaChevronDown className={`chevron-icon ${showDropdown ? 'rotated' : ''}`} />
          </button>
          {showDropdown && (
            <div className="dropdown-menu">
              <div className="dropdown-item" onClick={() => handleFilterChange('ALL')}>
                ALL
              </div>
              <div className="dropdown-item" onClick={() => handleFilterChange('FRONTEND')}>
                FRONTEND DEVELOPER
              </div>
              <div className="dropdown-item" onClick={() => handleFilterChange('BACKEND')}>
                BACKEND DEVELOPER
              </div>
              <div className="dropdown-item" onClick={() => handleFilterChange('FULL STACK')}>
                FULL STACK DEVELOPER
              </div>
            </div>
          )}
        </div>
        <button className="add-employee-btn">ADD NEW EMPLOYEE</button>
      </div>

      <div className="employee-table-container">
        <table className="employee-table">
          <thead>
            <tr>
              <th>EMP ID</th>
              <th>PROFILE</th>
              <th>NAME</th>
              <th>DOB</th>
              <th>DEPARTMENT</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((employee, index) => (
              <tr key={employee.id} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                <td>{employee.id}</td>
                <td>
                  <div className="profile-icon">
                    <FaUser />
                  </div>
                </td>
                <td>{employee.name}</td>
                <td>{employee.dob}</td>
                <td>{employee.department}</td>
                <td>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDelete(employee.id)}
                  >
                    <FaTrash /> DELETE
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeePage; 