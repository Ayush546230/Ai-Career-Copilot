const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const { redisClient } = require('./config/redis');


const authRoutes = require('./routes/auth.routes');
const healthRoutes = require('./routes/health.routes');
const studentRoutes = require('./routes/student.routes');
const mentorRoutes = require('./routes/mentor.routes');
const { errorHandler } = require('./middlewares/error.middleware');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (development)
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    });
}


// API Routes

app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api', healthRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error Handler (must be last)
app.use(errorHandler);

// Database Connection
const connectDB = require('./config/db');

// Start Server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();
    await redisClient.connect();
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

    });
};

startServer();

module.exports = app;