import express from 'express';
import { protectedRoutes, authorizeRoles } from '../middleware/auth.middleware.js';
import { createProject, listProjects, getProject, updateProject, updateProjectStatus, deleteProject, updateProjectTeam } from '../controller/project.controller.js';

const router = express.Router();

// Create project (HR or PM)
router.post('/', protectedRoutes, authorizeRoles('hr','pm'), createProject);
// List projects (HR sees all, PM sees own)
router.get('/', protectedRoutes, authorizeRoles('hr','pm'), listProjects);
router.get('/:id', protectedRoutes, authorizeRoles('hr','pm'), getProject);
router.put('/:id', protectedRoutes, authorizeRoles('hr','pm'), updateProject);
router.patch('/:id/status', protectedRoutes, authorizeRoles('hr','pm'), updateProjectStatus);
router.patch('/:id/team', protectedRoutes, authorizeRoles('hr','pm'), updateProjectTeam);
router.delete('/:id', protectedRoutes, authorizeRoles('hr'), deleteProject);

export default router;
