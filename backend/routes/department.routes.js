import express from "express";
import { createDepartment, deleteDepartment, getAllDepartments } from "../controller/department.controller.js";
import { adminRoutes, protectedRoutes } from "../middleware/auth.middleware.js";

const departmentRouter = express.Router();

// all departments
departmentRouter.get("/",protectedRoutes,adminRoutes,getAllDepartments);
departmentRouter.post("/create-department",protectedRoutes,adminRoutes,createDepartment);
departmentRouter.post("/delete-department",protectedRoutes,adminRoutes,deleteDepartment);

export default departmentRouter;