import express from 'express';

const app = express();


app.use(express.json());

app.get('/',(req,res)=>{
    res.send('Welcome to the Employee Management System API');
})

export default app;