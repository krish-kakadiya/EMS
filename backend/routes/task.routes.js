import express from 'express';
import { protectedRoutes, authorizeRoles } from '../middleware/auth.middleware.js';
import { createTask, listTasks, getTask, updateTask, updateTaskStatus, deleteTask, listMyTasks, employeeUpdateTaskStatus } from '../controller/task.controller.js';

// Simple ObjectId format validator middleware
const validateId = (req, res, next) => {
	const { id } = req.params;
	if (!/^[0-9a-fA-F]{24}$/.test(id)) {
		return res.status(400).json({ success:false, message:'Invalid task id format' });
	}
	next();
};

const router = express.Router();

// Employee-specific MUST come before any dynamic :id route to avoid conflict
router.get('/me/my-tasks', protectedRoutes, listMyTasks);
router.patch('/me/:id/status', protectedRoutes, employeeUpdateTaskStatus);

// Create task (PM or HR)
router.post('/', protectedRoutes, authorizeRoles('hr','pm'), createTask);
// List tasks (HR, PM). Optional filter by projectId
router.get('/', protectedRoutes, authorizeRoles('hr','pm'), listTasks);
// ID routes with explicit validator to avoid matching 'me'
router.get('/:id', protectedRoutes, authorizeRoles('hr','pm'), validateId, getTask);
router.put('/:id', protectedRoutes, authorizeRoles('hr','pm'), validateId, updateTask);
router.patch('/:id/status', protectedRoutes, authorizeRoles('hr','pm'), validateId, updateTaskStatus);
router.delete('/:id', protectedRoutes, authorizeRoles('hr','pm'), validateId, deleteTask);

export default router;
