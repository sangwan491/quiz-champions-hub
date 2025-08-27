import { queries } from '../../lib/database.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const activeSessions = await queries.getAllActiveSessions();
      return res.status(200).json(activeSessions);
    }
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('Active sessions API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 