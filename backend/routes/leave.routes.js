import express from "express"
import { adminRoutes, protectedRoutes } from "../middleware/auth.middleware.js";
import { applyLeave, deleteLeave, getAllLeaves, getMyLeaves, updateLeave, updateLeaveStatus } from "../controller/leave.controller.js";

const leaveRoute = express.Router();

leaveRoute.post("/apply", protectedRoutes, applyLeave);           
leaveRoute.get("/my-leaves", protectedRoutes, getMyLeaves);       
leaveRoute.put("/:id", protectedRoutes, updateLeave);             
leaveRoute.delete("/:id", protectedRoutes, deleteLeave);          


leaveRoute.get("/all", protectedRoutes, adminRoutes, getAllLeaves);       
leaveRoute.put("/:id/status", protectedRoutes, adminRoutes, updateLeaveStatus); 

export default leaveRoute;