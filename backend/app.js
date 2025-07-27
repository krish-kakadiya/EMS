import express from 'express';
import authRouter from './routes/auth.routes.js';
import departmentRouter from './routes/department.routes.js';
import cookieParser from 'cookie-parser';
import employeeRoute from './routes/employee.routes.js';
import cors from 'cors';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));



app.use('/api/auth', authRouter);

app.use('/api/departments', departmentRouter);
app.use('/api/employees', employeeRoute);
// http://localhost:3000/api/auth
// http://localhost:3000/api/departments
// http://localhost:3000/api/employees
export default app;