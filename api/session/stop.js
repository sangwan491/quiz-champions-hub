import { queries } from '../../lib/database.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const { quizId } = req.body;
      if (!quizId) {
        return res.status(400).json({ error: 'Quiz ID is required' });
      }
      await queries.stopSession(quizId);
      return res.status(200).json({ message: 'Session stopped' });
    }
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('Session stop API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 