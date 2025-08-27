import { queries } from '../../lib/database.js';

export default async function handler(req, res) {
  const { quizId } = req.query;
  try {
    if (req.method === 'GET') {
      const results = await queries.getQuizResults(quizId);
      return res.status(200).json(results);
    }
    if (req.method === 'DELETE') {
      await queries.clearQuizResults(quizId);
      return res.status(200).json({ message: 'Quiz-specific leaderboard reset successfully' });
    }
    res.setHeader('Allow', ['GET', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('Results by quiz API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 