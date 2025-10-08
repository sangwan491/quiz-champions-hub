-- Add scheduled_at to quizzes for future scheduling; include helpful indexes

alter table if exists public.quizzes
  add column if not exists scheduled_at timestamptz;

-- Indexes to speed up queries filtering by status and schedule time
create index if not exists idx_quizzes_status on public.quizzes(status);
create index if not exists idx_quizzes_scheduled_at on public.quizzes(scheduled_at);

-- Note: No end time; admins can toggle status to inactivate quizzes


