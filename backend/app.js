import express from 'express';
import authRouter from './routes/auth.routes.js';
import departmentRouter from './routes/department.routes.js';
import cookieParser from 'cookie-parser';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.use('/api/auth', authRouter);

app.use('/api/departments', departmentRouter);
// http://localhost:3000/api/auth/login
// http://localhost:3000/api/departments
export default app;