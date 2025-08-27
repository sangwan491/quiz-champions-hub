import { queries } from '../../lib/database.js';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const quizzes = await queries.getAllQuizzes();
      res.status(200).json(quizzes);
    } 
    else if (req.method === 'POST') {
      const { title, description, timePerQuestion } = req.body;
      
      if (!title || !timePerQuestion) {
        return res.status(400).json({ error: 'Title and time per question are required' });
      }
      
      const newQuiz = {
        id: uuidv4(),
        title,
        description: description || '',
        timePerQuestion: parseInt(timePerQuestion),
        isActive: false,
        createdAt: new Date().toISOString(),
        questions: []
      };
      
      await queries.createQuiz(newQuiz.id, newQuiz.title, newQuiz.description, newQuiz.timePerQuestion);
      res.status(201).json(newQuiz);
    } 
    else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Quiz API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 