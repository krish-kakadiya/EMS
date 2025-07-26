import express from "express";
import { createEmployee, deleteEmployee, getAllEmployees } from "../controller/employee.controller.js";
import { adminRoutes, protectedRoutes } from "../middleware/auth.middleware.js";

const employeeRoute = express.Router();

employeeRoute.post("/create",protectedRoutes,adminRoutes,createEmployee);
employeeRoute.get("/",protectedRoutes,adminRoutes,getAllEmployees);
employeeRoute.delete("/:id", protectedRoutes, adminRoutes, deleteEmployee);

export default employeeRoute;
