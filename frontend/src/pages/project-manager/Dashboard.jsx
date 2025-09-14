import React, { useState } from 'react';
import './Dashboard.css';

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
      members: 5,
      description: 'Complete e-commerce solution with payment gateway',
      technologies: 'React, Node.js, MongoDB',
      resources: '5 Developers, 1 Designer, 1 Tester',
      githubLink: 'https://github.com/company/ecommerce-project'
    },
    {
      id: 'PRJ002',
      name: 'Mobile Banking App',
      client: 'XYZ Bank',
      startDate: '2024-02-01',
      endDate: '2024-06-01',
      duration: '120 days',
      status: 'Completed',
      members: 8,
      description: 'Secure mobile banking application',
      technologies: 'React Native, Firebase, AWS',
      resources: '6 Developers, 2 UI/UX Designers',
      githubLink: 'https://github.com/company/mobile-banking'
    },
    {
      id: 'PRJ003',
      name: 'CRM System',
      client: 'DEF Ltd',
      startDate: '2024-03-01',
      endDate: '2024-05-30',
      duration: '90 days',
      status: 'Pending',
      members: 4,
      description: 'Customer relationship management system',
      technologies: 'Vue.js, Laravel, MySQL',
      resources: '3 Developers, 1 Analyst',
      githubLink: 'https://github.com/company/crm-system'
    }
  ]);

  const [showAddProject, setShowAddProject] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    client: '',
    startDate: '',
    endDate: '',
    description: '',
    members: '',
    technologies: '',
    resources: '',
    githubLink: ''
  });

  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return '';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days`;
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

  const handleAddProject = (e) => {
    e.preventDefault();
    const project = {
      ...newProject,
      id: generateProjectId(),
      duration: calculateDuration(newProject.startDate, newProject.endDate),
      status: 'Pending',
      members: parseInt(newProject.members)
    };
    setProjects([...projects, project]);
    setNewProject({
      name: '',
      client: '',
      startDate: '',
      endDate: '',
      description: '',
      members: '',
      technologies: '',
      resources: '',
      githubLink: ''
    });
    setShowAddProject(false);
  };

  const getProjectStats = () => {
    const pending = projects.filter(p => p.status === 'Pending').length;
    const working = projects.filter(p => p.status === 'In Progress').length;
    const completed = projects.filter(p => p.status === 'Completed').length;
    const total = projects.length;
    return { pending, working, completed, total };
  };

  const stats = getProjectStats();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <button 
          className="add-project-btn"
          onClick={() => setShowAddProject(true)}
        >
          + Add New Project
        </button>
      </div>

      <div className="stats-container">
        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{stats.pending}</h3>
            <p>Pending Projects</p>
          </div>
        </div>
        <div className="stat-card working">
          <div className="stat-icon">🚀</div>
          <div className="stat-content">
            <h3>{stats.working}</h3>
            <p>Working Projects</p>
          </div>
        </div>
        <div className="stat-card completed">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.completed}</h3>
            <p>Completed Projects</p>
          </div>
        </div>
        <div className="stat-card total">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total Projects</p>
          </div>
        </div>
      </div>

      <div className="projects-container">
        <h3>All Projects</h3>
        <div className="projects-grid">
          {projects.map((project) => (
            <div key={project.id} className="project-card">
              <div className="project-header">
                <h4>{project.name}</h4>
                <span className={`status ${project.status.toLowerCase().replace(' ', '-')}`}>
                  {project.status}
                </span>
              </div>
              <div className="project-details">
                <p><strong>Project ID:</strong> {project.id}</p>
                <p><strong>Client:</strong> {project.client}</p>
                <p><strong>Duration:</strong> {project.duration}</p>
                <p><strong>Members:</strong> {project.members}</p>
                <p><strong>Start Date:</strong> {project.startDate}</p>
                <p><strong>End Date:</strong> {project.endDate}</p>
                <p><strong>Description:</strong> {project.description}</p>
                <p><strong>Technologies:</strong> {project.technologies}</p>
                <p><strong>Resources:</strong> {project.resources}</p>
                <p><strong>GitHub:</strong> 
                  <a href={project.githubLink} target="_blank" rel="noopener noreferrer">
                    View Repository
                  </a>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showAddProject && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add New Project</h3>
            <form onSubmit={handleAddProject}>
              <div className="form-group">
                <label>Project Name</label>
                <input
                  type="text"
                  name="name"
                  value={newProject.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Client Name</label>
                <input
                  type="text"
                  name="client"
                  value={newProject.client}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={newProject.startDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
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
                  value={newProject.duration || ''}
                  disabled
                />
              </div>
              <div className="form-group">
                <label>Number of Members</label>
                <input
                  type="number"
                  name="members"
                  value={newProject.members}
                  onChange={handleInputChange}
                  min="1"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={newProject.description}
                  onChange={handleInputChange}
                  rows="3"
                  required
                ></textarea>
              </div>
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
                <label>Required Resources</label>
                <input
                  type="text"
                  name="resources"
                  value={newProject.resources}
                  onChange={handleInputChange}
                  placeholder="e.g., 5 Developers, 1 Designer"
                />
              </div>
              <div className="form-group">
                <label>GitHub Link</label>
                <input
                  type="url"
                  name="githubLink"
                  value={newProject.githubLink}
                  onChange={handleInputChange}
                  placeholder="https://github.com/..."
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddProject(false)}>
                  Cancel
                </button>
                <button type="submit">Add Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;