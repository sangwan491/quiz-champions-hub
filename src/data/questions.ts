export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer?: number;
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
  phone?: string; // admin-only (optional)
}

// API service functions (results endpoints are backed by quiz_sessions on the server)
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

  // Admin endpoints
  getAdminStatus: async (): Promise<{ isAdmin: boolean; user?: User }> => {
    const response = await fetch(`${API_BASE}/admin/me`, {
      headers: auth.getHeaders(),
    });
    if (!response.ok) {
      return { isAdmin: false };
    }
    return response.json();
  },

  seedAdmin: async (payload?: { name?: string; email?: string; phone?: string; password?: string }): Promise<any> => {
    const response = await fetch(`${API_BASE}/admin/seed`, {
      method: 'POST',
      headers: auth.getHeaders(),
      body: JSON.stringify(payload || {}),
    });
    return response.json();
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
    const response = await fetch(`${API_BASE}/results`, {
      headers: auth.getHeaders(),
    });
    return response.json();
  },

  getQuizResults: async (quizId: string): Promise<QuizResult[]> => {
    const response = await fetch(`${API_BASE}/results/${quizId}`, {
      headers: auth.getHeaders(),
    });
    return response.json();
  },

  // New: Combined quizzes (active + completed) for the user with attempt info
  getUserQuizzes: async (userId: string): Promise<Array<Pick<Quiz, 'id' | 'title' | 'description' | 'status' | 'totalTime' | 'totalQuestions' | 'createdAt'> & { hasAttempted: boolean }>> => {
    const response = await fetch(`${API_BASE}/user/${userId}/quizzes`, {
      headers: auth.getHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch user quizzes');
    }
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

  submitResult: async (result: { userId: string; quizId: string; score?: number; totalQuestions?: number; answers?: Array<{ questionId: string; selectedAnswer: number | null }> }): Promise<QuizResult> => {
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
    const response = await fetch(`${API_BASE}/quizzes/active`);
    if (!response.ok) {
      throw new Error('No active quizzes');
    }
    return response.json();
  },

  // Removed getActiveQuiz in favor of startQuiz returning quiz payload
  // getActiveQuiz: async (quizId: string): Promise<Quiz> => { ... }

  // Start quiz session (server-side timing) and get quiz payload
  startQuiz: async (quizId: string): Promise<{ sessionId: string; startedAt: string; message: string; quiz: Quiz }> => {
    const response = await fetch(`${API_BASE}/quiz/${quizId}/start`, {
      method: 'POST',
      headers: auth.getHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const message = err?.error || `Failed to start quiz (${response.status})`;
      throw new Error(message);
    }
    return response.json();
  },
};

// Client-side shuffle helpers for answers (keep deterministic mapping for grading)
export type ShuffledQuiz = Quiz & { shuffleMap: Array<{ questionId: string; optionIndexMap: number[] }>; questionOrder: string[] };

export function shuffleQuizForClient(quiz: Quiz): ShuffledQuiz {
  const questionOrder = [...quiz.questions.map(q => q.id)];
  // Shuffle questions
  for (let i = questionOrder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questionOrder[i], questionOrder[j]] = [questionOrder[j], questionOrder[i]];
  }
  const idToQuestion = new Map(quiz.questions.map(q => [q.id, q] as const));

  const shuffledQuestions: Question[] = [];
  const shuffleMap: Array<{ questionId: string; optionIndexMap: number[] }> = [];

  for (const qid of questionOrder) {
    const q = idToQuestion.get(qid)!;
    const optionIndexMap = q.options.map((_, idx) => idx);
    // Shuffle options
    for (let i = optionIndexMap.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [optionIndexMap[i], optionIndexMap[j]] = [optionIndexMap[j], optionIndexMap[i]];
    }
    const shuffledOptions = optionIndexMap.map(idx => q.options[idx]);
    shuffledQuestions.push({ ...q, options: shuffledOptions });
    shuffleMap.push({ questionId: q.id, optionIndexMap });
  }

  return {
    ...quiz,
    questions: shuffledQuestions,
    shuffleMap,
    questionOrder,
  };
}

export function deshuffleAnswersForServer(
  shuffled: ShuffledQuiz,
  answers: Array<{ questionId: string; selectedAnswer: number | null }>
): Array<{ questionId: string; selectedAnswer: number | null }> {
  const mapById = new Map(shuffled.shuffleMap.map(m => [m.questionId, m] as const));
  return answers.map(a => {
    if (a.selectedAnswer === null || a.selectedAnswer === undefined) return a;
    const m = mapById.get(a.questionId);
    if (!m) return a;
    const originalIndex = m.optionIndexMap[a.selectedAnswer] ?? a.selectedAnswer;
    return { questionId: a.questionId, selectedAnswer: originalIndex };
  });
}

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