-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    linkedin_profile TEXT,
    registered_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    time_per_question INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Questions table (normalized from embedded questions in quizzes)
CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- Using JSONB for efficiency
    correct_answer INTEGER NOT NULL,
    category TEXT,
    difficulty TEXT,
    points INTEGER DEFAULT 10,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMPTZ,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

-- Results table
CREATE TABLE IF NOT EXISTS results (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    quiz_id TEXT NOT NULL,
    player_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    time_spent INTEGER NOT NULL,
    answers JSONB NOT NULL, -- Using JSONB for efficiency
    completed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_quiz_active ON sessions(quiz_id, is_active);
CREATE INDEX IF NOT EXISTS idx_results_user_quiz ON results(user_id, quiz_id);
CREATE INDEX IF NOT EXISTS idx_results_quiz_score ON results(quiz_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_questions_quiz ON questions(quiz_id); 
