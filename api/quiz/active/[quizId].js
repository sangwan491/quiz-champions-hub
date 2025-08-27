import { queries } from '../../../lib/database.js';

export default async function handler(req, res) {
  const { quizId } = req.query;
  try {
    if (req.method === 'GET') {
      const activeSession = await queries.getActiveSession(quizId);
      if (!activeSession) {
        return res.status(404).json({ error: 'No active session for this quiz' });
      }
      const quiz = await queries.getQuizById(quizId);
      if (!quiz) {
        return res.status(404).json({ error: 'Quiz not found' });
      }
      return res.status(200).json({ ...quiz, sessionId: activeSession.id });
    }
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('Active quiz detail API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 