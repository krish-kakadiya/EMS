import Task from '../model/task.model.js';
import Project from '../model/project.model.js';
import { generateSequentialCode } from '../utils/generateCode.js';

export const createTask = async (req, res) => {
  try {
    const { projectId, name, description, assignedTo = [], priority = 'medium', startDate, dueDate } = req.body;
    if (!projectId || !name) return res.status(400).json({ success: false, message: 'projectId and name required' });
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    // Enforce task dates inside project range if project has dates
    if (startDate && project.startDate && new Date(startDate) < new Date(project.startDate)) {
      return res.status(400).json({ success: false, message: 'Task start date cannot be before project start date' });
    }
    if (dueDate && project.endDate && new Date(dueDate) > new Date(project.endDate)) {
      return res.status(400).json({ success: false, message: 'Task due date cannot be after project end date' });
    }
    if (startDate && dueDate && new Date(dueDate) < new Date(startDate)) {
      return res.status(400).json({ success: false, message: 'Task due date cannot be before its start date' });
    }


    const code = await generateSequentialCode('task', 'TSK');
    const task = await Task.create({
      code,
      project: project._id,
      name,
      description,
      assignedTo,
      priority,
      startDate: startDate || null,
      dueDate: dueDate || null
    });
    return res.status(201).json({ success: true, task });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error creating task', error: error.message });
  }
};

export const listTasks = async (req, res) => {
  try {
    const { projectId } = req.query;
    const filter = {};
    if (projectId) filter.project = projectId;
    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name employeeId role')
      .populate('project', 'code name');
    return res.json({ success: true, tasks });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching tasks', error: error.message });
  }
};

export const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name employeeId role')
      .populate('project', 'code name');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    return res.json({ success: true, task });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching task', error: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const updates = req.body;
    const existing = await Task.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Task not found' });
    const project = await Project.findById(existing.project);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    const newStart = updates.startDate || existing.startDate;
    const newDue = updates.dueDate || existing.dueDate;
    if (newStart && project.startDate && new Date(newStart) < new Date(project.startDate)) {
      return res.status(400).json({ success: false, message: 'Task start date cannot be before project start date' });
    }
    if (newDue && project.endDate && new Date(newDue) > new Date(project.endDate)) {
      return res.status(400).json({ success: false, message: 'Task due date cannot be after project end date' });
    }
    if (newStart && newDue && new Date(newDue) < new Date(newStart)) {
      return res.status(400).json({ success: false, message: 'Task due date cannot be before its start date' });
    }
    const task = await Task.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('assignedTo', 'name employeeId role')
      .populate('project', 'code name');
    return res.json({ success: true, task });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error updating task', error: error.message });
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['not-started','in-progress','completed','on-hold'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const task = await Task.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    return res.json({ success: true, task });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error updating task status', error: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    return res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error deleting task', error: error.message });
  }
};
