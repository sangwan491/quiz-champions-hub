import { db } from '../../lib/database.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const sessions = await db.all('SELECT * FROM sessions ORDER BY started_at DESC');
      return res.status(200).json(sessions);
    }
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('Sessions list API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 