export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
}

export interface QuizResult {
  id: string;
  playerName: string;
  score: number;
  totalQuestions: number;
  completedAt: Date;
  timeSpent: number; // in seconds
}

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
  },
  {
    id: "3",
    question: "What is the largest planet in our solar system?",
    options: ["Earth", "Mars", "Jupiter", "Saturn"],
    correctAnswer: 2,
    category: "Science",
    difficulty: "easy",
    points: 10
  },
  {
    id: "4",
    question: "Who painted 'The Starry Night'?",
    options: ["Pablo Picasso", "Vincent van Gogh", "Leonardo da Vinci", "Claude Monet"],
    correctAnswer: 1,
    category: "Art",
    difficulty: "medium",
    points: 20
  },
  {
    id: "5",
    question: "What is the time complexity of binary search?",
    options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
    correctAnswer: 1,
    category: "Computer Science",
    difficulty: "hard",
    points: 30
  },
  {
    id: "6",
    question: "Which element has the chemical symbol 'Au'?",
    options: ["Silver", "Gold", "Aluminum", "Argon"],
    correctAnswer: 1,
    category: "Science",
    difficulty: "medium",
    points: 20
  },
  {
    id: "7",
    question: "In which year did World War II end?",
    options: ["1944", "1945", "1946", "1947"],
    correctAnswer: 1,
    category: "History",
    difficulty: "easy",
    points: 10
  },
  {
    id: "8",
    question: "What is the derivative of x²?",
    options: ["x", "2x", "x²", "2"],
    correctAnswer: 1,
    category: "Mathematics",
    difficulty: "medium",
    points: 20
  }
];

export const sampleLeaderboard: QuizResult[] = [
  {
    id: "1",
    playerName: "Alice Wonder",
    score: 180,
    totalQuestions: 8,
    completedAt: new Date("2024-01-15T10:30:00"),
    timeSpent: 120
  },
  {
    id: "2",
    playerName: "Bob Smith",
    score: 160,
    totalQuestions: 8,
    completedAt: new Date("2024-01-15T09:45:00"),
    timeSpent: 95
  },
  {
    id: "3",
    playerName: "Charlie Brown",
    score: 140,
    totalQuestions: 8,
    completedAt: new Date("2024-01-14T16:20:00"),
    timeSpent: 110
  },
  {
    id: "4",
    playerName: "Diana Prince",
    score: 130,
    totalQuestions: 8,
    completedAt: new Date("2024-01-14T14:15:00"),
    timeSpent: 105
  },
  {
    id: "5",
    playerName: "Eve Adams",
    score: 120,
    totalQuestions: 8,
    completedAt: new Date("2024-01-13T11:00:00"),
    timeSpent: 130
  }
];