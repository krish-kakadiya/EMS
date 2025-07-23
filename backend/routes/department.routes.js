import express from "express";
import { createDepartment, deleteDepartment, getAllDepartments } from "../controller/department.controller.js";

const departmentRouter = express.Router();

// all departments
departmentRouter.get("/", getAllDepartments);
departmentRouter.post("/create-department",createDepartment);
departmentRouter.post("/delete-department",deleteDepartment);


export default departmentRouter;