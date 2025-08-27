import { queries } from '../../lib/database.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      await queries.stopAllSessions();
      return res.status(200).json({ message: 'All sessions stopped' });
    }
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('Session stop-all API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 