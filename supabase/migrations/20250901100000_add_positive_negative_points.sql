-- Add positive and negative points fields to questions
alter table if exists public.questions
  add column if not exists positive_points integer not null default 10,
  add column if not exists negative_points integer not null default 0;

-- Migrate existing points data
update public.questions
set positive_points = case when points > 0 then points else 10 end,
    negative_points = case when points < 0 then abs(points) else 0 end
where points is not null;

-- Drop old points column
alter table if exists public.questions
  drop column if exists points; 