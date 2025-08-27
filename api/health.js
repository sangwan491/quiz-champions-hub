import { db } from '../lib/database.js';

export default async function handler(req, res) {
  try {
    // A simple query to confirm the database is reachable
    await db.query('SELECT 1');
    res.status(200).json({ status: 'ok', message: 'Database connection is healthy' });
  } catch (error) {
    console.error('Health check database error:', error);
    // Return a detailed error message only in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Database connection failed';
      
    res.status(500).json({ 
      status: 'error', 
      message: errorMessage,
    });
  }
} 