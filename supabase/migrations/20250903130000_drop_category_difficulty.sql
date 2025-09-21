-- Drop category and difficulty columns from questions
alter table if exists public.questions
  drop column if exists category,
  drop column if exists difficulty; 