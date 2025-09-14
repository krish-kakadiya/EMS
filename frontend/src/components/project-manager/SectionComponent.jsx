import React, { useState } from "react";
import Dashboard from "../../pages/project-manager/Dashboard.jsx";
import TaskManagement from "../../pages/project-manager/TaskManagement.jsx";
import "./SectionComponent.css";
import Navbar from "../Navbar.jsx";

const SectionComponent = () => {
  const [activePage, setActivePage] = useState("dashboard");

  return (
    <div className="app-container">
        <Navbar />
      {/* Sidebar */}
      <div className="section-bar">
        <button
          className={`section-btn ${activePage === "dashboard" ? "active" : ""}`}
          onClick={() => setActivePage("dashboard")}
        >
          📊 Dashboard
        </button>
        <button
          className={`section-btn ${activePage === "task" ? "active" : ""}`}
          onClick={() => setActivePage("task")}
        >
          ✅ Task Management
        </button>
      </div>

      {/* Main Content */}
      <div className="content-area">
        {activePage === "dashboard" && <Dashboard />}
        {activePage === "task" && <TaskManagement />}
      </div>
    </div>
  );
};

export default SectionComponent;
