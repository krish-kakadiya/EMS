import React from 'react';
import { FaUser, FaCalendarAlt, FaTasks, FaProjectDiagram } from 'react-icons/fa';
import './Sidebar_Employee.css';

const Sidebar = ({ activeSection, setActiveSection }) => {
  const menuItems = [
    { id: 'profile', label: 'My Profile', icon: FaUser },
    { id: 'projects', label: 'My Projects', icon: FaProjectDiagram },
    { id: 'tasks', label: 'My Tasks', icon: FaTasks },
    { id: 'leaves', label: 'My Leaves', icon: FaCalendarAlt }
  ];

  return (
    <div className="emp-sidebar">
      <div className="emp-sidebar-content">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`emp-sidebar-item ${activeSection === item.id ? 'active' : ''}`}
            onClick={() => setActiveSection(item.id)}
          >
            <item.icon className="emp-sidebar-icon" />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;