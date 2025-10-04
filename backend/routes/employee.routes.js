import express from "express";
import { 
  createEmployee, 
  deleteEmployee, 
  getAllEmployees, 
  monthlyPay, 
  exportEmployees,
  listSimpleEmployees,
  getEmployeeDetails
} from "../controller/employee.controller.js";

import { protectedRoutes, authorizeRoles } from "../middleware/auth.middleware.js";

const employeeRoute = express.Router();

// HR only operations
employeeRoute.post("/create", protectedRoutes, authorizeRoles('hr'), createEmployee);
employeeRoute.get("/", protectedRoutes, authorizeRoles('hr'), getAllEmployees);
employeeRoute.delete("/:id", protectedRoutes, authorizeRoles('hr'), deleteEmployee);
employeeRoute.get("/monthly-pay", protectedRoutes, authorizeRoles('hr'), monthlyPay);
employeeRoute.get("/export", protectedRoutes, authorizeRoles('hr'), exportEmployees);
employeeRoute.get('/:id', protectedRoutes, authorizeRoles('hr'), getEmployeeDetails);

// Lightweight list for PM assignment (HR or PM can view)
employeeRoute.get("/simple/list", protectedRoutes, authorizeRoles('hr','pm'), listSimpleEmployees);

export default employeeRoute;
