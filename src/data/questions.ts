export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  time_per_question: number; // in seconds
  isActive: boolean;
  createdAt: string;
  questions: Question[];
  sessionId?: string; // Added for active quizzes
}

export interface User {
  id: string;
  name: string;
  linkedinProfile: string;
  email?: string;
  phone?: string;
  registeredAt: string;
}

export interface QuizSession {
  id: string;
  quizId: string;
  isActive: boolean;
  startedAt: string | null;
  endedAt: string | null;
}

export interface QuizResult {
  id: string;
  userId: string;
  quizId: string;
  playerName: string;
  score: number;
  totalQuestions: number;
  completedAt: string;
  timeSpent: number; // in seconds
  answers?: any[];
}

// API service functions
const API_BASE = 'https://tddkqotjksbqxzdtsygc.functions.supabase.co/api';

export const api = {
  // Quiz management
  getQuizzes: async (): Promise<Quiz[]> => {
    const response = await fetch(`${API_BASE}/quizzes`);
    return response.json();
  },

  createQuiz: async (quiz: Partial<Quiz>): Promise<Quiz> => {
    const response = await fetch(`${API_BASE}/quizzes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quiz),
    });
    return response.json();
  },

  updateQuiz: async (id: string, quiz: Partial<Quiz>): Promise<Quiz> => {
    const response = await fetch(`${API_BASE}/quizzes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quiz),
    });
    return response.json();
  },

  deleteQuiz: async (id: string): Promise<void> => {
    await fetch(`${API_BASE}/quizzes/${id}`, {
      method: 'DELETE',
    });
  },

  // Question management
  addQuestion: async (quizId: string, question: Partial<Question>): Promise<Question> => {
    const response = await fetch(`${API_BASE}/quizzes/${quizId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(question),
    });
    return response.json();
  },

  updateQuestion: async (quizId: string, questionId: string, question: Partial<Question>): Promise<Question> => {
    const response = await fetch(`${API_BASE}/quizzes/${quizId}/questions/${questionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(question),
    });
    return response.json();
  },

  deleteQuestion: async (quizId: string, questionId: string): Promise<void> => {
    await fetch(`${API_BASE}/quizzes/${quizId}/questions/${questionId}`, {
      method: 'DELETE',
    });
  },

  // Session management
  getSessions: async (): Promise<QuizSession[]> => {
    const response = await fetch(`${API_BASE}/session`);
    return response.json();
  },

  getActiveSessions: async (): Promise<QuizSession[]> => {
    const response = await fetch(`${API_BASE}/sessions/active`);
    return response.json();
  },

  startSession: async (quizId: string): Promise<QuizSession> => {
    const response = await fetch(`${API_BASE}/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId }),
    });
    return response.json();
  },

  stopSession: async (quizId: string): Promise<QuizSession> => {
    const response = await fetch(`${API_BASE}/session/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId }),
    });
    return response.json();
  },

  stopAllSessions: async (): Promise<{ message: string; stoppedCount: number }> => {
    const response = await fetch(`${API_BASE}/session/stop-all`, {
      method: 'POST',
    });
    return response.json();
  },

  // User management
  registerUser: async (user: { name: string; linkedinProfile?: string; email?: string; phone?: string }): Promise<User> => {
    const response = await fetch(`${API_BASE}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    return response.json();
  },

  // Results
  getResults: async (): Promise<QuizResult[]> => {
    const response = await fetch(`${API_BASE}/results`);
    return response.json();
  },

  getQuizResults: async (quizId: string): Promise<QuizResult[]> => {
    const response = await fetch(`${API_BASE}/results/${quizId}`);
    return response.json();
  },

  checkUserAttempt: async (userId: string, quizId: string): Promise<{ hasAttempted: boolean; attempt: QuizResult | null }> => {
    const response = await fetch(`${API_BASE}/user/${userId}/attempts/${quizId}`);
    return response.json();
  },

  submitResult: async (result: Partial<QuizResult>): Promise<QuizResult> => {
    const response = await fetch(`${API_BASE}/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    });
    return response.json();
  },

  resetLeaderboard: async (): Promise<void> => {
    await fetch(`${API_BASE}/results`, {
      method: 'DELETE',
    });
  },

  resetQuizLeaderboard: async (quizId: string): Promise<void> => {
    await fetch(`${API_BASE}/results/${quizId}`, {
      method: 'DELETE',
    });
  },

  // Get active quiz for players
  getActiveQuizzes: async (): Promise<Quiz[]> => {
    const response = await fetch(`${API_BASE}/quiz/active`);
    if (!response.ok) {
      throw new Error('No active quizzes');
    }
    return response.json();
  },

  getActiveQuiz: async (quizId: string): Promise<Quiz> => {
    const response = await fetch(`${API_BASE}/quiz/active/${quizId}`);
    if (!response.ok) {
      throw new Error('No active quiz');
    }
    return response.json();
  },
};

// Legacy exports for backward compatibility
export const sampleQuestions: Question[] = [
  {
    id: "1",
    question: "What is the capital of Japan?",
    options: ["Tokyo", "Osaka", "Kyoto", "Hiroshima"],
    correctAnswer: 0,
    category: "Geography",
    difficulty: "easy",
    points: 10
  },
  {
    id: "2",
    question: "Which programming language was created by Brendan Eich?",
    options: ["Python", "JavaScript", "Java", "C++"],
    correctAnswer: 1,
    category: "Technology",
    difficulty: "medium",
    points: 20
  }
];

export const sampleLeaderboard: QuizResult[] = [];