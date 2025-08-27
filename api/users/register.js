import { queries } from '../../lib/database.js';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const { name, linkedinProfile } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }
      
      // Check if user already exists
      const existingUser = await queries.getUserByName(name);
      if (existingUser) {
        return res.status(200).json(existingUser);
      }
      
      const newUser = {
        id: uuidv4(),
        name,
        linkedinProfile: linkedinProfile || '',
        registeredAt: new Date().toISOString()
      };
      
      await queries.createUser(newUser.id, newUser.name, newUser.linkedinProfile);
      
      res.status(201).json(newUser);
    } 
    else {
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('User registration API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 