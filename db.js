import { createPool } from 'mysql2/promise';
import dotenv from 'dotenv';


dotenv.config(); // Load environment variables from .env file

const pool = createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});


console.log('Database connected successfully'); // Log message
export default pool;
