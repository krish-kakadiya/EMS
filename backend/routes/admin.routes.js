import express from "express";
import { createSuperAdmin } from "../controller/admin.controller.js";

const adminRouter = express.Router();

adminRouter.post("/create-super-admin",createSuperAdmin)

export default adminRouter;