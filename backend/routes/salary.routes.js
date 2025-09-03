// routes/salaryRoutes.js
import express from "express";
import { updateEmployeeSalary } from "../controller/employee.controller.js"; 
// 👆 must match your file name exactly

const router = express.Router();

// PUT: Update employee salary
router.put("/:id/salary", updateEmployeeSalary);

export default router;
