-- Add authentication fields to users table
alter table if exists public.users
  add column if not exists password_hash text,
  add column if not exists is_password_set boolean default false,
  add column if not exists last_login timestamptz;

-- Create auth sessions table for token management
create table if not exists public.auth_sessions (
  id text primary key,
  user_id text not null references public.users(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  last_used_at timestamptz default now()
);

-- Index for session lookups
create index if not exists idx_auth_sessions_token on public.auth_sessions(token_hash);
create index if not exists idx_auth_sessions_user on public.auth_sessions(user_id);
create index if not exists idx_auth_sessions_expires on public.auth_sessions(expires_at);

-- Clean up expired sessions function
create or replace function cleanup_expired_sessions()
returns void as $$
begin
  delete from public.auth_sessions where expires_at < now();
end;
$$ language plpgsql; 