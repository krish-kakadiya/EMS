import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { formatDDMMYY } from '../../utils/dateFormat.js';
import "./TaskManagement.css";
import { 
  fetchProjects, fetchTasks, createTask as apiCreateTask, updateTaskStatus as apiUpdateTaskStatus,
  updateProjectStatus as apiUpdateProjectStatus, fetchSimpleEmployees, createProject as apiCreateProject
} from '../../axios/projectTaskApi';

const TaskManagement = () => {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedProject, setSelectedProject] = useState('');
  const [showViewTasks, setShowViewTasks] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  // Task assignment state
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  // New project team selection (inline in create project modal)
  const [newProjectTeam, setNewProjectTeam] = useState([]);
  // Edit task state
  const [editTask, setEditTask] = useState(null); // holds original task object
  const [showEditTask, setShowEditTask] = useState(false);
  const [editSelectedEmployees, setEditSelectedEmployees] = useState([]);
  const socketRef = useRef(null);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);

  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    projectId: '',
    priority: 'Medium',
    startDate: '',
    dueDate: ''
  });

  const [newProject, setNewProject] = useState({
    name: '',
    client: '',
    description: '',
    startDate: '',
    endDate: '',
    technologies: '', // UI only – not yet persisted in backend
    githubLink: '',    // UI only – not yet persisted
    projectType: 'Web Application', // UI only – not yet persisted
    duration: ''
  });

  const projectTypes = [
    'Web Application','Website','Mobile App','Desktop App','API/Backend','E-commerce','CMS','Dashboard','Landing Page','Other'
  ];

  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return '';
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start) || isNaN(end) || end < start) return '';
    const diffDays = Math.ceil((end - start) / (1000*60*60*24));
    return `${diffDays} days`;
  };

  // Fetch initial data & init socket
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // Fetch projects, employees and ALL tasks so overview progress bars can display immediately
        const [projRes, empRes, taskRes] = await Promise.all([
          fetchProjects(),
          fetchSimpleEmployees(),
          fetchTasks() // no projectId -> get all tasks
        ]);
        setProjects(projRes.data.projects || []);
        setEmployees(empRes.data.employees || []);
        setTasks(taskRes.data.tasks || []);
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load data');
      } finally { setLoading(false); }
    };
    load();
    if (!socketRef.current) {
      try {
        const origin = window.location.origin.replace(/:\d+$/, ':3000');
        socketRef.current = io(origin, { withCredentials: true });
        socketRef.current.on('taskUpdated', ({ task }) => {
          if (!realtimeEnabled || !task?._id) return;
          setTasks(prev => {
            const idx = prev.findIndex(t => t._id === task._id);
            if (idx === -1) return [...prev, task];
            const clone = [...prev];
            clone[idx] = task;
            return clone;
          });
        });
      } catch (e) {
        console.warn('Socket init failed', e.message);
      }
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off('taskUpdated');
      }
    };
  }, []);

  const loadTasksForProject = async (projectId) => {
    try {
      const res = await fetchTasks(projectId);
      const projectTasks = res.data.tasks || [];
      // Merge: keep tasks from other projects, replace tasks of this project
      setTasks(prev => {
        const others = prev.filter(t => {
          const pid = (t.project && (t.project._id || t.project.id || t.project));
          return pid !== projectId;});
        return [...others, ...projectTasks];
      });
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load tasks');
    }
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

  const handleAddTask = async (e) => {
    e.preventDefault();
    const proj = projects.find(p => p._id === newTask.projectId);
    if (!proj) { setError('Select a project'); return; }
    if (!newTask.name.trim()) { setError('Task name required'); return; }
    if (selectedEmployees.length === 0) { setError('Select at least one team member'); return; }
    // Date validations client-side
    if (newTask.startDate && newTask.dueDate && new Date(newTask.dueDate) < new Date(newTask.startDate)) {
      setError('Due date cannot be before start date'); return; }
    if (proj.startDate && newTask.startDate && new Date(newTask.startDate) < new Date(proj.startDate)) { setError('Task start before project start'); return; }
    if (proj.endDate && newTask.dueDate && new Date(newTask.dueDate) > new Date(proj.endDate)) { setError('Task due after project end'); return; }

    const assignedToIds = selectedEmployees
      .map(empId => employees.find(e => e.employeeId === empId || e._id === empId)?._id)
      .filter(Boolean);
    if (assignedToIds.length === 0) { setError('Could not map selected employees'); return; }

    try {
      setLoading(true);
      console.debug('Creating task payload', {
        projectId: proj._id, name: newTask.name, assignedTo: assignedToIds,
        startDate: newTask.startDate, dueDate: newTask.dueDate, priority: newTask.priority
      });
      await apiCreateTask({
        projectId: proj._id,
        name: newTask.name.trim(),
        description: newTask.description,
        assignedTo: assignedToIds,
        priority: newTask.priority.toLowerCase(),
        startDate: newTask.startDate || undefined,
        dueDate: newTask.dueDate || undefined
      });
      await loadTasksForProject(proj._id);
      setNewTask({ name:'', description:'', projectId:'', priority:'Medium', startDate:'', dueDate:'' });
      setSelectedEmployees([]);
      setShowAddTask(false);
      setError(null);
    } catch (err) {
      console.error('Task create error', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to create task');
    } finally { setLoading(false); }
  };

  const handleViewTasks = async (projectKey) => {
    const proj = projects.find(p => p.code === projectKey || p._id === projectKey);
    if (!proj) return;
    setSelectedProject(proj._id); // store canonical _id
    setShowViewTasks(true);
    await loadTasksForProject(proj._id);
  };

  const openEditTask = (task) => {
    setEditTask({ ...task });
    // Map assignedTo (which may be array of populated users) to employeeIds for selection
    const ids = (task.assignedTo || []).map(a => a.employeeId || a._id).filter(Boolean);
    setEditSelectedEmployees(ids);
    setShowEditTask(true);
    setError(null);
  };

  const toggleEditEmployee = (employeeId) => {
    setEditSelectedEmployees(prev => prev.includes(employeeId) ? prev.filter(id => id !== employeeId) : [...prev, employeeId]);
  };

  const handleEditFieldChange = (e) => {
    const { name, value } = e.target;
    setEditTask(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!editTask) return;
    const proj = projects.find(p => p._id === (editTask.project?._id || editTask.project?.code || editTask.project) || p.code === editTask.project?.code);
    if (!proj) { setError('Project missing for task'); return; }
    if (!editTask.name?.trim()) { setError('Task name required'); return; }
    if (editSelectedEmployees.length === 0) { setError('Select at least one team member'); return; }
    const newStart = editTask.startDate;
    const newDue = editTask.dueDate;
    if (newStart && newDue && new Date(newDue) < new Date(newStart)) { setError('Due date before start date'); return; }
    if (proj.startDate && newStart && new Date(newStart) < new Date(proj.startDate)) { setError('Start before project start'); return; }
    if (proj.endDate && newDue && new Date(newDue) > new Date(proj.endDate)) { setError('Due after project end'); return; }
    const assignedToIds = editSelectedEmployees
      .map(empId => employees.find(e => e.employeeId === empId || e._id === empId)?._id)
      .filter(Boolean);
    if (assignedToIds.length === 0) { setError('Could not map selected employees'); return; }
    try {
      setLoading(true);
      // build payload (preserve status if not changed here)
      const payload = {
        name: editTask.name.trim(),
        description: editTask.description,
        priority: (editTask.priority || 'medium').toLowerCase(),
        startDate: newStart || undefined,
        dueDate: newDue || undefined,
        assignedTo: assignedToIds
      };
      // use dynamic import to avoid circular import at top (or add updateTask to main import)
      const { updateTask: apiUpdateTask } = await import('../../axios/projectTaskApi.js');
      await apiUpdateTask(editTask._id, payload);
      await loadTasksForProject(proj._id);
      setShowEditTask(false);
      setEditTask(null);
      setEditSelectedEmployees([]);
    } catch (err) {
      console.error('Task update error', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to update task');
    } finally { setLoading(false); }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await apiUpdateTaskStatus(taskId, newStatus.toLowerCase().replace(' ', '-'));
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus.toLowerCase() } : t));
    } catch (e) { setError('Failed to update status'); }
  };

  const getProjectTasks = (projectId) => {
    const projectTasks = tasks.filter(task => (task.project && (task.project.code === projectId || task.project._id === projectId)));
    if (activeFilter === 'All') return projectTasks;
    const normalize = (s='') => s.toLowerCase();
    switch(activeFilter) {
      case 'Not Started': return projectTasks.filter(t => normalize(t.status) === 'not-started');
      case 'In Progress': return projectTasks.filter(t => normalize(t.status) === 'in-progress');
      case 'Completed': return projectTasks.filter(t => normalize(t.status) === 'completed');
      case 'On Hold': return projectTasks.filter(t => normalize(t.status) === 'on-hold');
      default: return projectTasks;
    }
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.code === projectId || p._id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  const getTaskStats = (projectId) => {
    const projectTasks = tasks.filter(task => (task.project && (task.project.code === projectId || task.project._id === projectId)));
    const mapStatus = s => ({'not-started':'Not Started','in-progress':'In Progress','completed':'Completed','on-hold':'On Hold'}[s]||s);
    const normalized = projectTasks.map(t => mapStatus(t.status));
    const notStarted = normalized.filter(s => s === 'Not Started').length;
    const inProgress = normalized.filter(s => s === 'In Progress').length;
    const completed = normalized.filter(s => s === 'Completed').length;
    const onHold = normalized.filter(s => s === 'On Hold').length;
    return { notStarted, inProgress, completed, onHold, total: projectTasks.length };
  };

  const getEmployeeById = (employeeId) => {
    return employees.find(emp => emp.employeeId === employeeId || emp._id === employeeId);
  };

  const getAvailableEmployeesForProject = (projectId) => {
    const project = projects.find(p => p.code === projectId || p._id === projectId);
    if (!project) return [];
    return (project.teamMembers || []).map(emp => {
      const fullRecord = employees.find(e => e.employeeId === emp.employeeId || e._id === emp._id) || {};
      return {
        _id: emp._id || fullRecord._id,
        employeeId: emp.employeeId || fullRecord.employeeId,
        name: emp.name || fullRecord.name,
        department: fullRecord.department || emp.department,
        designation: fullRecord.designation,
        role: fullRecord.role
      };
    });
  };

  const updateProjectStatus = async (projectId, newStatus) => {
    try {
      const proj = projects.find(p => p.code === projectId || p._id === projectId);
      if (!proj) return;
      await apiUpdateProjectStatus(proj._id, newStatus.toLowerCase().replace(' ', '-'));
      setProjects(prev => prev.map(p => p._id === proj._id ? { ...p, status: newStatus.toLowerCase().replace(' ', '-') } : p));
    } catch (e) { setError('Failed to update project status'); }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'High': return '#ef4444';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#10b981';
      default: return '#6b7280';
    }
  };

  // Helper: compute project date bounds for the currently selected project
  const currentProject = projects.find(p => p._id === newTask.projectId);
  const projectStartISO = currentProject?.startDate ? currentProject.startDate.substring(0,10) : undefined;
  const projectEndISO = currentProject?.endDate ? currentProject.endDate.substring(0,10) : undefined;
  const startDateMin = projectStartISO;
  const startDateMax = projectEndISO;
  const dueDateMin = newTask.startDate || projectStartISO;
  const dueDateMax = projectEndISO;

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

  const toggleNewProjectTeamMember = (employeeId) => {
    setNewProjectTeam(prev => prev.includes(employeeId)
      ? prev.filter(id => id !== employeeId)
      : [...prev, employeeId]);
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      // map employeeIds -> _ids
      const teamMemberObjectIds = newProjectTeam.map(eid => (
        employees.find(e => e.employeeId === eid || e._id === eid)?._id
      )).filter(Boolean);

      await apiCreateProject({
        name: newProject.name,
        client: newProject.client,
        description: newProject.description,
        startDate: newProject.startDate || undefined,
        endDate: newProject.endDate || undefined,
        teamMembers: teamMemberObjectIds
        // Note: technologies, githubLink, projectType not sent (backend model doesn't support yet)
      });
      const projRes = await fetchProjects();
      setProjects(projRes.data.projects || []);
      setShowCreateProject(false);
  setNewProject({ name:'', client:'', description:'', startDate:'', endDate:'', technologies:'', githubLink:'', projectType:'Web Application', duration:'' });
      setNewProjectTeam([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally { setLoading(false); }
  };

  return (
    <div className="task-management">
      <div className="task-header">
        <div className="header-content">
          <h2>Task Management</h2>
          <p className="header-subtitle">Assign and track tasks across projects</p>
        </div>
        <div className="header-actions">
          <button 
            className="add-task-btn"
            onClick={() => setShowCreateProject(true)}
          >
            New Project
          </button>
          <button 
            className="add-task-btn secondary"
            onClick={() => {
              // If user has a project selected in the overview (selectedProject holds _id) use it; else leave blank
              setNewTask(t => ({ ...t, projectId: selectedProject || '' }));
              setShowAddTask(true);
            }}
          >
            New Task
          </button>
        </div>
      </div>
      <div className="projects-section">
        <div className="section-header">
          <h3>Project Overview</h3>
        </div>
        
        <div className="projects-grid">
              {projects.map((project) => {
            const projectKey = project.code || project._id;
            const stats = getTaskStats(projectKey);
            const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
            return (
              <div key={projectKey} className={`project-card ${selectedProject === project._id ? 'selected' : ''}`}>
                <div className="project-card-header">
                  <div className="project-info">
                    <h4>{project.name}</h4>
                    <div className="project-meta">
                      <span className="project-id">ID: {project.code}</span>
                      <span className="client-name">Client: {project.client}</span>
                    </div>
                  </div>
                  <div className="project-status-controls">
                    <select 
                      className={`status-select ${(project.status || '').toLowerCase()}`}
                      value={project.status || 'pending'}
                      onChange={(e) => updateProjectStatus(projectKey, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="on-hold">On Hold</option>
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
                      // Always store canonical _id for creation
                      setNewTask(prev => ({ ...prev, projectId: project._id }));
                      setSelectedEmployees([]);
                      setShowAddTask(true);
                    }}
                  >
                    Assign Task
                  </button>
                  <button 
                    className="action-btn secondary"
                    onClick={() => handleViewTasks(projectKey)}
                  >
                    View Tasks
                  </button>
                  <button
                    className="action-btn secondary"
                    onClick={async () => { await loadTasksForProject(project._id); }}
                  >
                    Refresh
                  </button>
                  {/* Team management button removed; team chosen during project creation now */}
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
              <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                <button className="close-btn" style={{background:'#0d6efd'}} onClick={async ()=> { await loadTasksForProject(selectedProject); }}>↻</button>
                <label style={{fontSize:'12px',display:'flex',alignItems:'center',gap:'4px'}}>
                  <input type="checkbox" checked={realtimeEnabled} onChange={e=> setRealtimeEnabled(e.target.checked)} /> Live
                </label>
                <button 
                  className="close-btn"
                  onClick={() => setShowViewTasks(false)}
                >
                  ×
                </button>
              </div>
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
                    <div key={task._id} className="task-card">
                      <div className="task-card-header">
                        <div className="task-title">
                          <h4>{task.name}</h4>
                          <div className="task-id">#{task.code}</div>
                        </div>
                        <div 
                          className="priority-indicator"
                          style={{ backgroundColor: getPriorityColor(task.priority?.charAt(0)?.toUpperCase()+task.priority?.slice(1)) }}
                        >
                          {task.priority?.charAt(0)?.toUpperCase()+task.priority?.slice(1)}
                        </div>
                      </div>
                      
                      <div className="task-description">
                        {task.description}
                      </div>
                      {task.lastEmployeeMessage && (
                        <div className="task-last-message">
                          <strong>Last Update:</strong> {task.lastEmployeeMessage}
                        </div>
                      )}
                      {task.statusUpdates && task.statusUpdates.length > 0 && (
                        <div className="task-updates-meta">
                          <small>{task.statusUpdates.length} update{task.statusUpdates.length>1?'s':''}</small>
                        </div>
                      )}
                      
                      <div className="task-assignees">
                        <span className="assignees-label">Assigned to:</span>
                        <div className="assignees-list">
                          {task.assignedTo.map((emp) => {
                            const employee = getEmployeeById(emp.employeeId || emp._id);
                            return employee ? (
                              <div key={emp._id || emp} className="assignee">
                                <div className="assignee-info">
                                  <span className="assignee-name">{employee.name}</span>
                                  <span className="assignee-dept">{getDisplayDepartment(employee)}</span>
                                </div>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                      
                      <div className="task-timeline">
                        <div className="timeline-item">
                          <span className="timeline-label">Start:</span>
                          <span className="timeline-date">{formatDDMMYY(task.startDate)}</span>
                        </div>
                        <div className="timeline-item">
                          <span className="timeline-label">Due:</span>
                          <span className="timeline-date">{formatDDMMYY(task.dueDate)}</span>
                        </div>
                      </div>
                      
                      <div className="task-footer">
                        <select 
                          className={`task-status ${task.status}`}
                          value={task.status}
                          onChange={(e) => updateTaskStatus(task._id, e.target.value)}
                        >
                          <option value="not-started">Not Started</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="on-hold">On Hold</option>
                        </select>
                        <button className="task-action-btn" type="button" onClick={() => openEditTask(task)}>
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

      {showEditTask && editTask && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Task</h3>
              <button className="close-btn" onClick={() => { setShowEditTask(false); setEditTask(null); }}>&times;</button>
            </div>
            <form className="task-form" onSubmit={handleUpdateTask}>
              <div className="form-section">
                <h4>Task Details</h4>
                <div className="form-group">
                  <label>Name *</label>
                  <input name="name" value={editTask.name} onChange={handleEditFieldChange} required />
                </div>
                <div className="form-group">
                  <label>Description *</label>
                  <textarea name="description" value={editTask.description} onChange={handleEditFieldChange} required rows="3" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Priority</label>
                    <select name="priority" value={editTask.priority?.charAt(0).toUpperCase()+editTask.priority?.slice(1) || 'Medium'} onChange={(e)=> setEditTask(prev=> ({...prev, priority:e.target.value}))}>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Start Date</label>
                    <input type="date" name="startDate" value={editTask.startDate?.substring(0,10) || ''} onChange={handleEditFieldChange} />
                  </div>
                  <div className="form-group">
                    <label>Due Date</label>
                    <input type="date" name="dueDate" value={editTask.dueDate?.substring(0,10) || ''} onChange={handleEditFieldChange} />
                  </div>
                </div>
              </div>
              <div className="form-section">
                <h4>Reassign Members</h4>
                <div className="employees-grid">
                  {getAvailableEmployeesForProject(editTask.project?.code || editTask.project?._id || editTask.project).map(emp => (
                    <div key={emp.employeeId || emp._id}
                      className={`employee-card-horizontal ${editSelectedEmployees.includes(emp.employeeId) ? 'selected' : ''}`}
                      onClick={() => toggleEditEmployee(emp.employeeId)}>
                      <div className="employee-avatar-small">
                        <img src={emp.photo || 'https://via.placeholder.com/40'} alt={emp.name} />
                      </div>
                      <div className="employee-info">
                        <h5>{emp.name}</h5>
                        <span className="employee-department">{getDisplayDepartment(emp)}</span>
                      </div>
                      {editSelectedEmployees.includes(emp.employeeId) && (<div className="selection-check">✓</div>)}
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={()=> { setShowEditTask(false); setEditTask(null); }}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
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
                      onChange={(e)=> {
                        const value = e.target.value;
                        // when project changes reset selected employees & dates if out of range
                        setNewTask(t=> ({...t, projectId:value}));
                        setSelectedEmployees([]);
                      }}
                      required
                    >
                      <option value="">Select Project</option>
                      {projects.map((project) => (
                        <option key={project._id} value={project._id}>
                          {project.name} ({project.code})
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
                      min={startDateMin}
                      max={startDateMax}
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
                      min={dueDateMin}
                      max={dueDateMax}
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
                        key={employee._id} 
                        className={`employee-card-horizontal ${selectedEmployees.includes(employee.employeeId) ? 'selected' : ''}`}
                        onClick={() => handleEmployeeSelection(employee.employeeId)}
                      >
                        <div className="employee-avatar-small">
                          <img src={employee.photo || 'https://via.placeholder.com/40'} alt={employee.name} />
                        </div>
                        <div className="employee-info">
                          <h5>{employee.name}</h5>
                          <span className="employee-department">{getDisplayDepartment(employee)}</span>
                        </div>
                        {selectedEmployees.includes(employee.employeeId) && (
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

      {showCreateProject && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Create Project</h3>
              <button className="close-btn" onClick={()=> setShowCreateProject(false)}>×</button>
            </div>
            <form className="task-form" onSubmit={handleCreateProject}>
              <div className="form-section">
                <h4>Project Information</h4>
                <div className="form-group">
                  <label>Name *</label>
                  <input value={newProject.name} required onChange={e=> setNewProject(p=>({...p,name:e.target.value}))} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Client *</label>
                    <input value={newProject.client} required onChange={e=> setNewProject(p=>({...p,client:e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label>Project Type *</label>
                    <select value={newProject.projectType} onChange={e=> setNewProject(p=>({...p,projectType:e.target.value}))}>
                      {projectTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>Timeline</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Start Date</label>
                    <input type="date" value={newProject.startDate} onChange={e=> setNewProject(p=>{ const v=e.target.value; return {...p,startDate:v,duration:calculateDuration(v,p.endDate)}; })} max={newProject.endDate || undefined} />
                  </div>
                  <div className="form-group">
                    <label>End Date</label>
                    <input type="date" value={newProject.endDate} onChange={e=> setNewProject(p=>{ const v=e.target.value; return {...p,endDate:v,duration:calculateDuration(p.startDate,v)}; })} min={newProject.startDate || undefined} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Duration (auto)</label>
                  <input value={newProject.duration || '—'} disabled />
                </div>
              </div>

              <div className="form-section">
                <h4>Details</h4>
                <div className="form-group">
                  <label>Description</label>
                  <textarea value={newProject.description} onChange={e=> setNewProject(p=>({...p,description:e.target.value}))} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Technologies</label>
                    <input value={newProject.technologies} onChange={e=> setNewProject(p=>({...p,technologies:e.target.value}))} placeholder="e.g. React, Node.js" />
                  </div>
                  <div className="form-group">
                    <label>GitHub Repo</label>
                    <input value={newProject.githubLink} onChange={e=> setNewProject(p=>({...p,githubLink:e.target.value}))} placeholder="https://github.com/..." />
                  </div>
                </div>
                <p style={{fontSize:'12px',color:'#666'}}>Note: Extra fields (type, tech, repo) not yet stored in backend.</p>
              </div>

              <div className="form-section">
                <h4>Select Team Members (optional)</h4>
                <p className="section-description">Choose employees to assign to this project now. You can still assign tasks only to selected team members.</p>
                <div className="employees-grid">
                  {employees.map(emp => (
                    <div
                      key={emp._id}
                      className={`employee-card-horizontal ${newProjectTeam.includes(emp.employeeId) ? 'selected' : ''}`}
                      onClick={() => toggleNewProjectTeamMember(emp.employeeId)}
                    >
                      <div className="employee-avatar-small">
                        <img src={emp.photo || 'https://via.placeholder.com/40'} alt={emp.name} />
                      </div>
                      <div className="employee-info">
                        <h5>{emp.name}</h5>
                        <span className="employee-department">{getDisplayDepartment(emp)}</span>
                      </div>
                      {newProjectTeam.includes(emp.employeeId) && <div className="selection-check">✓</div>}
                    </div>
                  ))}
                </div>
                {newProjectTeam.length > 0 && (
                  <div className="selected-employees">
                    <h5>Selected ({newProjectTeam.length})</h5>
                    <div className="selected-list">
                      {newProjectTeam.map(eid => {
                        const emp = employees.find(e => e.employeeId === eid);
                        return emp ? (
                          <div key={eid} className="selected-employee">
                            <span>{emp.name}</span>
                            <button type="button" className="remove-btn" onClick={() => toggleNewProjectTeamMember(eid)}>×</button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={()=> setShowCreateProject(false)}>Cancel</button>
                <button type="submit" className="btn-submit">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Manage Team modal removed: team selection handled during project creation */}
    </div>
  );
};

export default TaskManagement;