import express from 'express';
import authRouter from './routes/auth.routes.js';
import cookieParser from 'cookie-parser';
import employeeRoute from './routes/employee.routes.js';
import cors from 'cors';
import adminRouter from './routes/admin.routes.js';
import leaveRoute from './routes/leave.routes.js';
import salaryRoutes from './routes/salary.routes.js';
import seedRouter from './routes/seed.routes.js';
import projectRoutes from './routes/project.routes.js';
import taskRoutes from './routes/task.routes.js';
import helmet from 'helmet';
import morgan from 'morgan';

const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Dynamic CORS origin allowlist via env (comma-separated) else fallback
const rawOrigins = process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174';
const allowedOrigins = rawOrigins.split(',').map(o => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    // Allow mobile apps / curl (no origin)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));



app.use('/api/auth', authRouter);
app.use('/api/employees', employeeRoute);
app.use('/api/admin',adminRouter);
app.use('/api/leaves',leaveRoute);
app.use("/api/employees", salaryRoutes);
app.use("/api/seed", seedRouter);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

// Health check endpoint
app.get('/health', (req,res)=> res.json({ status: 'ok', time: Date.now() }));

// Not found
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ success: false, message: 'CORS blocked this origin' });
  }
  res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' });
});
// http://localhost:3000/api/auth
// http://localhost:3000/api/departments
// http://localhost:3000/api/employees
export default app;