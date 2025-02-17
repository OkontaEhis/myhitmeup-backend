import { hash } from 'bcryptjs';
import express, { json } from 'express';
const app = express();
import { createConnection } from 'mysql2';
app.use(json());

// Database connection
const db = createConnection({
    host: 'localhost',
    user: 'ehijesumuan',
    password: 'Ohis2005',
    database: 'hitmeup_marketplace_db'
});

// Connect to the database
db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the database');
});

app.post('/register', async (req, res) => {
    const { firstname, lastname, phoneNumber, password, user_type, email} = req.body;
    const password_hash = await hash(password, 10);
    users.push({ phoneNumber, password: hashedPassword });
    res.status(201).
    db.query('INSERT INTO users (first_name, last_name, phone_number, password_hash, user_type, email) VALUES (?, ?, ?, ?, ?, ?)', [firstname, lastname, phoneNumber, password_hash, user_type, email], (error, results) => {
        if (error) {
            return res.status(500).send('Error registering user');
        }
        res.status(201).send('User  registered successfully');
    });
});