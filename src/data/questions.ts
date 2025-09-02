export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  positivePoints: number; // points awarded for correct answer
  negativePoints: number; // points deducted for incorrect answer
  time: number; // per-question time in seconds
  quizIds?: string[]; // question bank relationships
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'inactive' | 'completed';
  totalTime: number; // aggregate of question times
  totalQuestions: number; // aggregate of attached questions
  createdAt: string;
  questions: Question[];
}

export interface User {
  id: string;
  name: string;
  linkedinProfile: string;
  email?: string;
  phone?: string;
  registeredAt: string;
  isPasswordSet?: boolean;
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
}

// API service functions
const API_BASE = 'https://tddkqotjksbqxzdtsygc.functions.supabase.co/api';

// Auth token management
let authToken: string | null = null;

export const auth = {
  setToken: (token: string) => {
    authToken = token;
    localStorage.setItem('authToken', token);
  },
  
  getToken: (): string | null => {
    if (!authToken) {
      authToken = localStorage.getItem('authToken');
    }
    return authToken;
  },
  
  clearToken: () => {
    authToken = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
  },
  
  getHeaders: () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = auth.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }
};

export const api = {
  // Auth endpoints
  registerUser: async (user: { name: string; linkedinProfile?: string; email?: string; phone: string }): Promise<User> => {
    const response = await fetch(`${API_BASE}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const message = err?.error || `Registration failed (${response.status})`;
      throw new Error(message);
    }
    return response.json();
  },

  setPassword: async (userId: string, password: string): Promise<{ token: string; user: User }> => {
    const response = await fetch(`${API_BASE}/users/set-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, password }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const message = err?.error || `Failed to set password (${response.status})`;
      throw new Error(message);
    }
    const result = await response.json();
    auth.setToken(result.token);
    return result;
  },

  login: async (phone: string, password: string): Promise<{ token: string; user: User }> => {
    const response = await fetch(`${API_BASE}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const message = err?.error || `Login failed (${response.status})`;
      throw new Error(message);
    }
    const result = await response.json();
    auth.setToken(result.token);
    return result;
  },

  // Quiz management
  getQuizzes: async (): Promise<Quiz[]> => {
    const response = await fetch(`${API_BASE}/quizzes`);
    return response.json();
  },

  createQuiz: async (quiz: { title: string; description?: string; questionIds?: string[] }): Promise<Quiz> => {
    const response = await fetch(`${API_BASE}/quizzes`, {
      method: 'POST',
      headers: auth.getHeaders(),
      body: JSON.stringify(quiz),
    });
    return response.json();
  },

  updateQuiz: async (id: string, quiz: Partial<Pick<Quiz, 'title' | 'description' | 'status'>>): Promise<Quiz> => {
    const response = await fetch(`${API_BASE}/quizzes/${id}`, {
      method: 'PUT',
      headers: auth.getHeaders(),
      body: JSON.stringify(quiz),
    });
    return response.json();
  },

  deleteQuiz: async (id: string): Promise<void> => {
    await fetch(`${API_BASE}/quizzes/${id}`, {
      method: 'DELETE',
      headers: auth.getHeaders(),
    });
  },

  // Question bank
  getQuestionBank: async (): Promise<Question[]> => {
    const response = await fetch(`${API_BASE}/questions`);
    return response.json();
  },

  createQuestion: async (question: Partial<Question> & { quizIds?: string[] }): Promise<Question> => {
    const response = await fetch(`${API_BASE}/questions`, {
      method: 'POST',
      headers: auth.getHeaders(),
      body: JSON.stringify(question),
    });
    return response.json();
  },

  updateQuestionBank: async (questionId: string, question: Partial<Question> & { quizIds?: string[] }): Promise<Question> => {
    const response = await fetch(`${API_BASE}/questions/${questionId}`, {
      method: 'PUT',
      headers: auth.getHeaders(),
      body: JSON.stringify(question),
    });
    return response.json();
  },

  attachQuestionToQuiz: async (quizId: string, questionId: string): Promise<void> => {
    await fetch(`${API_BASE}/quizzes/${quizId}/questions/${questionId}/attach`, {
      method: 'POST',
      headers: auth.getHeaders(),
    });
  },

  detachQuestionFromQuiz: async (quizId: string, questionId: string): Promise<void> => {
    await fetch(`${API_BASE}/quizzes/${quizId}/questions/${questionId}/detach`, {
      method: 'POST',
      headers: auth.getHeaders(),
    });
  },

  // Question management for creating directly under a quiz
  addQuestion: async (quizId: string, question: Partial<Question>): Promise<Question> => {
    const response = await fetch(`${API_BASE}/quizzes/${quizId}/questions`, {
      method: 'POST',
      headers: auth.getHeaders(),
      body: JSON.stringify(question),
    });
    return response.json();
  },

  updateQuestion: async (quizId: string, questionId: string, question: Partial<Question>): Promise<Question> => {
    const response = await fetch(`${API_BASE}/quizzes/${quizId}/questions/${questionId}`, {
      method: 'PUT',
      headers: auth.getHeaders(),
      body: JSON.stringify(question),
    });
    return response.json();
  },

  deleteQuestion: async (quizId: string, questionId: string): Promise<void> => {
    await fetch(`${API_BASE}/quizzes/${quizId}/questions/${questionId}`, {
      method: 'DELETE',
      headers: auth.getHeaders(),
    });
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
    const response = await fetch(`${API_BASE}/user/${userId}/attempts/${quizId}`, {
      headers: auth.getHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to check user attempt');
    }
    return response.json();
  },

  submitResult: async (result: { userId: string; quizId: string; score: number; totalQuestions: number; timeSpent: number }): Promise<QuizResult> => {
    const response = await fetch(`${API_BASE}/results`, {
      method: 'POST',
      headers: auth.getHeaders(),
      body: JSON.stringify(result),
    });
    if (!response.ok) {
      throw new Error('Failed to submit result');
    }
    return response.json();
  },

  resetLeaderboard: async (): Promise<void> => {
    await fetch(`${API_BASE}/results`, {
      method: 'DELETE',
      headers: auth.getHeaders(),
    });
  },

  resetQuizLeaderboard: async (quizId: string): Promise<void> => {
    await fetch(`${API_BASE}/results/${quizId}`, {
      method: 'DELETE',
      headers: auth.getHeaders(),
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
    positivePoints: 10,
    negativePoints: 2,
    time: 30,
  },
  {
    id: "2",
    question: "Which programming language was created by Brendan Eich?",
    options: ["Python", "JavaScript", "Java", "C++"],
    correctAnswer: 1,
    category: "Technology",
    difficulty: "medium",
    positivePoints: 20,
    negativePoints: 5,
    time: 30,
  }
];

export const sampleLeaderboard: QuizResult[] = [];