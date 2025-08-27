import { queries } from '../../lib/database.js';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const results = await queries.getAllResults();
      res.status(200).json(results);
    } 
    else if (req.method === 'POST') {
      const { userId, quizId, score, totalQuestions, timeSpent, answers } = req.body;
      
      const user = await queries.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Check if user has already attempted this quiz
      const existingAttempt = await queries.getUserAttempt(userId, quizId);
      if (existingAttempt) {
        return res.status(400).json({ error: 'User has already attempted this quiz' });
      }
      
      // Verify the session is still active (time validation)
      const activeSession = await queries.getActiveSession(quizId);
      if (!activeSession) {
        return res.status(400).json({ error: 'Quiz session has ended or is not active' });
      }
      
      const newResult = {
        id: uuidv4(),
        userId,
        quizId,
        playerName: user.name,
        score,
        totalQuestions,
        timeSpent,
        answers,
        completedAt: new Date().toISOString()
      };
      
      await queries.createResult(
        newResult.id,
        newResult.userId,
        newResult.quizId,
        newResult.playerName,
        newResult.score,
        newResult.totalQuestions,
        newResult.timeSpent,
        newResult.answers
      );
      
      res.status(201).json(newResult);
    } 
    else if (req.method === 'DELETE') {
      await queries.clearResults();
      res.status(200).json({ message: 'All leaderboards reset successfully' });
    } 
    else {
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Results API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 