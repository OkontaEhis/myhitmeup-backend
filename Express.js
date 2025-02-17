import express from 'express';

const app = express();
app.use(express.json()); // Middleware to parse JSON

export default app; // Export the app instance