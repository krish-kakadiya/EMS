import express from "express";
import createAdmin from "../controller/auth.controller.js";

const authRouter = express.Router();


authRouter.post('/create-admin',createAdmin);

export default authRouter;
