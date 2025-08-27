import { queries } from '../../../../lib/database.js';

export default async function handler(req, res) {
  const { id, questionId } = req.query;
  try {
    if (req.method === 'PUT') {
      const updates = req.body || {};
      await queries.updateQuestion(questionId, updates);
      return res.status(200).json({ id: questionId, ...updates });
    }
    if (req.method === 'DELETE') {
      await queries.deleteQuestion(questionId);
      return res.status(200).json({ message: 'Question deleted successfully' });
    }
    res.setHeader('Allow', ['PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('Question detail API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 