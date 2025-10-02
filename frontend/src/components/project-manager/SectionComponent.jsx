import React, { useState } from "react";
import Dashboard from "../../pages/project-manager/Dashboard.jsx";
import TaskManagement from "../../pages/project-manager/TaskManagement.jsx";
import "./SectionComponent.css";
import Navbar from "../Navbar.jsx";
import { FaTachometerAlt, FaProjectDiagram, FaTasks } from 'react-icons/fa';
import MyProjectsPage from "../../pages/project-manager/MyProject.jsx";

const SectionComponent = () => {
  const [activePage, setActivePage] = useState("dashboard");

  const sidebarItems = [
    { 
      icon: <FaTachometerAlt />, 
      label: 'Dashboard', 
      key: 'dashboard' 
    },
    { 
      icon: <FaProjectDiagram />, 
      label: 'My Projects', 
      key: 'projects' 
    },
    { 
      icon: <FaTasks />, 
      label: 'Task Management', 
      key: 'task' 
    }
  ];

  return (
    <div className="app-container">
      <Navbar />
      
      {/* Sidebar */}
      <div className="pm-sidebar">
        <div className="sidebar-content">
          {sidebarItems.map((item, i) => (
            <div
              key={i}
              className={`sidebar-item ${item.key === activePage ? 'active' : ''}`}
              onClick={() => setActivePage(item.key)}
            >
              <div className="sidebar-icon">{item.icon}</div>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="content-area">
        {activePage === "dashboard" && <Dashboard />}
        {activePage === "projects" && <MyProjectsPage />}
        {activePage === "task" && <TaskManagement />}
      </div>
    </div>
  );
};

export default SectionComponent;