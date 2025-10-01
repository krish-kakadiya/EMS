// routes/salaryRoutes.js
import express from "express";
import { updateEmployeeSalary } from "../controller/employee.controller.js"; 
import { protectedRoutes, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

// PUT: Update employee salary (HR only)
router.put("/:id/salary", protectedRoutes, authorizeRoles('hr'), updateEmployeeSalary);

export default router;
