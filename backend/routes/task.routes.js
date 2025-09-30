import express from 'express';
import { protectedRoutes, authorizeRoles } from '../middleware/auth.middleware.js';
import { createTask, listTasks, getTask, updateTask, updateTaskStatus, deleteTask } from '../controller/task.controller.js';

const router = express.Router();

// Create task (PM or HR)
router.post('/', protectedRoutes, authorizeRoles('hr','pm'), createTask);
// List tasks (HR, PM). Optional filter by projectId
router.get('/', protectedRoutes, authorizeRoles('hr','pm'), listTasks);
router.get('/:id', protectedRoutes, authorizeRoles('hr','pm'), getTask);
router.put('/:id', protectedRoutes, authorizeRoles('hr','pm'), updateTask);
router.patch('/:id/status', protectedRoutes, authorizeRoles('hr','pm'), updateTaskStatus);
router.delete('/:id', protectedRoutes, authorizeRoles('hr','pm'), deleteTask);

export default router;
