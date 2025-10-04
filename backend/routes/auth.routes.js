import express from "express";
import { login, logout, me, changePassword } from "../controller/auth.controller.js";
import { protectedRoutes } from "../middleware/auth.middleware.js";
import { sendResetCode, verifyResetCode } from '../controller/forgot.controller.js';

const authRouter = express.Router();


// authRouter.post('/create-admin', loginAdmin);
authRouter.post('/login',login)
authRouter.get('/me', protectedRoutes, me);
authRouter.post('/logout',logout);
authRouter.post('/send-reset-code', sendResetCode);
authRouter.post('/verify-reset-code', verifyResetCode);
authRouter.post('/change-password', protectedRoutes, changePassword);

export default authRouter;
