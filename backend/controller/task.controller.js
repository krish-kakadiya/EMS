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
    const { status, message } = req.body;
    if (!['not-started','in-progress','completed','on-hold'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    task.status = status;
    if (message) task.lastEmployeeMessage = message;
    task.statusUpdates.push({ by: req.user.id, status, message });
    await task.save();
    // Populate after save so client (PM) sees fresh relations + last message
    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name employeeId role')
      .populate('project', 'code name');
    // Emit real-time event (global and project room if available)
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('taskUpdated', { task: populated });
        if (populated.project?._id) {
          io.to(`project:${populated.project._id}`).emit('taskUpdated', { task: populated });
        }
      }
    } catch (e) {
      console.warn('Socket emit failed', e.message);
    }
    return res.json({ success: true, task: populated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error updating task status', error: error.message });
  }
};

// Employee: list tasks assigned to them
export const listMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user.id })
      .populate('project', 'code name')
      .populate('assignedTo', 'name employeeId');
    return res.json({ success: true, tasks });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching my tasks', error: error.message });
  }
};

// Employee: update status + message for own task
export const employeeUpdateTaskStatus = async (req, res) => {
  try {
    const { status, message } = req.body;
    if (!['not-started','in-progress','completed','on-hold'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (!task.assignedTo.map(id => id.toString()).includes(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized for this task' });
    }
    task.status = status;
    if (message) task.lastEmployeeMessage = message;
    task.statusUpdates.push({ by: req.user.id, status, message });
    await task.save();
    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name employeeId role')
      .populate('project', 'code name');
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('taskUpdated', { task: populated });
        if (populated.project?._id) {
          io.to(`project:${populated.project._id}`).emit('taskUpdated', { task: populated });
        }
      }
    } catch (e) {
      console.warn('Socket emit failed', e.message);
    }
    return res.json({ success: true, task: populated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error updating task status', error: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project','_id code name');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    await task.deleteOne();
    // Emit socket event so PM/others can remove from UI
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('taskDeleted', { taskId: req.params.id });
        if (task.project?._id) io.to(`project:${task.project._id}`).emit('taskDeleted', { taskId: req.params.id });
      }
    } catch (e) { console.warn('Socket emit delete failed', e.message); }
    return res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error deleting task', error: error.message });
  }
};

// Employee self-delete: only allowed if the employee is the sole assignee (avoid orphaning collaborator expectations)
export const employeeDeleteMyTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id).populate('project','_id code name');
    if (!task) return res.status(404).json({ success:false, message:'Task not found' });
    const isAssignee = task.assignedTo.map(x=> x.toString()).includes(req.user.id);
    if (!isAssignee) return res.status(403).json({ success:false, message:'Not authorized for this task' });
    if (task.assignedTo.length > 1) {
      return res.status(400).json({ success:false, message:'Cannot delete a task with multiple assignees' });
    }
    await task.deleteOne();
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('taskDeleted', { taskId: id });
        if (task.project?._id) io.to(`project:${task.project._id}`).emit('taskDeleted', { taskId: id });
      }
    } catch (e) { console.warn('Socket emit delete failed', e.message); }
    return res.json({ success:true, message:'Task deleted' });
  } catch (error) {
    return res.status(500).json({ success:false, message:'Error deleting task', error:error.message });
  }
};

// Employee leave task (unassign self) when there are multiple assignees
export const employeeLeaveTask = async (req, res) => {
  try {
    const { id } = req.params; // task id
    const task = await Task.findById(id).populate('project','_id code name');
    if (!task) return res.status(404).json({ success:false, message:'Task not found' });
    const idx = task.assignedTo.findIndex(x => x.toString() === req.user.id);
    if (idx === -1) return res.status(403).json({ success:false, message:'You are not an assignee of this task' });
    if (task.assignedTo.length === 1) {
      return res.status(400).json({ success:false, message:'Only you are assigned. Use delete instead.' });
    }
    task.assignedTo.splice(idx,1);
    await task.save();
    const populated = await Task.findById(task._id)
      .populate('assignedTo','name employeeId role')
      .populate('project','code name');
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('taskUpdated', { task: populated });
        if (populated.project?._id) io.to(`project:${populated.project._id}`).emit('taskUpdated', { task: populated });
      }
    } catch (e) { console.warn('Socket emit leave failed', e.message); }
    return res.json({ success:true, message:'Left task', task: populated });
  } catch (error) {
    return res.status(500).json({ success:false, message:'Error leaving task', error:error.message });
  }
};
