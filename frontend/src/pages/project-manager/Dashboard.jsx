import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { formatDDMMYY } from '../../utils/dateFormat.js';
import "./Dashboard.css";
import { 
  fetchProjects, 
  fetchTasks 
} from '../../axios/projectTaskApi';

const DashboardPage = () => {
  const { user: currentUser } = useSelector((state) => state.auth);
  
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [projRes, taskRes] = await Promise.all([
          fetchProjects(),
          fetchTasks()
        ]);
        setProjects(projRes.data.projects || []);
        setTasks(taskRes.data.tasks || []);
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load dashboard data');
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const normalizeStatus = (s='') => {
    const map = { 'pending':'Pending', 'in-progress':'In Progress', 'completed':'Completed', 'on-hold':'On Hold' };
    return map[s] || s;
  };

  const getProjectStats = () => {
    const pending = projects.filter(p => (p.status||'').toLowerCase()==='pending').length;
    const working = projects.filter(p => (p.status||'').toLowerCase()==='in-progress').length;
    const completed = projects.filter(p => (p.status||'').toLowerCase()==='completed').length;
    const total = projects.length;
    return { pending, working, completed, total };
  };

  const getActiveProjects = () => {
    return projects.filter(p => normalizeStatus(p.status) === 'In Progress');
  };

  const getProjectTaskSummary = (project) => {
    const pid = project._id || project.id;
    const projectTasks = tasks.filter(t => {
      if (!t.project) return false;
      const tp = t.project._id || t.project.id || t.project;
      return tp === pid;
    });
    const total = projectTasks.length;
    const completed = projectTasks.filter(t => t.status === 'completed').length;
    const inProgress = projectTasks.filter(t => t.status === 'in-progress').length;
    const notStarted = projectTasks.filter(t => t.status === 'not-started').length;
    return { total, completed, inProgress, notStarted, progress: calculateProgress(completed, total) };
  };

  const calculateProgress = (completedTasks, totalTasks) => {
    if (totalTasks === 0) return 0;
    return Math.round((completedTasks / totalTasks) * 100);
  };

  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return '';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days`;
  };

  const stats = getProjectStats();
  const activeProjects = getActiveProjects();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h2 className="header-title">Project Dashboard</h2>
          <p className="header-subtitle">Manage and track your projects efficiently</p>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button 
            className="error-close-btn" 
            onClick={() => setError(null)}
            title="Close error message"
          >
            ×
          </button>
        </div>
      )}

      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon pending">
            <span>📋</span>
          </div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.pending}</h3>
            <p className="stat-label">Pending Projects</p>
          </div>
          <div className="stat-decoration"></div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon progress">
            <span>⚡</span>
          </div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.working}</h3>
            <p className="stat-label">Active Projects</p>
          </div>
          <div className="stat-decoration"></div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon completed">
            <span>✓</span>
          </div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.completed}</h3>
            <p className="stat-label">Completed Projects</p>
          </div>
          <div className="stat-decoration"></div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon total">
            <span>📊</span>
          </div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.total}</h3>
            <p className="stat-label">Total Projects</p>
          </div>
          <div className="stat-decoration"></div>
        </div>
      </div>

      <div className="projects-container">
        <div className="projects-header">
          <h3 className="projects-title">Active Projects ({activeProjects.length})</h3>
        </div>
        
        <div className="projects-grid">
          {activeProjects.map((project) => {
            const projectIdDisplay = project.code || project._id || '—';
            const teamMembersArr = project.teamMembers || [];
            const summary = getProjectTaskSummary(project);
            return (
            <div key={project._id || project.code} className="project-card">
              <div className="project-card-header">
                <div className="project-title">
                  <div>
                    <h4>{project.name}</h4>
                    {project.projectType && <span className="project-type">{project.projectType}</span>}
                  </div>
                </div>
                <span className={`status-badge ${(normalizeStatus(project.status)).toLowerCase().replace(' ', '-')}`}>
                  {normalizeStatus(project.status)}
                </span>
              </div>
              
              <div className="project-meta">
                <div className="meta-item">
                  <span className="meta-label">Project ID</span>
                  <span className="meta-value">{projectIdDisplay}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Client</span>
                  <span className="meta-value">{project.client}</span>
                </div>
              </div>
              
              <div className="project-progress">
                <div className="progress-header">
                  <span>Progress</span>
                  <span className="progress-percentage">{summary.progress}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${summary.progress}%` }}
                  ></div>
                </div>
                {summary.total > 0 && (
                  <div className="progress-breakdown">
                    <span className="pb-item">Pending: {summary.notStarted}</span>
                    <span className="pb-item">Active: {summary.inProgress}</span>
                    <span className="pb-item">Done: {summary.completed}</span>
                  </div>
                )}
              </div>
              
              <div className="project-details">
                <p className="project-description">{project.description}</p>
                
                <div className="project-info-grid">
                  <div className="info-item">
                    <span className="info-label">Duration</span>
                    <span className="info-value">{calculateDuration(project.startDate, project.endDate) || '—'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Team Size</span>
                    <span className="info-value">{teamMembersArr.length} members</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Start Date</span>
                    <span className="info-value">{formatDDMMYY(project.startDate)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">End Date</span>
                    <span className="info-value">{formatDDMMYY(project.endDate)}</span>
                  </div>
                </div>
                
                {project.technologies && Array.isArray(project.technologies) && project.technologies.length > 0 && (
                  <div className="tech-stack">
                    <span className="tech-label">Technologies:</span>
                    <div className="tech-tags">
                      {project.technologies.map((tech, index) => (
                        <span key={index} className="tech-tag">{tech}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );})}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;