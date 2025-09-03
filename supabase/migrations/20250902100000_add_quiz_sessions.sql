-- Add quiz_sessions table for server-side time tracking
create table if not exists public.quiz_sessions (
  id text primary key,
  user_id text not null references public.users(id) on delete cascade,
  quiz_id text not null references public.quizzes(id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_quiz_sessions_user_quiz on public.quiz_sessions(user_id, quiz_id);
create index if not exists idx_quiz_sessions_active on public.quiz_sessions(is_active, started_at);

-- Unique constraint: one active session per user-quiz pair
create unique index if not exists idx_quiz_sessions_user_quiz_active 
on public.quiz_sessions(user_id, quiz_id) 
where is_active = true; 