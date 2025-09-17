import React, { useState } from 'react';
import "./Dashboard.css"

const Dashboard = () => {
  const [projects, setProjects] = useState([
    {
      id: 'PRJ001',
      name: 'E-commerce Website',
      client: 'ABC Corp',
      startDate: '2024-01-15',
      endDate: '2024-04-15',
      duration: '90 days',
      status: 'In Progress',
      description: 'Complete e-commerce solution with payment gateway',
      technologies: ['React', 'Node.js', 'MongoDB'],
      githubLink: 'https://github.com/company/ecommerce-project',
      projectType: 'Web Application',
      teamMembers: ['EMP001', 'EMP002', 'EMP003'],
      tasks: {
        completed: 8,
        total: 12
      }
    },
    {
      id: 'PRJ002',
      name: 'Mobile Banking App',
      client: 'XYZ Bank',
      startDate: '2024-02-01',
      endDate: '2024-06-01',
      duration: '120 days',
      status: 'Completed',
      description: 'Secure mobile banking application',
      technologies: ['React Native', 'Firebase', 'AWS'],
      githubLink: 'https://github.com/company/mobile-banking',
      projectType: 'Mobile App',
      teamMembers: ['EMP004', 'EMP005', 'EMP006', 'EMP007'],
      tasks: {
        completed: 15,
        total: 15
      }
    },
    {
      id: 'PRJ003',
      name: 'CRM System',
      client: 'DEF Ltd',
      startDate: '2024-03-01',
      endDate: '2024-05-30',
      duration: '90 days',
      status: 'Pending',
      description: 'Customer relationship management system',
      technologies: ['Vue.js', 'Laravel', 'MySQL'],
      githubLink: 'https://github.com/company/crm-system',
      projectType: 'Web Application',
      teamMembers: ['EMP008', 'EMP009'],
      tasks: {
        completed: 0,
        total: 8
      }
    }
  ]);

  const [employees] = useState([
    { id: 'EMP001', name: 'John Doe', department: 'Frontend Development' },
    { id: 'EMP002', name: 'Jane Smith', department: 'UI/UX Design' },
    { id: 'EMP003', name: 'Mike Johnson', department: 'Backend Development' },
    { id: 'EMP004', name: 'Sarah Wilson', department: 'Full Stack Development' },
    { id: 'EMP005', name: 'David Brown', department: 'DevOps' },
    { id: 'EMP006', name: 'Emma Davis', department: 'QA Testing' },
    { id: 'EMP007', name: 'Alex Thompson', department: 'Project Management' },
    { id: 'EMP008', name: 'Lisa Garcia', department: 'Data Analysis' },
    { id: 'EMP009', name: 'Chris Lee', department: 'System Admin' }
  ]);

  const [showAddProject, setShowAddProject] = useState(false);
  const [showTeamView, setShowTeamView] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');

  const [newProject, setNewProject] = useState({
    name: '',
    client: '',
    startDate: '',
    endDate: '',
    description: '',
    technologies: '',
    githubLink: '',
    projectType: 'Web Application'
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

  const generateProjectId = () => {
    const nextId = projects.length + 1;
    return `PRJ${nextId.toString().padStart(3, '0')}`;
  };

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

  const handleAddProject = (e) => {
    e.preventDefault();
    const project = {
      ...newProject,
      id: generateProjectId(),
      duration: calculateDuration(newProject.startDate, newProject.endDate),
      status: 'Pending',
      technologies: newProject.technologies.split(', ').filter(tech => tech.trim()),
      teamMembers: selectedEmployees,
      tasks: {
        completed: 0,
        total: 0
      }
    };
    setProjects([...projects, project]);
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
  };

  const getProjectStats = () => {
    const pending = projects.filter(p => p.status === 'Pending').length;
    const working = projects.filter(p => p.status === 'In Progress').length;
    const completed = projects.filter(p => p.status === 'Completed').length;
    const total = projects.length;
    return { pending, working, completed, total };
  };

  const getFilteredProjects = () => {
    if (activeFilter === 'All') return projects;
    if (activeFilter === 'Active') return projects.filter(p => p.status === 'In Progress');
    if (activeFilter === 'Pending') return projects.filter(p => p.status === 'Pending');
    if (activeFilter === 'Completed') return projects.filter(p => p.status === 'Completed');
    return projects;
  };

  const getEmployeeById = (employeeId) => {
    return employees.find(emp => emp.id === employeeId);
  };

  const handleTeamView = (project) => {
    setSelectedProject(project);
    setShowTeamView(true);
  };

  const handleAnalytics = (project) => {
    setSelectedProject(project);
    setShowAnalytics(true);
  };

  const getAnalyticsData = () => {
    if (!selectedProject) return [];
    
    return selectedProject.teamMembers.map(empId => {
      const employee = getEmployeeById(empId);
      const tasksAssigned = Math.floor(Math.random() * 5) + 1;
      const tasksCompleted = Math.floor(Math.random() * tasksAssigned);
      const hoursWorked = Math.floor(Math.random() * 40) + 10;
      
      return {
        employee,
        tasksAssigned,
        tasksCompleted,
        hoursWorked,
        efficiency: Math.round((tasksCompleted / tasksAssigned) * 100)
      };
    });
  };

  const stats = getProjectStats();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h2>Project Dashboard</h2>
          <p className="header-subtitle">Manage and track your projects efficiently</p>
        </div>
        <button 
          className="add-project-btn"
          onClick={() => setShowAddProject(true)}
        >
          Add New Project
        </button>
      </div>

      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>{stats.pending}</h3>
            <p>Pending Projects</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <h3>{stats.working}</h3>
            <p>Active Projects</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✓</div>
          <div className="stat-content">
            <h3>{stats.completed}</h3>
            <p>Completed Projects</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total Projects</p>
          </div>
        </div>
      </div>

      <div className="projects-container">
        <div className="projects-header">
          <h3>All Projects ({getFilteredProjects().length})</h3>
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
          {getFilteredProjects().map((project) => (
            <div key={project.id} className="project-card">
              <div className="project-card-header">
                <div className="project-title">
                  <div>
                    <h4>{project.name}</h4>
                    <span className="project-type">{project.projectType}</span>
                  </div>
                </div>
                <span className={`status-badge ${project.status.toLowerCase().replace(' ', '-')}`}>
                  {project.status}
                </span>
              </div>
              
              <div className="project-meta">
                <div className="meta-item">
                  <span className="meta-label">Project ID</span>
                  <span className="meta-value">{project.id}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Client</span>
                  <span className="meta-value">{project.client}</span>
                </div>
              </div>
              
              <div className="project-progress">
                <div className="progress-header">
                  <span>Progress</span>
                  <span className="progress-percentage">
                    {calculateProgress(project.tasks.completed, project.tasks.total)}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${calculateProgress(project.tasks.completed, project.tasks.total)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="project-details">
                <p className="project-description">{project.description}</p>
                
                <div className="project-info-grid">
                  <div className="info-item">
                    <span className="info-label">Duration</span>
                    <span className="info-value">{project.duration}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Team Size</span>
                    <span className="info-value">{project.teamMembers.length} members</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Start Date</span>
                    <span className="info-value">{new Date(project.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">End Date</span>
                    <span className="info-value">{new Date(project.endDate).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="tech-stack">
                  <span className="tech-label">Technologies:</span>
                  <div className="tech-tags">
                    {project.technologies.map((tech, index) => (
                      <span key={index} className="tech-tag">{tech}</span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="project-actions">
                <button 
                  className="action-btn secondary"
                  onClick={() => handleTeamView(project)}
                >
                  Team
                </button>
                <button 
                  className="action-btn secondary"
                  onClick={() => handleAnalytics(project)}
                >
                  Analytics
                </button>
                <a 
                  href={project.githubLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="action-btn primary"
                >
                  Repository
                </a>
              </div>
            </div>
          ))}
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
                      key={employee.id} 
                      className={`employee-card-horizontal ${selectedEmployees.includes(employee.id) ? 'selected' : ''}`}
                      onClick={() => handleEmployeeSelection(employee.id)}
                    >
                      <div className="employee-avatar-small">
                        <img src={employee.photo} alt={employee.name} />
                      </div>
                      <div className="employee-info">
                        <h5>{employee.name}</h5>
                        <span className="employee-department">{employee.department}</span>
                      </div>
                      {selectedEmployees.includes(employee.id) && (
                        <div className="selection-check">✓</div>
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
                <button 
                  type="button" 
                  className="btn-submit"
                  onClick={handleAddProject}
                >
                  Create Project
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
              {selectedProject.teamMembers.map((empId) => {
                const employee = getEmployeeById(empId);
                return employee ? (
                  <div key={empId} className="team-member-card">
                    <div className="member-info">
                      <h4>{employee.name}</h4>
                      <p>{employee.department}</p>
                    </div>
                    <div className="member-stats">
                      <span>Active Tasks: {Math.floor(Math.random() * 3) + 1}</span>
                    </div>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        </div>
      )}

      {showAnalytics && selectedProject && (
        <div className="modal-overlay">
          <div className="modal large">
            <div className="modal-header">
              <h3>Analytics - {selectedProject.name}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowAnalytics(false)}
              >
                ×
              </button>
            </div>
            
            <div className="analytics-container">
              <h4>Employee Contribution</h4>
              <div className="analytics-grid">
                {getAnalyticsData().map((data, index) => (
                  <div key={index} className="analytics-card">
                    <div className="employee-header">
                      <h5>{data.employee.name}</h5>
                      <span className="department">{data.employee.department}</span>
                    </div>
                    <div className="contribution-stats">
                      <div className="stat">
                        <span className="stat-label">Tasks Assigned</span>
                        <span className="stat-value">{data.tasksAssigned}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Tasks Completed</span>
                        <span className="stat-value">{data.tasksCompleted}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Hours Worked</span>
                        <span className="stat-value">{data.hoursWorked}h</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Efficiency</span>
                        <span className="stat-value">{data.efficiency}%</span>
                      </div>
                    </div>
                    <div className="efficiency-bar">
                      <div 
                        className="efficiency-fill" 
                        style={{ width: `${data.efficiency}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;