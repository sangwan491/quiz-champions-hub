-- Schema overhaul per new requirements
-- 1) Results: remove answers, player_name, total_questions
-- 2) Quizzes: remove is_active and time_per_question; add status, total_time, total_questions
-- 3) Sessions: drop table
-- 4) Questions: make quiz_id an array quiz_ids, difficulty enum, add time, allow negative points

-- Results table changes
alter table if exists public.results
  drop column if exists answers,
  drop column if exists player_name,
  drop column if exists total_questions;

-- Quizzes table changes
alter table if exists public.quizzes
  drop column if exists is_active,
  drop column if exists time_per_question;

-- Add status enum-like constraint
alter table if exists public.quizzes
  add column if not exists status text;

-- Backfill status with 'inactive' where null
update public.quizzes set status = 'inactive' where status is null;

-- Enforce constraint and default
alter table if exists public.quizzes
  alter column status set not null,
  alter column status set default 'inactive',
  add constraint quizzes_status_check check (status in ('active','inactive','completed'));

-- Aggregate columns
alter table if exists public.quizzes
  add column if not exists total_time integer not null default 0,
  add column if not exists total_questions integer not null default 0;

-- Questions table changes
-- Add quiz_ids array
alter table if exists public.questions
  add column if not exists quiz_ids text[] default '{}'::text[];

-- Migrate existing quiz_id values into quiz_ids
update public.questions
set quiz_ids = array[quiz_id]
where quiz_id is not null and (quiz_ids is null or coalesce(array_length(quiz_ids,1),0) = 0);

-- Drop FK and old column
alter table if exists public.questions drop constraint if exists questions_quiz_id_fkey;
alter table if exists public.questions drop column if exists quiz_id;

-- Difficulty enum
do $$ begin
  if not exists (select 1 from pg_type where typname = 'question_difficulty') then
    create type question_difficulty as enum ('easy','medium','hard');
  end if;
end $$;

alter table if exists public.questions
  alter column difficulty type question_difficulty using (
    case lower(coalesce(difficulty::text, 'easy'))
      when 'easy' then 'easy'::question_difficulty
      when 'medium' then 'medium'::question_difficulty
      when 'hard' then 'hard'::question_difficulty
      else 'easy'::question_difficulty
    end
  );

-- Per-question time (seconds)
alter table if exists public.questions
  add column if not exists time integer not null default 30;

-- Ensure points integer (can be negative)
alter table if exists public.questions
  alter column points type integer;

-- Drop sessions table and related index
drop index if exists idx_sessions_quiz_active;
drop table if exists public.sessions;

-- Helper: function to recalculate quiz aggregates based on quiz_ids relationships
create or replace function public.recalculate_quiz_stats(p_quiz_id text)
returns void as $$
declare
  v_total_questions integer;
  v_total_time integer;
begin
  select count(*)::int, coalesce(sum(time),0)::int
  into v_total_questions, v_total_time
  from public.questions q
  where q.quiz_ids @> array[p_quiz_id];

  update public.quizzes
  set total_questions = coalesce(v_total_questions,0),
      total_time = coalesce(v_total_time,0)
  where id = p_quiz_id;
end;
$$ language plpgsql;

-- Triggers to keep aggregates updated
create or replace function public._trigger_recalc_quiz_stats()
returns trigger as $$
begin
  -- For INSERT/UPDATE, recalc for any quiz_ids present
  if (tg_op = 'INSERT' or tg_op = 'UPDATE') then
    if new.quiz_ids is not null then
      perform public.recalculate_quiz_stats(qid) from unnest(new.quiz_ids) as qid;
    end if;
  end if;

  -- For UPDATE, also recalc for any removed quiz_ids
  if (tg_op = 'UPDATE') then
    if old.quiz_ids is not null then
      perform public.recalculate_quiz_stats(qid) from unnest(old.quiz_ids) as qid;
    end if;
  end if;

  -- For DELETE, recalc for any affected quiz_ids
  if (tg_op = 'DELETE') then
    if old.quiz_ids is not null then
      perform public.recalculate_quiz_stats(qid) from unnest(old.quiz_ids) as qid;
    end if;
  end if;

  return null;
end;
$$ language plpgsql;

drop trigger if exists trg_questions_recalc on public.questions;
create trigger trg_questions_recalc
after insert or update or delete on public.questions
for each row execute function public._trigger_recalc_quiz_stats(); 