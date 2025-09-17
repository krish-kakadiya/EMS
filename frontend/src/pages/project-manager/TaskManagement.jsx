import React, { useState } from 'react';
import "./TaskManagement.css";

const TaskManagement = () => {
  const [projects] = useState([
    {
      id: 'PRJ001',
      name: 'E-commerce Website',
      client: 'ABC Corp',
      status: 'In Progress',
      teamMembers: ['EMP001', 'EMP002', 'EMP003']
    },
    {
      id: 'PRJ002',
      name: 'Mobile Banking App',
      client: 'XYZ Bank',
      status: 'Completed',
      teamMembers: ['EMP004', 'EMP005', 'EMP006', 'EMP007']
    },
    {
      id: 'PRJ003',
      name: 'CRM System',
      client: 'DEF Ltd',
      status: 'Pending',
      teamMembers: ['EMP008', 'EMP009']
    }
  ]);

  const [tasks, setTasks] = useState([
    {
      id: 'TSK001',
      name: 'Design Homepage Layout',
      description: 'Create responsive homepage design with modern UI',
      assignedTo: ['EMP001', 'EMP002'],
      projectId: 'PRJ001',
      priority: 'High',
      status: 'In Progress',
      startDate: '2024-01-20',
      dueDate: '2024-01-30'
    },
    {
      id: 'TSK002',
      name: 'Payment Gateway Integration',
      description: 'Integrate Stripe payment gateway with security measures',
      assignedTo: ['EMP003'],
      projectId: 'PRJ001',
      priority: 'High',
      status: 'Not Started',
      startDate: '2024-02-01',
      dueDate: '2024-02-15'
    },
    {
      id: 'TSK003',
      name: 'User Authentication Setup',
      description: 'Implement secure user login and registration',
      assignedTo: ['EMP004'],
      projectId: 'PRJ002',
      priority: 'Medium',
      status: 'Completed',
      startDate: '2024-01-15',
      dueDate: '2024-01-25'
    },
    {
      id: 'TSK004',
      name: 'Database Schema Design',
      description: 'Design and implement database schema for CRM system',
      assignedTo: ['EMP008'],
      projectId: 'PRJ003',
      priority: 'High',
      status: 'Not Started',
      startDate: '2024-03-05',
      dueDate: '2024-03-15'
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

  const [selectedProject, setSelectedProject] = useState('');
  const [showViewTasks, setShowViewTasks] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');

  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    projectId: '',
    priority: 'Medium',
    startDate: '',
    dueDate: ''
  });

  const generateTaskId = () => {
    const nextId = tasks.length + 1;
    return `TSK${nextId.toString().padStart(3, '0')}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask(prev => ({
      ...prev,
      [name]: value
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

  const handleAddTask = (e) => {
    e.preventDefault();
    if (selectedEmployees.length === 0) {
      alert('Please select at least one employee');
      return;
    }

    const task = {
      ...newTask,
      id: generateTaskId(),
      assignedTo: selectedEmployees,
      status: 'Not Started'
    };
    
    setTasks([...tasks, task]);
    
    setNewTask({
      name: '',
      description: '',
      projectId: '',
      priority: 'Medium',
      startDate: '',
      dueDate: ''
    });
    setSelectedEmployees([]);
    setShowAddTask(false);
  };

  const handleViewTasks = (projectId) => {
    setSelectedProject(projectId);
    setShowViewTasks(true);
  };

  const updateTaskStatus = (taskId, newStatus) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
  };

  const getProjectTasks = (projectId) => {
    const projectTasks = tasks.filter(task => task.projectId === projectId);
    if (activeFilter === 'All') return projectTasks;
    if (activeFilter === 'Not Started') return projectTasks.filter(t => t.status === 'Not Started');
    if (activeFilter === 'In Progress') return projectTasks.filter(t => t.status === 'In Progress');
    if (activeFilter === 'Completed') return projectTasks.filter(t => t.status === 'Completed');
    return projectTasks;
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  const getTaskStats = (projectId) => {
    const projectTasks = tasks.filter(task => task.projectId === projectId);
    const notStarted = projectTasks.filter(t => t.status === 'Not Started').length;
    const inProgress = projectTasks.filter(t => t.status === 'In Progress').length;
    const completed = projectTasks.filter(t => t.status === 'Completed').length;
    const onHold = projectTasks.filter(t => t.status === 'On Hold').length;
    return { notStarted, inProgress, completed, onHold, total: projectTasks.length };
  };

  const getEmployeeById = (employeeId) => {
    return employees.find(emp => emp.id === employeeId);
  };

  const getAvailableEmployeesForProject = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return [];
    
    return project.teamMembers.map(empId => getEmployeeById(empId)).filter(emp => emp);
  };

  const updateProjectStatus = (projectId, newStatus) => {
    console.log(`Updating project ${projectId} status to ${newStatus}`);
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'High': return '#ef4444';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <div className="task-management">
      <div className="task-header">
        <div className="header-content">
          <h2>Task Management</h2>
          <p className="header-subtitle">Assign and track tasks across projects</p>
        </div>
        <button 
          className="add-task-btn"
          onClick={() => setShowAddTask(true)}
        >
          Add New Task
        </button>
      </div>

      <div className="projects-section">
        <div className="section-header">
          <h3>Project Overview</h3>
        </div>
        
        <div className="projects-grid">
          {projects.map((project) => {
            const stats = getTaskStats(project.id);
            const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
            
            return (
              <div key={project.id} className="project-card">
                <div className="project-card-header">
                  <div className="project-info">
                    <h4>{project.name}</h4>
                    <div className="project-meta">
                      <span className="project-id">ID: {project.id}</span>
                      <span className="client-name">Client: {project.client}</span>
                    </div>
                  </div>
                  <div className="project-status-controls">
                    <select 
                      className={`status-select ${project.status.toLowerCase().replace(' ', '-')}`}
                      value={project.status}
                      onChange={(e) => updateProjectStatus(project.id, e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                  </div>
                </div>

                <div className="project-progress">
                  <div className="progress-info">
                    <span className="progress-label">Progress</span>
                    <span className="progress-percentage">{progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="task-stats-grid">
                  <div className="stat-item">
                    <div className="stat-number total">{stats.total}</div>
                    <div className="stat-label">Total</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number not-started">{stats.notStarted}</div>
                    <div className="stat-label">Pending</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number in-progress">{stats.inProgress}</div>
                    <div className="stat-label">Active</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number completed">{stats.completed}</div>
                    <div className="stat-label">Done</div>
                  </div>
                </div>
                
                <div className="project-actions">
                  <button 
                    className="action-btn primary"
                    onClick={() => {
                      setNewTask(prev => ({ ...prev, projectId: project.id }));
                      setShowAddTask(true);
                    }}
                  >
                    Assign Task
                  </button>
                  <button 
                    className="action-btn secondary"
                    onClick={() => handleViewTasks(project.id)}
                  >
                    View Tasks
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showViewTasks && (
        <div className="modal-overlay">
          <div className="modal large">
            <div className="modal-header">
              <div className="modal-title">
                <h3>Project Tasks</h3>
                <span className="project-name">{getProjectName(selectedProject)}</span>
              </div>
              <button 
                className="close-btn"
                onClick={() => setShowViewTasks(false)}
              >
                ×
              </button>
            </div>
            
            <div className="tasks-filter">
              <div className="filter-tabs">
                {['All', 'Not Started', 'In Progress', 'Completed'].map(filter => (
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
            
            <div className="tasks-container">
              {getProjectTasks(selectedProject).length === 0 ? (
                <div className="no-tasks">
                  <div className="no-tasks-icon">📝</div>
                  <h4>No tasks found</h4>
                  <p>No tasks match the current filter or none have been created yet.</p>
                  <button 
                    className="create-task-btn"
                    onClick={() => {
                      setNewTask(prev => ({ ...prev, projectId: selectedProject }));
                      setShowViewTasks(false);
                      setShowAddTask(true);
                    }}
                  >
                    Create First Task
                  </button>
                </div>
              ) : (
                <div className="tasks-grid">
                  {getProjectTasks(selectedProject).map((task) => (
                    <div key={task.id} className="task-card">
                      <div className="task-card-header">
                        <div className="task-title">
                          <h4>{task.name}</h4>
                          <div className="task-id">#{task.id}</div>
                        </div>
                        <div 
                          className="priority-indicator"
                          style={{ backgroundColor: getPriorityColor(task.priority) }}
                        >
                          {task.priority}
                        </div>
                      </div>
                      
                      <div className="task-description">
                        {task.description}
                      </div>
                      
                      <div className="task-assignees">
                        <span className="assignees-label">Assigned to:</span>
                        <div className="assignees-list">
                          {task.assignedTo.map((empId) => {
                            const employee = getEmployeeById(empId);
                            return employee ? (
                              <div key={empId} className="assignee">
                                <div className="assignee-info">
                                  <span className="assignee-name">{employee.name}</span>
                                  <span className="assignee-dept">{employee.department}</span>
                                </div>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                      
                      <div className="task-timeline">
                        <div className="timeline-item">
                          <span className="timeline-label">Start:</span>
                          <span className="timeline-date">{new Date(task.startDate).toLocaleDateString()}</span>
                        </div>
                        <div className="timeline-item">
                          <span className="timeline-label">Due:</span>
                          <span className="timeline-date">{new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="task-footer">
                        <select 
                          className={`task-status ${task.status.toLowerCase().replace(' ', '-')}`}
                          value={task.status}
                          onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                        >
                          <option value="Not Started">Not Started</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="On Hold">On Hold</option>
                        </select>
                        <button className="task-action-btn">
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddTask && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Create New Task</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowAddTask(false);
                  setSelectedEmployees([]);
                }}
              >
                ×
              </button>
            </div>
            
            <div className="task-form">
              <div className="form-section">
                <h4>Task Details</h4>
                
                <div className="form-group">
                  <label>Task Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={newTask.name}
                    onChange={handleInputChange}
                    placeholder="Enter task name"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Task Description *</label>
                  <textarea
                    name="description"
                    value={newTask.description}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Describe the task requirements and objectives"
                    required
                  ></textarea>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Project *</label>
                    <select
                      name="projectId"
                      value={newTask.projectId}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Project</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name} ({project.id})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Priority</label>
                    <select
                      name="priority"
                      value={newTask.priority}
                      onChange={handleInputChange}
                    >
                      <option value="Low">Low Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="High">High Priority</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Start Date *</label>
                    <input
                      type="date"
                      name="startDate"
                      value={newTask.startDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Due Date *</label>
                    <input
                      type="date"
                      name="dueDate"
                      value={newTask.dueDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="form-section">
                <h4>Assign Team Members</h4>
                <p className="section-description">
                  {newTask.projectId ? 
                    'Select from project team members:' : 
                    'Please select a project first to see available team members'
                  }
                </p>
                
                {newTask.projectId && (
                  <div className="employees-grid">
                    {getAvailableEmployeesForProject(newTask.projectId).map((employee) => (
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
                )}
                
                {!newTask.projectId && (
                  <div className="no-employees">
                    <div className="no-employees-icon">👥</div>
                    <h4>Select Project First</h4>
                    <p>Choose a project to see available team members for assignment.</p>
                  </div>
                )}
                
                {selectedEmployees.length > 0 && (
                  <div className="selected-employees">
                    <h5>Selected Team Members ({selectedEmployees.length})</h5>
                    <div className="selected-list">
                      {selectedEmployees.map((empId) => {
                        const employee = getEmployeeById(empId);
                        return employee ? (
                          <div key={empId} className="selected-employee">
                            <span>{employee.name}</span>
                            <button 
                              type="button"
                              onClick={() => handleEmployeeSelection(empId)}
                              className="remove-btn"
                            >
                              ×
                            </button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => {
                    setShowAddTask(false);
                    setSelectedEmployees([]);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn-submit"
                  onClick={handleAddTask}
                  disabled={selectedEmployees.length === 0}
                >
                  Create Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManagement;