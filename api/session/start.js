import { queries } from '../../lib/database.js';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const { quizId } = req.body;
      
      if (!quizId) {
        return res.status(400).json({ error: 'Quiz ID is required' });
      }
      
      const quiz = await queries.getQuizById(quizId);
      if (!quiz) {
        return res.status(404).json({ error: 'Quiz not found' });
      }
      
      // Check if there's already an active session for this quiz
      const existingSession = await queries.getActiveSession(quizId);
      if (existingSession) {
        return res.status(200).json(existingSession);
      }
      
      const newSession = {
        id: uuidv4(),
        quizId: quizId,
        isActive: true,
        startedAt: new Date().toISOString(),
        endedAt: null
      };
      
      await queries.createSession(newSession.id, newSession.quizId);
      res.status(200).json(newSession);
    } 
    else {
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Session start API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 