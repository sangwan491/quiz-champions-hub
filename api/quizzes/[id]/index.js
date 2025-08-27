import { queries } from '../../../lib/database.js';

export default async function handler(req, res) {
  const { id } = req.query;
  
  try {
    if (req.method === 'PUT') {
      const { title, description, timePerQuestion } = req.body;
      
      const quiz = await queries.getQuizById(id);
      if (!quiz) {
        return res.status(404).json({ error: 'Quiz not found' });
      }
      
      const updates = {};
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (timePerQuestion !== undefined) updates.timePerQuestion = parseInt(timePerQuestion);
      
      await queries.updateQuiz(id, updates);
      
      const updatedQuiz = await queries.getQuizById(id);
      res.status(200).json(updatedQuiz);
    } 
    else if (req.method === 'DELETE') {
      const quiz = await queries.getQuizById(id);
      if (!quiz) {
        return res.status(404).json({ error: 'Quiz not found' });
      }
      
      await queries.deleteQuiz(id);
      res.status(200).json({ message: 'Quiz deleted successfully' });
    } 
    else {
      res.setHeader('Allow', ['PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Quiz API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 