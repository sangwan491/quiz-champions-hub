-- Seed a default admin user if none exists
-- Requires pgcrypto extension for digest/encode/gen_random_uuid
insert into public.users (id, name, linkedin_profile, email, phone, password_hash, is_password_set, is_admin, registered_at)
select gen_random_uuid(), 'Administrator', null, 'admin', '+10000000001', encode(digest('Admin@12345', 'sha256'), 'hex'), true, true, now()
where not exists (
  select 1 from public.users where is_admin = true limit 1
); 