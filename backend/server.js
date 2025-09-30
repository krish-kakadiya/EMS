import dotenv from 'dotenv';
dotenv.config();
import app from "./app.js";
import connectDB from './config/db.js';

const port = process.env.PORT || 3000; // Align with frontend axios baseURL

const startServer = async () =>{
    try {
        await connectDB();
        console.log('Connected to MongoDB');

        const server = app.listen(port,()=>{
            console.log(`Server is running on: http://localhost:${port}`);
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


