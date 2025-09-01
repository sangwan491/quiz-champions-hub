-- Ensure columns exist
alter table if exists public.users
  add column if not exists email text,
  add column if not exists phone text;

-- Unique constraints (partial) to allow nulls
create unique index if not exists users_phone_unique on public.users (phone) where phone is not null;
create unique index if not exists users_email_unique on public.users (lower(email)) where email is not null;
-- linkedin unique index is added in a later migration after cleanup 