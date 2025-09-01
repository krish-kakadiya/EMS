import express from "express";
import { 
  createEmployee, 
  deleteEmployee, 
  getAllEmployees, 
  monthlyPay, 
  exportEmployees   // ✅ import new controller
} from "../controller/employee.controller.js";

import { adminRoutes, protectedRoutes } from "../middleware/auth.middleware.js";

const employeeRoute = express.Router();

employeeRoute.post("/create", protectedRoutes, adminRoutes, createEmployee);
employeeRoute.get("/", protectedRoutes, adminRoutes, getAllEmployees);
employeeRoute.delete("/:id", protectedRoutes, adminRoutes, deleteEmployee);
employeeRoute.get("/monthly-pay", protectedRoutes, adminRoutes, monthlyPay);

// ✅ New route for Excel export
employeeRoute.get("/export", protectedRoutes, adminRoutes, exportEmployees);

export default employeeRoute;
