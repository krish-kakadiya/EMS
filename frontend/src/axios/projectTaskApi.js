import api from './api';

// Projects
export const fetchProjects = () => api.get('/projects');
export const createProject = (data) => api.post('/projects', data);
export const updateProjectStatus = (id, status) => api.patch(`/projects/${id}/status`, { status });
export const updateProjectTeam = (id, teamMembers) => api.patch(`/projects/${id}/team`, { teamMembers });

// Tasks
export const fetchTasks = (projectId) => api.get('/tasks', { params: projectId ? { projectId } : {} });
export const createTask = (data) => api.post('/tasks', data);
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data);
export const updateTaskStatus = (id, status) => api.patch(`/tasks/${id}/status`, { status });
export const deleteTask = (id) => api.delete(`/tasks/${id}`);

// Employees simplified list
export const fetchSimpleEmployees = () => api.get('/employees/simple/list');
