import { queries } from '../../lib/database.js';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const { name, phone, email, linkedinProfile } = req.body;
      
      if (!name || !phone) {
        return res.status(400).json({ error: 'Name and phone are required' });
      }

      // Enforce uniqueness checks
      const existingByPhone = await queries.getUserByPhone(phone);
      if (existingByPhone) {
        return res.status(409).json({ error: 'Phone already registered' });
      }

      if (email) {
        const existingByEmail = await queries.getUserByEmail(email);
        if (existingByEmail) {
          return res.status(409).json({ error: 'Email already registered' });
        }
      }

      if (linkedinProfile) {
        const existingByLinkedIn = await queries.getUserByLinkedIn(linkedinProfile);
        if (existingByLinkedIn) {
          return res.status(409).json({ error: 'LinkedIn profile already registered' });
        }
      }
      
      const newUser = {
        id: uuidv4(),
        name,
        phone,
        email: email || null,
        linkedinProfile: linkedinProfile || null,
        registeredAt: new Date().toISOString()
      };
      
      await queries.createUser(newUser.id, newUser.name, newUser.phone, newUser.email, newUser.linkedinProfile);
      
      res.status(201).json(newUser);
    } 
    else {
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('User registration API error:', error);
    // Handle constraint violations gracefully
    if (String(error.message || '').includes('UNIQUE')) {
      return res.status(409).json({ error: 'Unique constraint violation' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
} 