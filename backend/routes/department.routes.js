import express from "express";
import { createDepartment, getAllDepartments } from "../controller/department.controller.js";

const departmentRouter = express.Router();

// all departments
departmentRouter.get("/", getAllDepartments);
departmentRouter.post("/create-department",createDepartment);


export default departmentRouter;