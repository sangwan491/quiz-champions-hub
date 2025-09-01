-- Add email column if not exists
alter table if exists public.users
  add column if not exists email text;

-- Normalize whitespace
update public.users set linkedin_profile = btrim(linkedin_profile) where linkedin_profile is not null;
update public.users set phone = btrim(phone) where phone is not null;
update public.users set email = lower(btrim(email)) where email is not null;

-- Deduplicate linkedin_profile (keep earliest registered)
with ranked as (
  select id,
         row_number() over (partition by linkedin_profile order by registered_at asc, id asc) as rn
  from public.users
  where linkedin_profile is not null and btrim(linkedin_profile) <> ''
)
update public.users u
set linkedin_profile = null
from ranked r
where u.id = r.id and r.rn > 1;

-- Deduplicate phone (keep earliest)
with ranked_phone as (
  select id,
         row_number() over (partition by phone order by registered_at asc, id asc) as rn
  from public.users
  where phone is not null and btrim(phone) <> ''
)
update public.users u
set phone = null
from ranked_phone r
where u.id = r.id and r.rn > 1;

-- Deduplicate email (keep earliest)
with ranked_email as (
  select id,
         row_number() over (partition by email order by registered_at asc, id asc) as rn
  from public.users
  where email is not null and btrim(email) <> ''
)
update public.users u
set email = null
from ranked_email r
where u.id = r.id and r.rn > 1;

-- Unique indexes allowing nulls
create unique index if not exists users_phone_unique on public.users (phone) where phone is not null and btrim(phone) <> '';
create unique index if not exists users_email_unique on public.users (email) where email is not null and btrim(email) <> '';
create unique index if not exists users_linkedin_unique on public.users (linkedin_profile) where linkedin_profile is not null and btrim(linkedin_profile) <> ''; 