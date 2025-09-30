import Project from '../model/project.model.js';
import Task from '../model/task.model.js';
import User from '../model/user.model.js';
import { generateSequentialCode } from '../utils/generateCode.js';

// Create project (PM or HR)
export const createProject = async (req, res) => {
  try {
    const { name, client, description, teamMembers = [], startDate, endDate, managerId } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name required' });

    let manager = req.user.id; // default: current user (PM)
    // HR can assign a specific PM as manager
    if (managerId && req.user.role === 'hr') {
      const pmUser = await User.findOne({ _id: managerId, role: 'pm' });
      if (!pmUser) return res.status(400).json({ success: false, message: 'Provided managerId is not a PM' });
      manager = pmUser._id;
    }

    // Validate team members (only existing users, exclude HR) – silent filter
    let validatedTeam = [];
    if (teamMembers.length) {
      const found = await User.find({ _id: { $in: teamMembers }, role: { $ne: 'hr' } }).select('_id');
      validatedTeam = found.map(u => u._id);
    }

    const code = await generateSequentialCode('project', 'PRJ');
    const project = await Project.create({
      code,
      name,
      client,
      description,
      manager,
      teamMembers: validatedTeam,
      startDate: startDate || null,
      endDate: endDate || null
    });
    return res.status(201).json({ success: true, project });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error creating project', error: error.message });
  }
};

export const listProjects = async (req, res) => {
  try {
    const filter = req.user.role === 'pm' ? { manager: req.user.id } : {};
    const projects = await Project.find(filter)
      .populate('manager', 'name employeeId department')
      .populate('teamMembers', 'name employeeId role department');
    return res.json({ success: true, projects });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching projects', error: error.message });
  }
};

export const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('manager', 'name employeeId department')
      .populate('teamMembers', 'name employeeId role department');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    return res.json({ success: true, project });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching project', error: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const updates = req.body;
    const project = await Project.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('manager', 'name employeeId department')
      .populate('teamMembers', 'name employeeId role department');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    return res.json({ success: true, project });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error updating project', error: error.message });
  }
};

export const updateProjectStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending','in-progress','completed','on-hold'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const project = await Project.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    return res.json({ success: true, project });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error updating status', error: error.message });
  }
};

// Update project team members (HR or project manager)
export const updateProjectTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { teamMembers = [] } = req.body;

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    if (!(req.user.role === 'hr' || project.manager.toString() === req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not allowed to modify team' });
    }

    const members = await User.find({ _id: { $in: teamMembers }, role: { $ne: 'hr' } }).select('_id');
    project.teamMembers = members.map(m => m._id);
    await project.save();

    const populated = await Project.findById(id)
      .populate('manager', 'name employeeId department')
      .populate('teamMembers', 'name employeeId role department');

    return res.json({ success: true, project: populated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error updating team', error: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    await Task.deleteMany({ project: project._id });
    return res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error deleting project', error: error.message });
  }
};
