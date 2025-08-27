import { queries } from '../../../../lib/database.js';

export default async function handler(req, res) {
  const { userId, quizId } = req.query;
  try {
    if (req.method === 'GET') {
      const attempt = await queries.getUserAttempt(userId, quizId);
      return res.status(200).json({ hasAttempted: !!attempt, attempt: attempt || null });
    }
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('User attempts API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 