import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';
import {
  FaTachometerAlt,
  FaUser,
  FaCalendarCheck,
  FaCalendarAlt,
  FaBuilding,
  FaDollarSign,
} from 'react-icons/fa';

const Sidebar = ({ activePage = 'dashboard' }) => {
  const navigate = useNavigate();
  
  const items = [
    { icon: <FaTachometerAlt />, label: 'Dashboard', key: 'dashboard', path: '/' },
    { icon: <FaUser />, label: 'Employees', key: 'employees', path: '/employees' },
    // { icon: <FaCalendarCheck />, label: 'Attendance', key: 'attendance', path: '/attendance' },
    { icon: <FaCalendarAlt />, label: 'Leave Status', key: 'leave', path: '/leave' },
    // { icon: <FaBuilding />, label: 'Departments', key: 'departments', path: '/departments' },
    { icon: <FaDollarSign />, label: 'Salary', key: 'salary', path: '/salary' },
  ];

  return (
    <div className="sidebar">
      {items.map((item, i) => (
        <div
          key={i}
          className={`sidebar-item ${item.key === activePage ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <div className="sidebar-icon">{item.icon}</div>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default Sidebar;