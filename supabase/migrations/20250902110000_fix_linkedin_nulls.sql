-- Fix LinkedIn profile empty strings to NULL for unique constraint
-- Convert empty strings and whitespace-only strings to NULL
update public.users 
set linkedin_profile = null 
where linkedin_profile is not null 
  and trim(linkedin_profile) = '';

-- Also handle any existing duplicate empty strings by keeping only the first one
with ranked_empty as (
  select id, 
         row_number() over (partition by linkedin_profile order by registered_at asc, id asc) as rn
  from public.users 
  where linkedin_profile = ''
)
update public.users u
set linkedin_profile = null
from ranked_empty r
where u.id = r.id and r.rn > 1; 