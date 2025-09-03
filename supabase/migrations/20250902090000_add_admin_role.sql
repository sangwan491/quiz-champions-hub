-- Add admin role column to users
alter table if exists public.users
  add column if not exists is_admin boolean not null default false;

-- Helpful index
create index if not exists idx_users_is_admin on public.users (is_admin); 