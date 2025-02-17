import express from 'express';
import { pool } from './config/mysqlConfig.js';

const router = express.Router();

/**
 * Advanced Search API
 * Supports filtering by skill category, budget range, location, and date
 */
router.get('/search', async (req, res) => {
  const { query, skillCategory, budgetMin, budgetMax, location, datePosted } = req.query;

  let sql = `
    SELECT * FROM task
    WHERE 1=1
  `;
  const params = [];

  if (query) {
    sql += ` AND (title LIKE ? OR description LIKE ?)`;
    params.push(`%${query}%`, `%${query}%`);
  }

  if (skillCategory) {
    sql += ` AND skill_category = ?`;
    params.push(skillCategory);
  }

  if (budgetMin) {
    sql += ` AND budget_min >= ?`;
    params.push(budgetMin);
  }

  if (budgetMax) {
    sql += ` AND budget_max <= ?`;
    params.push(budgetMax);
  }

  if (location) {
    sql += ` AND location = ?`;
    params.push(location);
  }

  if (datePosted) {
    sql += ` AND created_at >= ?`;
    params.push(datePosted);
  }

  try {
    const [results] = await pool.query(sql, params);
    res.json(results);
  } catch (error) {
    console.error('Error performing search:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

export default router;
