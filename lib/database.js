import { createClient } from '@libsql/client';

// Initialize Turso client (with local fallback)
const databaseUrl = process.env.TURSO_DATABASE_URL || `file:${process.cwd()}/.data/local.db`;
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

const client = createClient({
  url: databaseUrl,
  authToken,
});

// Database utility functions
export const db = {
  // Execute a query that returns results
  async query(sql, params = []) {
    try {
      const result = await client.execute({ sql, args: params });
      return result.rows;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  },

  // Execute a query that doesn't return results (INSERT, UPDATE, DELETE)
  async execute(sql, params = []) {
    try {
      const result = await client.execute({ sql, args: params });
      return result;
    } catch (error) {
      console.error('Database execute error:', error);
      throw error;
    }
  },

  // Get a single row
  async get(sql, params = []) {
    const rows = await this.query(sql, params);
    return rows[0] || null;
  },

  // Get all rows
  async all(sql, params = []) {
    return await this.query(sql, params);
  },

  // Execute multiple statements in a transaction
  async transaction(statements) {
    try {
      const transaction = await client.transaction();
      const results = [];
      
      for (const statement of statements) {
        const result = await transaction.execute(statement);
        results.push(result);
      }
      
      await transaction.commit();
      return results;
    } catch (error) {
      console.error('Transaction error:', error);
      throw error;
    }
  }
};

// Helper functions for common operations
export const queries = {
  // Users
  async createUser(id, name, phone, email, linkedinProfile) {
    return await db.execute(
      'INSERT INTO users (id, name, phone, email, linkedin_profile) VALUES (?, ?, ?, ?, ?)',
      [id, name, phone, email || null, linkedinProfile || null]
    );
  },

  async getUserById(id) {
    return await db.get('SELECT * FROM users WHERE id = ?', [id]);
  },

  async getUserByName(name) {
    return await db.get('SELECT * FROM users WHERE LOWER(name) = LOWER(?)', [name]);
  },

  async getUserByPhone(phone) {
    return await db.get('SELECT * FROM users WHERE phone = ?', [phone]);
  },

  async getUserByEmail(email) {
    return await db.get('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
  },

  async getUserByLinkedIn(linkedinProfile) {
    return await db.get('SELECT * FROM users WHERE linkedin_profile = ?', [linkedinProfile]);
  },

  async getAllUsers() {
    return await db.all('SELECT * FROM users ORDER BY registered_at DESC');
  },

  // Quizzes
  async createQuiz(id, title, description, timePerQuestion) {
    return await db.execute(
      'INSERT INTO quizzes (id, title, description, time_per_question) VALUES (?, ?, ?, ?)',
      [id, title, description || '', timePerQuestion]
    );
  },

  async getQuizById(id) {
    const quiz = await db.get('SELECT * FROM quizzes WHERE id = ?', [id]);
    if (quiz) {
      const questions = await db.all('SELECT * FROM questions WHERE quiz_id = ?', [id]);
      quiz.questions = questions.map(q => ({
        ...q,
        options: JSON.parse(q.options)
      }));
    }
    return quiz;
  },

  async getAllQuizzes() {
    const quizzes = await db.all('SELECT * FROM quizzes ORDER BY created_at DESC');
    for (const quiz of quizzes) {
      const questions = await db.all('SELECT * FROM questions WHERE quiz_id = ?', [quiz.id]);
      quiz.questions = questions.map(q => ({
        ...q,
        options: JSON.parse(q.options)
      }));
    }
    return quizzes;
  },

  async updateQuiz(id, updates) {
    const setParts = [];
    const values = [];
    
    if (updates.title !== undefined) {
      setParts.push('title = ?');
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      setParts.push('description = ?');
      values.push(updates.description);
    }
    if (updates.timePerQuestion !== undefined) {
      setParts.push('time_per_question = ?');
      values.push(updates.timePerQuestion);
    }
    
    values.push(id);
    return await db.execute(
      `UPDATE quizzes SET ${setParts.join(', ')} WHERE id = ?`,
      values
    );
  },

  async deleteQuiz(id) {
    return await db.execute('DELETE FROM quizzes WHERE id = ?', [id]);
  },

  // Questions
  async addQuestion(id, quizId, question, options, correctAnswer, category, difficulty, points) {
    return await db.execute(
      'INSERT INTO questions (id, quiz_id, question, options, correct_answer, category, difficulty, points) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, quizId, question, JSON.stringify(options), correctAnswer, category, difficulty, points]
    );
  },

  async updateQuestion(id, updates) {
    const setParts = [];
    const values = [];
    
    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'options') {
        setParts.push('options = ?');
        values.push(JSON.stringify(value));
      } else if (key === 'correctAnswer') {
        setParts.push('correct_answer = ?');
        values.push(value);
      } else {
        setParts.push(`${key} = ?`);
        values.push(value);
      }
    });
    
    values.push(id);
    return await db.execute(
      `UPDATE questions SET ${setParts.join(', ')} WHERE id = ?`,
      values
    );
  },

  async deleteQuestion(id) {
    return await db.execute('DELETE FROM questions WHERE id = ?', [id]);
  },

  // Sessions
  async createSession(id, quizId) {
    return await db.execute(
      'INSERT INTO sessions (id, quiz_id) VALUES (?, ?)',
      [id, quizId]
    );
  },

  async getActiveSession(quizId) {
    return await db.get(
      'SELECT * FROM sessions WHERE quiz_id = ? AND is_active = TRUE',
      [quizId]
    );
  },

  async getAllActiveSessions() {
    return await db.all('SELECT * FROM sessions WHERE is_active = TRUE');
  },

  async stopSession(quizId) {
    return await db.execute(
      'UPDATE sessions SET is_active = FALSE, ended_at = CURRENT_TIMESTAMP WHERE quiz_id = ? AND is_active = TRUE',
      [quizId]
    );
  },

  async stopAllSessions() {
    return await db.execute(
      'UPDATE sessions SET is_active = FALSE, ended_at = CURRENT_TIMESTAMP WHERE is_active = TRUE'
    );
  },

  // Results
  async createResult(id, userId, quizId, playerName, score, totalQuestions, timeSpent, answers) {
    return await db.execute(
      'INSERT INTO results (id, user_id, quiz_id, player_name, score, total_questions, time_spent, answers) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, userId, quizId, playerName, score, totalQuestions, timeSpent, JSON.stringify(answers)]
    );
  },

  async getUserAttempt(userId, quizId) {
    const result = await db.get(
      'SELECT * FROM results WHERE user_id = ? AND quiz_id = ?',
      [userId, quizId]
    );
    if (result) {
      result.answers = JSON.parse(result.answers);
    }
    return result;
  },

  async getQuizResults(quizId) {
    const results = await db.all(
      'SELECT * FROM results WHERE quiz_id = ? ORDER BY score DESC, time_spent ASC',
      [quizId]
    );
    return results.map(result => ({
      ...result,
      answers: JSON.parse(result.answers)
    }));
  },

  async getAllResults() {
    const results = await db.all('SELECT * FROM results ORDER BY completed_at DESC');
    return results.map(result => ({
      ...result,
      answers: JSON.parse(result.answers)
    }));
  },

  async clearResults() {
    return await db.execute('DELETE FROM results');
  },

  async clearQuizResults(quizId) {
    return await db.execute('DELETE FROM results WHERE quiz_id = ?', [quizId]);
  }
}; 