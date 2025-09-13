-- Consolidate results into quiz_sessions
-- 1) Ensure quiz_sessions has required columns
alter table if exists public.quiz_sessions
  add column if not exists score integer not null default 0,
  add column if not exists time_spent integer not null default 0;

-- 2) Remove redundant created_at (started_at is sufficient)
alter table if exists public.quiz_sessions
  drop column if exists created_at;

-- 3) Replace partial unique index with full uniqueness per user-quiz
-- Drop old partial unique index if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND indexname = 'idx_quiz_sessions_user_quiz_active'
  ) THEN
    execute 'drop index public.idx_quiz_sessions_user_quiz_active';
  END IF;
END $$;

-- Create unique index on (user_id, quiz_id)
create unique index if not exists idx_quiz_sessions_user_quiz_unique
  on public.quiz_sessions(user_id, quiz_id);

-- 4) Drop legacy results table (no longer used)
drop table if exists public.results cascade; 