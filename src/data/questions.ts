export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer?: number;
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
  scheduledAt?: string; // when set, quiz cannot be started before this time (ISO)
  // Backend now returns questions as IDs only at some endpoints; keep union
  questions: Array<Question | string>;
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

// --- Global 401 handling ---
function handleUnauthorized() {
  try {
    const prev = localStorage.getItem('currentUser');
    auth.clearToken();
    try {
      // Trigger storage listeners for same-tab updates
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'currentUser',
        oldValue: prev,
        newValue: null,
        url: window.location.href
      }));
    } catch {}
    // Custom immediate update event
    window.dispatchEvent(new CustomEvent('userStateChanged'));
  } catch {}
  // Redirect to login/home
  window.location.href = '/';
}

async function fetchJson<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error('Authentication required');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({} as any));
    const message = (err && (err.error || err.message)) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

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
    if (response.status === 401) {
      handleUnauthorized();
      return { isAdmin: false };
    }
    if (!response.ok) {
      return { isAdmin: false };
    }
    return response.json();
  },

  seedAdmin: async (payload?: { name?: string; email?: string; phone?: string; password?: string }): Promise<any> => {
    return fetchJson(`${API_BASE}/admin/seed`, {
      method: 'POST',
      headers: auth.getHeaders(),
      body: JSON.stringify(payload || {}),
    });
  },

  // Quiz management
  getQuizzes: async (): Promise<Quiz[]> => {
    return fetchJson(`${API_BASE}/quizzes`, {
      headers: auth.getHeaders(),
    });
  },

  createQuiz: async (quiz: { title: string; description?: string; questionIds?: string[] }): Promise<Quiz> => {
    return fetchJson(`${API_BASE}/quizzes`, {
      method: 'POST',
      headers: auth.getHeaders(),
      body: JSON.stringify(quiz),
    });
  },

  updateQuiz: async (id: string, quiz: Partial<Pick<Quiz, 'title' | 'description' | 'status' | 'scheduledAt'>>): Promise<Quiz> => {
    return fetchJson(`${API_BASE}/quizzes/${id}`, {
      method: 'PUT',
      headers: auth.getHeaders(),
      body: JSON.stringify(quiz),
    });
  },

  deleteQuiz: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/quizzes/${id}`, {
      method: 'DELETE',
      headers: auth.getHeaders(),
    });
    if (response.status === 401) {
      handleUnauthorized();
      throw new Error('Authentication required');
    }
    if (!response.ok) throw new Error('Failed to delete quiz');
  },

  // Question bank
  getQuestionBank: async (): Promise<Question[]> => {
    return fetchJson(`${API_BASE}/questions`, {
      headers: auth.getHeaders(),
    });
  },

  createQuestion: async (question: Partial<Question> & { quizIds?: string[] }): Promise<Question> => {
    return fetchJson(`${API_BASE}/questions`, {
      method: 'POST',
      headers: auth.getHeaders(),
      body: JSON.stringify(question),
    });
  },

  updateQuestionBank: async (questionId: string, question: Partial<Question> & { quizIds?: string[] }): Promise<Question> => {
    return fetchJson(`${API_BASE}/questions/${questionId}`, {
      method: 'PUT',
      headers: auth.getHeaders(),
      body: JSON.stringify(question),
    });
  },

  attachQuestionToQuiz: async (quizId: string, questionId: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/quizzes/${quizId}/questions/${questionId}/attach`, {
      method: 'POST',
      headers: auth.getHeaders(),
    });
    if (response.status === 401) {
      handleUnauthorized();
      throw new Error('Authentication required');
    }
    if (!response.ok) throw new Error('Failed to attach question');
  },

  detachQuestionFromQuiz: async (quizId: string, questionId: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/quizzes/${quizId}/questions/${questionId}/detach`, {
      method: 'POST',
      headers: auth.getHeaders(),
    });
    if (response.status === 401) {
      handleUnauthorized();
      throw new Error('Authentication required');
    }
    if (!response.ok) throw new Error('Failed to detach question');
  },

  // Question management for creating directly under a quiz
  addQuestion: async (quizId: string, question: Partial<Question>): Promise<Question> => {
    return fetchJson(`${API_BASE}/quizzes/${quizId}/questions`, {
      method: 'POST',
      headers: auth.getHeaders(),
      body: JSON.stringify(question),
    });
  },

  updateQuestion: async (quizId: string, questionId: string, question: Partial<Question>): Promise<Question> => {
    return fetchJson(`${API_BASE}/quizzes/${quizId}/questions/${questionId}`, {
      method: 'PUT',
      headers: auth.getHeaders(),
      body: JSON.stringify(question),
    });
  },

  deleteQuestion: async (quizId: string, questionId: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/quizzes/${quizId}/questions/${questionId}`, {
      method: 'DELETE',
      headers: auth.getHeaders(),
    });
    if (response.status === 401) {
      handleUnauthorized();
      throw new Error('Authentication required');
    }
    if (!response.ok) throw new Error('Failed to delete question');
  },

  // Results
  getResults: async (): Promise<QuizResult[]> => {
    return fetchJson(`${API_BASE}/results`, {
      headers: auth.getHeaders(),
    });
  },

  getQuizResults: async (quizId: string): Promise<QuizResult[]> => {
    return fetchJson(`${API_BASE}/results/${quizId}`, {
      headers: auth.getHeaders(),
    });
  },

  // New: Combined quizzes (active + completed) for the user with attempt info
  getUserQuizzes: async (userId: string): Promise<Array<Pick<Quiz, 'id' | 'title' | 'description' | 'status' | 'totalTime' | 'totalQuestions' | 'createdAt' | 'scheduledAt'> & { hasAttempted: boolean }>> => {
    return fetchJson(`${API_BASE}/user/${userId}/quizzes`, {
      headers: auth.getHeaders(),
    });
  },

  checkUserAttempt: async (userId: string, quizId: string): Promise<{ hasAttempted: boolean; attempt: QuizResult | null }> => {
    return fetchJson(`${API_BASE}/user/${userId}/attempts/${quizId}`, {
      headers: auth.getHeaders(),
    });
  },

  submitResult: async (result: { userId: string; quizId: string; score?: number; totalQuestions?: number; answers?: Array<{ questionId: string; selectedAnswer: number | null }> }): Promise<QuizResult> => {
    return fetchJson(`${API_BASE}/results`, {
      method: 'POST',
      headers: auth.getHeaders(),
      body: JSON.stringify(result),
    });
  },

  resetLeaderboard: async (): Promise<void> => {
    const response = await fetch(`${API_BASE}/results`, {
      method: 'DELETE',
      headers: auth.getHeaders(),
    });
    if (response.status === 401) {
      handleUnauthorized();
      throw new Error('Authentication required');
    }
    if (!response.ok) throw new Error('Failed to reset leaderboard');
  },

  resetQuizLeaderboard: async (quizId: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/results/${quizId}`, {
      method: 'DELETE',
      headers: auth.getHeaders(),
    });
    if (response.status === 401) {
      handleUnauthorized();
      throw new Error('Authentication required');
    }
    if (!response.ok) throw new Error('Failed to reset quiz leaderboard');
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
    return fetchJson(`${API_BASE}/quiz/${quizId}/start`, {
      method: 'POST',
      headers: auth.getHeaders(),
    });
  },
};

// Client-side shuffle helpers for answers (keep deterministic mapping for grading)
export type ShuffledQuiz = Quiz & { shuffleMap: Array<{ questionId: string; optionIndexMap: number[] }>; questionOrder: string[] };

export function shuffleQuizForClient(quiz: Quiz): ShuffledQuiz {
  const questionOrder = [...quiz.questions.map(q => (typeof q === 'string' ? q : q.id))];
  // Shuffle questions
  for (let i = questionOrder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questionOrder[i], questionOrder[j]] = [questionOrder[j], questionOrder[i]];
  }
  const idToQuestion = new Map(quiz.questions.map(q => [typeof q === 'string' ? q : q.id, q] as const));

  const shuffledQuestions: Question[] = [];
  const shuffleMap: Array<{ questionId: string; optionIndexMap: number[] }> = [];

  for (const qid of questionOrder) {
    const qObj = idToQuestion.get(qid)!;
    const q = typeof qObj === 'string' ? undefined : qObj;
    if (!q) continue;
    const optionIndexMap = q.options.map((_, idx) => idx);
    // Shuffle options
    for (let i = optionIndexMap.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [optionIndexMap[i], optionIndexMap[j]] = [optionIndexMap[j], optionIndexMap[i]];
    }
    const shuffledOptions = optionIndexMap.map(idx => q.options[idx]);
    shuffledQuestions.push({ ...q, options: shuffledOptions });
    shuffleMap.push({ questionId: typeof q === 'string' ? q : q.id, optionIndexMap });
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
    positivePoints: 10,
    negativePoints: 2,
    time: 30,
  },
  {
    id: "2",
    question: "Which programming language was created by Brendan Eich?",
    options: ["Python", "JavaScript", "Java", "C++"],
    correctAnswer: 1,
    positivePoints: 10,
    negativePoints: 2,
    time: 30,
  },
];

export const sampleLeaderboard: QuizResult[] = [];