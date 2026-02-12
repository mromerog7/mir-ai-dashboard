-- Insert missing profiles from auth.users into public.profiles
insert into public.profiles (id, email, full_name, role, status)
select 
  id, 
  email, 
  coalesce(raw_user_meta_data->>'full_name', email), 
  'user', -- default role
  'active' -- default status
from auth.users
where id not in (select id from public.profiles);

-- Verify the result
select * from public.profiles;
