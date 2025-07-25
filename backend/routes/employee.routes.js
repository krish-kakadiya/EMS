import express from "express";
import createEmployee from "../controller/employee.controller.js";

const employeeRoute = express.Router();

employeeRoute.post("/create", createEmployee);

export default employeeRoute;
