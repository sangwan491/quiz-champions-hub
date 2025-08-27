-- Enable useful extensions
create extension if not exists pgcrypto;

-- Users table
create table if not exists public.users (
  id text primary key,
  name text not null,
  linkedin_profile text,
  email text,
  phone text,
  registered_at timestamptz default now()
);

-- Quizzes table
create table if not exists public.quizzes (
  id text primary key,
  title text not null,
  description text,
  time_per_question integer not null,
  is_active boolean default false,
  created_at timestamptz default now()
);

-- Questions table
create table if not exists public.questions (
  id text primary key,
  quiz_id text not null references public.quizzes(id) on delete cascade,
  question text not null,
  options text not null, -- JSON array of options as string
  correct_answer integer not null,
  category text,
  difficulty text,
  points integer default 10
);

-- Sessions table
create table if not exists public.sessions (
  id text primary key,
  quiz_id text not null references public.quizzes(id) on delete cascade,
  is_active boolean default true,
  started_at timestamptz default now(),
  ended_at timestamptz
);

-- Results table
create table if not exists public.results (
  id text primary key,
  user_id text not null references public.users(id) on delete cascade,
  quiz_id text not null references public.quizzes(id) on delete cascade,
  player_name text not null,
  score integer not null,
  total_questions integer not null,
  time_spent integer not null,
  answers text not null, -- JSON array of answers as string
  completed_at timestamptz default now()
);

-- Indexes
create index if not exists idx_sessions_quiz_active on public.sessions(quiz_id, is_active);
create index if not exists idx_results_user_quiz on public.results(user_id, quiz_id);
create index if not exists idx_results_quiz_score on public.results(quiz_id, score desc);
create index if not exists idx_questions_quiz on public.questions(quiz_id);
