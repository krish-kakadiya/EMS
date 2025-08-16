import express from "express";
import { login, logout, me } from "../controller/auth.controller.js";
import { protectedRoutes } from "../middleware/auth.middleware.js";

const authRouter = express.Router();


// authRouter.post('/create-admin', loginAdmin);
authRouter.post('/login',login)
authRouter.get('/me', protectedRoutes, me);
authRouter.post('/logout',logout);

export default authRouter;
