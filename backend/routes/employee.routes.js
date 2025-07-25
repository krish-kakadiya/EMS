import express from "express";
import createEmployee from "../controller/employee.controller.js";
import { adminRoutes, protectedRoutes } from "../middleware/auth.middleware.js";

const employeeRoute = express.Router();

employeeRoute.post("/create",protectedRoutes,adminRoutes,createEmployee);

export default employeeRoute;
