-- Drop is_active; active status is derived from timestamps and quiz time window
alter table if exists public.quiz_sessions
  drop column if exists is_active;

-- Remove indexes that referenced is_active (if any)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND indexname = 'idx_quiz_sessions_active'
  ) THEN
    execute 'drop index public.idx_quiz_sessions_active';
  END IF;
END $$; 