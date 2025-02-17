// Import required packages
import express, { json } from 'express';
import { createConnection } from 'mysql2';
import { compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
require('dotenv').config(); // For loading environment variables

const app = express();
app.use(json()); // Middleware to parse JSON bodies

// Create a MySQL connection
const db = createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Connect to the database
db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the database');
});

// Login route
app.post('/login', async (req, res) => {
    const { phoneNumber, password } = req.body;

    // Query to find the user by username
    db.query('SELECT * FROM users WHERE phone_number = ?', [phoneNumber], async (error, results) => {
        if (error) {
            return res.status(500).send('Database error');
        }
        if (results.length === 0) {
            return res.status(401).send('Invalid username or password');
        }

        const user = results[0];

        // Compare the provided password with the hashed password in the database
        const match = await compare(password, user.password_hash);
        if (match) {
            // Generate a JWT token
            const token = sign({ phonenumber: user.phone_number }, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.json({ token });
        } else {
            res.status(401).send('Invalid phone number or password');
        }
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});