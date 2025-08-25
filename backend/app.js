import express from 'express';
import authRouter from './routes/auth.routes.js';
import cookieParser from 'cookie-parser';
import employeeRoute from './routes/employee.routes.js';
import cors from 'cors';
import adminRouter from './routes/admin.routes.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: ['http://localhost:5173','http://localhost:5174'],
  credentials: true
}));



app.use('/api/auth', authRouter);
app.use('/api/employees', employeeRoute);
app.use('/api/admin',adminRouter)
// http://localhost:3000/api/auth
// http://localhost:3000/api/departments
// http://localhost:3000/api/employees
export default app;