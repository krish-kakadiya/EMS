import dotenv from 'dotenv';
dotenv.config();
import app from "./app.js";
import { Server as SocketIOServer } from 'socket.io';
import connectDB from './config/db.js';

const port = process.env.PORT || 3000; // Align with frontend axios baseURL

const startServer = async () =>{
    try {
        await connectDB();
        console.log('Connected to MongoDB');

        const server = app.listen(port,()=>{
            console.log(`Server is running on: http://localhost:${port}`);
        });

        // Socket.IO setup
        const io = new SocketIOServer(server, {
            cors: {
                origin: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',').map(o=>o.trim()),
                credentials: true
            }
        });
        app.set('io', io); // make io accessible in controllers via req.app.get('io')

        io.on('connection', (socket) => {
            // Optional: join room by project or user future usage
            socket.on('joinProject', (projectId) => {
                if (projectId) socket.join(`project:${projectId}`);
            });
            socket.on('joinUser', (userId) => {
                if (userId) socket.join(`user:${userId}`);
            });
        });

        const shutdown = (signal) => {
            console.log(`\n${signal} received. Closing server...`);
            server.close(() => {
                console.log('HTTP server closed.');
                process.exit(0);
            });
            // Force exit if not closed in 10s
            setTimeout(()=> process.exit(1), 10000).unref();
        };
        ['SIGINT','SIGTERM'].forEach(sig => process.on(sig, () => shutdown(sig)));

    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}

startServer();


