import React, { useState } from 'react';
import './TaskManagement.css';
import SectionComponent from '../../components/project-manager/SectionComponent';

const TaskManagement = () => {
  const [projects] = useState([
    {
      id: 'PRJ001',
      name: 'E-commerce Website',
      client: 'ABC Corp'
    },
    {
      id: 'PRJ002',
      name: 'Mobile Banking App',
      client: 'XYZ Bank'
    },
    {
      id: 'PRJ003',
      name: 'CRM System',
      client: 'DEF Ltd'
    }
  ]);

  const [tasks, setTasks] = useState([
    {
      id: 'TSK001',
      name: 'Design Homepage Layout',
      description: 'Create responsive homepage design with modern UI',
      assignedTo: 'John Doe',
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
      assignedTo: 'Jane Smith',
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
      assignedTo: 'Mike Johnson',
      projectId: 'PRJ002',
      priority: 'Medium',
      status: 'Completed',
      startDate: '2024-01-15',
      dueDate: '2024-01-25'
    }
  ]);

  const [selectedProject, setSelectedProject] = useState('');
  const [showViewTasks, setShowViewTasks] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    assignedTo: '',
    projectId: '',
    priority: 'Medium',
    status: 'Not Started',
    startDate: '',
    dueDate: ''
  });

  const employees = [
    'John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 
    'David Brown', 'Emma Davis', 'Alex Thompson', 'Lisa Garcia'
  ];

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

  const handleAddTask = (e) => {
    e.preventDefault();
    const task = {
      ...newTask,
      id: generateTaskId()
    };
    setTasks([...tasks, task]);
    setNewTask({
      name: '',
      description: '',
      assignedTo: '',
      projectId: '',
      priority: 'Medium',
      status: 'Not Started',
      startDate: '',
      dueDate: ''
    });
    setShowAddTask(false);
  };

  const handleViewTasks = (projectId) => {
    setSelectedProject(projectId);
    setShowViewTasks(true);
  };

  const getProjectTasks = (projectId) => {
    return tasks.filter(task => task.projectId === projectId);
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  const getTaskStats = (projectId) => {
    const projectTasks = getProjectTasks(projectId);
    const notStarted = projectTasks.filter(t => t.status === 'Not Started').length;
    const inProgress = projectTasks.filter(t => t.status === 'In Progress').length;
    const completed = projectTasks.filter(t => t.status === 'Completed').length;
    const onHold = projectTasks.filter(t => t.status === 'On Hold').length;
    return { notStarted, inProgress, completed, onHold, total: projectTasks.length };
  };

  return (
    
    <div className="task-management">
      <div className="task-header">
        <h2>Task Management</h2>
        <button 
          className="add-task-btn"
          onClick={() => setShowAddTask(true)}
        >
          + Add New Task
        </button>
      </div>

      <div className="projects-list">
        <h3>Projects</h3>
        <div className="projects-grid">
          {projects.map((project) => {
            const stats = getTaskStats(project.id);
            return (
              <div key={project.id} className="project-card">
                <div className="project-info">
                  <h4>{project.name}</h4>
                  <p className="project-id">ID: {project.id}</p>
                  <p className="client">Client: {project.client}</p>
                  
                  <div className="task-stats">
                    <div className="stat-item">
                      <span className="stat-number">{stats.total}</span>
                      <span className="stat-label">Total Tasks</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number not-started">{stats.notStarted}</span>
                      <span className="stat-label">Not Started</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number in-progress">{stats.inProgress}</span>
                      <span className="stat-label">In Progress</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number completed">{stats.completed}</span>
                      <span className="stat-label">Completed</span>
                    </div>
                  </div>
                </div>
                
                <div className="project-actions">
                  <button 
                    className="assign-btn"
                    onClick={() => {
                      setNewTask(prev => ({ ...prev, projectId: project.id }));
                      setShowAddTask(true);
                    }}
                  >
                    Assign Task
                  </button>
                  <button 
                    className="view-btn"
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
              <h3>Tasks - {getProjectName(selectedProject)}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowViewTasks(false)}
              >
                ×
              </button>
            </div>
            
            <div className="tasks-container">
              {getProjectTasks(selectedProject).length === 0 ? (
                <div className="no-tasks">
                  <p>No tasks assigned to this project yet.</p>
                </div>
              ) : (
                <div className="tasks-grid">
                  {getProjectTasks(selectedProject).map((task) => (
                    <div key={task.id} className="task-card">
                      <div className="task-header">
                        <h4>{task.name}</h4>
                        <span className={`priority ${task.priority.toLowerCase()}`}>
                          {task.priority}
                        </span>
                      </div>
                      
                      <div className="task-details">
                        <p><strong>Task ID:</strong> {task.id}</p>
                        <p><strong>Description:</strong> {task.description}</p>
                        <p><strong>Assigned To:</strong> {task.assignedTo}</p>
                        <p><strong>Start Date:</strong> {task.startDate}</p>
                        <p><strong>Due Date:</strong> {task.dueDate}</p>
                        <div className="task-status">
                          <strong>Status:</strong>
                          <span className={`status ${task.status.toLowerCase().replace(' ', '-')}`}>
                            {task.status}
                          </span>
                        </div>
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
            <h3>Add New Task</h3>
            <form onSubmit={handleAddTask}>
              <div className="form-group">
                <label>Task Name</label>
                <input
                  type="text"
                  name="name"
                  value={newTask.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Task Description</label>
                <textarea
                  name="description"
                  value={newTask.description}
                  onChange={handleInputChange}
                  rows="3"
                  required
                ></textarea>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Assigned To</label>
                  <select
                    name="assignedTo"
                    value={newTask.assignedTo}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map((employee) => (
                      <option key={employee} value={employee}>
                        {employee}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Project</label>
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
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    name="priority"
                    value={newTask.priority}
                    onChange={handleInputChange}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={newTask.status}
                    onChange={handleInputChange}
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={newTask.startDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    name="dueDate"
                    value={newTask.dueDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddTask(false)}>
                  Cancel
                </button>
                <button type="submit">Add Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManagement;