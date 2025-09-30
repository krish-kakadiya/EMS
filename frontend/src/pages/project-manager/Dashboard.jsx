import React, { useState, useEffect } from 'react';
import { formatDDMMYY } from '../../utils/dateFormat.js';
import "./Dashboard.css";
import { 
  fetchProjects, 
  createProject as apiCreateProject, 
  fetchSimpleEmployees,
  fetchTasks,
  updateProjectTeam
} from '../../axios/projectTaskApi';

const Dashboard = () => {
  const [projects, setProjects] = useState([]); // loaded from backend
  const [employees, setEmployees] = useState([]); // loaded from backend (simplified list)
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]); // all tasks for progress & active counts
  const [error, setError] = useState(null);

  const [showAddProject, setShowAddProject] = useState(false);
  const [showTeamView, setShowTeamView] = useState(false);
  const [showEditTeam, setShowEditTeam] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editTeamProject, setEditTeamProject] = useState(null);
  const [editTeamSelected, setEditTeamSelected] = useState([]); // employeeIds
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');

  const [newProject, setNewProject] = useState({
    name: '',
    client: '',
    startDate: '',
    endDate: '',
    description: '',
    technologies: '', // front-end only (not persisted yet)
    githubLink: '', // front-end only
    projectType: 'Web Application' // front-end only
  });

  const projectTypes = [
    'Web Application',
    'Website', 
    'Mobile App',
    'Desktop App',
    'API/Backend',
    'E-commerce',
    'CMS',
    'Dashboard',
    'Landing Page',
    'Other'
  ];

  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return '';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days`;
  };

  const calculateProgress = (completedTasks, totalTasks) => {
    if (totalTasks === 0) return 0;
    return Math.round((completedTasks / totalTasks) * 100);
  };


  // Load data from backend
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [projRes, empRes, taskRes] = await Promise.all([
          fetchProjects(),
          fetchSimpleEmployees(),
          fetchTasks() // get all tasks at once
        ]);
        setProjects(projRes.data.projects || []);
        setEmployees(empRes.data.employees || []);
        setTasks(taskRes.data.tasks || []);
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load dashboard data');
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProject(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'startDate' || name === 'endDate' ? {
        duration: calculateDuration(
          name === 'startDate' ? value : prev.startDate,
          name === 'endDate' ? value : prev.endDate
        )
      } : {})
    }));
  };

  const handleEmployeeSelection = (employeeId) => {
    setSelectedEmployees(prev => {
      if (prev.includes(employeeId)) {
        return prev.filter(id => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      // Map selected employeeIds (employee.employeeId) to backend _ids
      const teamMemberObjectIds = selectedEmployees.map(eid => {
        const found = employees.find(emp => emp.employeeId === eid || emp._id === eid);
        return found?._id;
      }).filter(Boolean);
      await apiCreateProject({
        name: newProject.name,
        client: newProject.client,
        description: newProject.description,
        startDate: newProject.startDate || undefined,
        endDate: newProject.endDate || undefined,
        teamMembers: teamMemberObjectIds
      });
      const projRes = await fetchProjects();
      setProjects(projRes.data.projects || []);
      setNewProject({
        name: '',
        client: '',
        startDate: '',
        endDate: '',
        description: '',
        technologies: '',
        githubLink: '',
        projectType: 'Web Application'
      });
      setSelectedEmployees([]);
      setShowAddProject(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally { setLoading(false); }
  };

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

  const getProjectTaskSummary = (project) => {
    const pid = project._id || project.id;
    const projectTasks = tasks.filter(t => {
      if (!t.project) return false;
      const tp = t.project._id || t.project.id || t.project; // populated or id
      return tp === pid;
    });
    const total = projectTasks.length;
    const completed = projectTasks.filter(t => t.status === 'completed').length;
    const inProgress = projectTasks.filter(t => t.status === 'in-progress').length;
    const notStarted = projectTasks.filter(t => t.status === 'not-started').length;
    const onHold = projectTasks.filter(t => t.status === 'on-hold').length;
    return { total, completed, inProgress, notStarted, onHold, progress: calculateProgress(completed, total) };
  };

  const getFilteredProjects = () => {
    if (activeFilter === 'All') return projects;
    if (activeFilter === 'Active') return projects.filter(p => normalizeStatus(p.status) === 'In Progress');
    if (activeFilter === 'Pending') return projects.filter(p => normalizeStatus(p.status) === 'Pending');
    if (activeFilter === 'Completed') return projects.filter(p => normalizeStatus(p.status) === 'Completed');
    return projects;
  };

  const getEmployeeById = (employeeId) => {
    return employees.find(emp => emp.employeeId === employeeId || emp._id === employeeId);
  };

  const getDisplayDepartment = (employee) => {
    if (!employee) return 'Department not set';
    const dept = employee.department?.trim();
    if (dept && dept.toLowerCase() !== 'employee') return dept;
    const designation = employee.designation?.trim();
    if (designation) return designation;
    const role = employee.role?.trim();
    if (role && role.toLowerCase() !== 'employee') return role;
    return 'Department not set';
  };

  const handleTeamView = (project) => {
    setSelectedProject(project);
    setShowTeamView(true);
  };

  const getActiveTaskCount = (employee, project) => {
    if (!employee || !project) return 0;
    const pid = project._id || project.id;
    return tasks.filter(t => {
      if (!t.project || t.status !== 'in-progress') return false;
      const tp = t.project._id || t.project.id || t.project;
      if (tp !== pid) return false;
      // assignedTo may be array of user objects or ids
      return (t.assignedTo || []).some(a => {
        if (typeof a === 'string') return a === employee._id;
        return (a._id === employee._id);
      });
    }).length;
  };

  const openEditTeam = (project) => {
    setEditTeamProject(project);
    // Normalize existing teamMembers to employeeId list
    const existing = (project.teamMembers || []).map(m => {
      if (typeof m === 'string') {
        const emp = employees.find(e => e._id === m || e.employeeId === m);
        return emp?.employeeId || emp?._id || m;
      }
      return m.employeeId || m._id;
    }).filter(Boolean);
    setEditTeamSelected(existing);
    setShowEditTeam(true);
  };

  const toggleEditTeamMember = (employeeId) => {
    setEditTeamSelected(prev => prev.includes(employeeId)
      ? prev.filter(id => id !== employeeId)
      : [...prev, employeeId]);
  };

  const saveEditTeam = async () => {
    if (!editTeamProject) return;
    try {
      setLoading(true);
      // Map selected employeeIds to backend _ids
      const memberObjectIds = editTeamSelected.map(eid => {
        const found = employees.find(emp => emp.employeeId === eid || emp._id === eid);
        return found?._id;
      }).filter(Boolean);
      await updateProjectTeam(editTeamProject._id, memberObjectIds);
      const projRes = await fetchProjects();
      setProjects(projRes.data.projects || []);
      // Update selectedProject / editTeamProject references
      const refreshed = projRes.data.projects.find(p => p._id === editTeamProject._id);
      if (refreshed) {
        setEditTeamProject(refreshed);
        if (selectedProject && selectedProject._id === refreshed._id) setSelectedProject(refreshed);
      }
      setShowEditTeam(false);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update team');
    } finally { setLoading(false); }
  };

  const stats = getProjectStats();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h2 className="header-title">Project Dashboard</h2>
          <p className="header-subtitle">Manage and track your projects efficiently</p>
        </div>
        <button 
          className="add-project-btn"
          onClick={() => setShowAddProject(true)}
          disabled={loading}
        >
          <span className="btn-text">{loading ? 'Loading...' : 'Add New Project'}</span>
          <div className="btn-shine"></div>
        </button>
      </div>
      {error && <div className="error-banner">{error}</div>}

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
          <h3 className="projects-title">All Projects ({getFilteredProjects().length})</h3>
          <div className="filter-tabs">
            {['All', 'Active', 'Pending', 'Completed'].map(filter => (
              <button 
                key={filter}
                className={`filter-tab ${activeFilter === filter ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
        
        <div className="projects-grid">
          {getFilteredProjects().map((project) => {
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
              
              <div className="project-actions">
                <button className="action-btn secondary" onClick={() => handleTeamView(project)}>
                  <span>👥</span> Team
                </button>
                <button className="action-btn secondary" onClick={() => openEditTeam(project)}>
                  ✏️ Edit Team
                </button>
                {project.githubLink && (
                  <a 
                    href={project.githubLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="action-btn primary"
                  >
                    <span>🔗</span> Repository
                  </a>
                )}
              </div>
            </div>
          );})}
        </div>
      </div>

      {showAddProject && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Create New Project</h3>
              <button 
                className="close-btn"
                onClick={() => setShowAddProject(false)}
              >
                ×
              </button>
            </div>
            
            <div className="project-form">
              <div className="form-section">
                <h4>Project Information</h4>
                
                <div className="form-group">
                  <label>Project Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={newProject.name}
                    onChange={handleInputChange}
                    placeholder="Enter project name"
                    required
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Client Name *</label>
                    <input
                      type="text"
                      name="client"
                      value={newProject.client}
                      onChange={handleInputChange}
                      placeholder="Enter client name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Project Type *</label>
                    <select
                      name="projectType"
                      value={newProject.projectType}
                      onChange={handleInputChange}
                      required
                    >
                      {projectTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="form-section">
                <h4>Timeline</h4>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Start Date *</label>
                    <input
                      type="date"
                      name="startDate"
                      value={newProject.startDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>End Date *</label>
                    <input
                      type="date"
                      name="endDate"
                      value={newProject.endDate}
                      min={newProject.startDate || undefined}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Duration (Auto Generated)</label>
                  <input
                    type="text"
                    value={newProject.duration || 'Select dates to calculate'}
                    disabled
                    className="duration-display"
                  />
                </div>
              </div>
              
              <div className="form-section">
                <h4>Project Details</h4>
                
                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    name="description"
                    value={newProject.description}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Describe the project objectives and scope"
                    required
                  ></textarea>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Technologies/Tools</label>
                    <input
                      type="text"
                      name="technologies"
                      value={newProject.technologies}
                      onChange={handleInputChange}
                      placeholder="e.g., React, Node.js, MongoDB"
                    />
                  </div>
                  <div className="form-group">
                    <label>GitHub Repository</label>
                    <input
                      type="url"
                      name="githubLink"
                      value={newProject.githubLink}
                      onChange={handleInputChange}
                      placeholder="https://github.com/..."
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>Team Members</h4>
                <p className="section-description">Select team members for this project</p>
                
                <div className="employees-grid">
                    {employees.map((employee) => (
                      <div
                        key={employee._id}
                        className={`employee-card ${selectedEmployees.includes(employee.employeeId) ? 'selected' : ''}`}
                        onClick={() => handleEmployeeSelection(employee.employeeId)}
                      >
                        <div className="employee-avatar">
                          <img src={employee.photo || 'https://via.placeholder.com/80'} alt={employee.name} />
                          <div className="avatar-status"></div>
                        </div>
                        <div className="employee-info">
                          <h5 className="employee-name">{employee.name}</h5>
                          <span className="employee-department">{getDisplayDepartment(employee)}</span>
                          <span className="employee-email">{employee.email}</span>
                        </div>
                        {selectedEmployees.includes(employee.employeeId) && (
                          <div className="selection-check"><span>✓</span></div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => setShowAddProject(false)}
                >
                  Cancel
                </button>
                <button type="button" className="btn-submit" onClick={handleAddProject} disabled={loading}>
                  {loading ? 'Saving...' : 'Create Project'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTeamView && selectedProject && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Team Members - {selectedProject.name}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowTeamView(false)}
              >
                ×
              </button>
            </div>
            
            <div className="team-container">
              {(selectedProject.teamMembers || []).map((member) => {
                // member may be populated object or id; handle both
                const employee = typeof member === 'string' || typeof member === 'number'
                  ? getEmployeeById(member)
                  : member;
                if (!employee) return null;
                return (
                  <div key={employee._id || employee.employeeId} className="team-member-card">
                    <div className="team-member-avatar">
                      <img src={employee.photo || 'https://via.placeholder.com/60'} alt={employee.name} />
                    </div>
                    <div className="member-info">
                      <h4>{employee.name}</h4>
                      <p className="member-department">{getDisplayDepartment(employee)}</p>
                      <p className="member-email">{employee.email}</p>
                    </div>
                    <div className="member-stats">
                      <span>Active Tasks: {getActiveTaskCount(employee, selectedProject)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showEditTeam && editTeamProject && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Team - {editTeamProject.name}</h3>
              <button className="close-btn" onClick={() => setShowEditTeam(false)}>×</button>
            </div>
            <div className="project-form">
              <div className="form-section">
                <h4>Select / Deselect Members</h4>
                <p className="section-description">Click to toggle membership. Save to apply changes.</p>
                <div className="employees-grid">
                  {employees.map(emp => {
                    const selected = editTeamSelected.includes(emp.employeeId);
                    return (
                      <div key={emp._id}
                        className={`employee-card ${selected ? 'selected' : ''}`}
                        onClick={() => toggleEditTeamMember(emp.employeeId)}>
                        <div className="employee-avatar">
                          <img src={emp.photo || 'https://via.placeholder.com/80'} alt={emp.name} />
                          <div className="avatar-status"></div>
                        </div>
                        <div className="employee-info">
                          <h5 className="employee-name">{emp.name}</h5>
                          <span className="employee-department">{getDisplayDepartment(emp)}</span>
                          <span className="employee-email">{emp.email}</span>
                        </div>
                        {selected && <div className="selection-check"><span>✓</span></div>}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowEditTeam(false)}>Cancel</button>
                <button type="button" className="btn-submit" disabled={loading} onClick={saveEditTeam}>
                  {loading ? 'Saving...' : 'Save Team'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;