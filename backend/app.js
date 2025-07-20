import express from 'express';
import authRouter from './routes/auth.routes.js';

const app = express();

app.use(express.json());


app.use('/api/auth', authRouter);
// http://localhost:3000/api/auth/login
export default app;