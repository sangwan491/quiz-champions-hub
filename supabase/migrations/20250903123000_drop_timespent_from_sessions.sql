-- Drop time_spent column; compute duration from timestamps instead
alter table if exists public.quiz_sessions
  drop column if exists time_spent;

-- Update any dependent indexes that referenced time_spent (none expected)
-- Note: API will compute elapsed seconds as extract(epoch from (completed_at - started_at)) 