import { queries } from '../../lib/database.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const activeSessions = await queries.getAllActiveSessions();
      
      if (activeSessions.length === 0) {
        return res.status(404).json({ error: 'No active quiz sessions' });
      }
      
      const activeQuizzes = [];
      for (const session of activeSessions) {
        const quiz = await queries.getQuizById(session.quiz_id);
        if (quiz) {
          activeQuizzes.push({ ...quiz, sessionId: session.id });
        }
      }
      
      if (activeQuizzes.length === 0) {
        return res.status(404).json({ error: 'Active quiz not found' });
      }
      
      res.status(200).json(activeQuizzes);
    } 
    else {
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Active quiz API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 