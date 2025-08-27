import { queries } from '../../../lib/database.js';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  const { id } = req.query;
  
  try {
    if (req.method === 'POST') {
      const questionData = req.body;
      
      const quiz = await queries.getQuizById(id);
      if (!quiz) {
        return res.status(404).json({ error: 'Quiz not found' });
      }
      
      const newQuestion = {
        id: uuidv4(),
        ...questionData
      };
      
      await queries.addQuestion(
        newQuestion.id,
        id,
        newQuestion.question,
        newQuestion.options,
        newQuestion.correctAnswer,
        newQuestion.category,
        newQuestion.difficulty,
        newQuestion.points
      );
      
      res.status(201).json(newQuestion);
    } 
    else {
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Question API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 