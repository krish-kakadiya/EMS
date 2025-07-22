import express from "express";
import { getAllDepartments } from "../controller/department.controller.js";

const departmentRouter = express.Router();

// all departments
departmentRouter.get("/", getAllDepartments);


export default departmentRouter;