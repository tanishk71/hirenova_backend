// Load environment variables from .env file
require('dotenv').config(); 

const express = require('express');
const connectDB = require('./config/db');

// Connect to the database
connectDB(); 

const app = express();

// Initialize Express middleware for JSON body parsing
app.use(express.json()); 

// Basic Test Route
app.get('/', (req, res) => {
    res.send('HireNova API is running...');
});

// Define the port (using the one from .env or a default)
const PORT = process.env.PORT || 5000; 

app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`));