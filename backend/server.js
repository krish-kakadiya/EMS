import dotenv from 'dotenv';
dotenv.config();
import app from "./app.js";
import connectDB from './config/db.js';

const port = process.env.PORT || 4000;

const startServer = async () =>{
    try {
        await connectDB();
        console.log('Connected to MongoDB');

        app.listen(port,()=>{
            console.log(`Server is running on: http://localhost:${port}`);
        });

    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}

startServer();


