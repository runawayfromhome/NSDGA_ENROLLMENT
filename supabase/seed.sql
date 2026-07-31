-- ============================================================================
-- NSDGA — seed the 5 demo accounts directly (bypasses email confirmation).
-- Run this in the Supabase SQL Editor AFTER schema.sql has been run.
-- Safe to re-run: it deletes and recreates the 5 demo accounts.
--
-- NOTE: `demo_password` stores the plain-text password so you can see the demo
-- logins during development. This is NOT for production — drop the column before
-- going live:  alter table public.profiles drop column demo_password;
-- ============================================================================

-- 0a. dev-only column to view passwords
alter table public.profiles add column if not exists demo_password text;

-- 0b. FIX: allow the SQL editor / service context (auth.uid() is null) and
-- HeadAdmin to change role/status. (The original trigger blocked the promote.)
create or replace function public.enforce_profile_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_headadmin() then
    return new;
  end if;
  if new.role is distinct from old.role then raise exception 'Not allowed to change role'; end if;
  if new.disabled is distinct from old.disabled then raise exception 'Not allowed to change disabled'; end if;
  if new.status is distinct from old.status then
    if not (old.status = 'pending_profile' and new.status = 'pending_verification') then
      raise exception 'Not allowed to change status';
    end if;
  end if;
  return new;
end;
$$;

-- 0c. SECURITY FIX: never trust a client-supplied role at signup. New users
-- always start as an unverified 'registrar'; HeadAdmin sets the real role.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, role, status)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', new.email),
          'registrar', 'pending_profile')
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 1. Create the 5 demo users (auth.users + identity), then set their profile.
do $$
declare
  r   record;
  uid uuid;
begin
  for r in
    select * from (values
      ('headadmin@nsdgamarikina.edu.ph',         'Head@123',      'System Head Administrator', 'headadmin', 'verified'),
      ('registrar@nsdgamarikina.edu.ph',         'Registrar@123', 'Maria Santos',              'registrar', 'verified'),
      ('registrar.pending@nsdgamarikina.edu.ph', 'Registrar@123', 'Pedro Cruz',                'registrar', 'pending_profile'),
      ('admin@nsdgamarikina.edu.ph',             'Admin@123',     'Jose Dela Cruz',            'admin',     'verified'),
      ('admin.pending@nsdgamarikina.edu.ph',     'Admin@123',     'Liza Gomez',                'admin',     'pending_profile')
    ) as t(email, password, name, role, status)
  loop
    delete from public.profiles where email = r.email;
    delete from auth.users     where email = r.email;

    uid := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      r.email, crypt(r.password, gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', jsonb_build_object('name', r.name),
      now(), now(), '', '', '', ''
    );

    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), uid, uid::text,
      jsonb_build_object('sub', uid::text, 'email', r.email), 'email', now(), now(), now()
    );

    -- handle_new_user() already inserted a default profile row; finalise it:
    update public.profiles
      set name = r.name, role = r.role, status = r.status, demo_password = r.password,
          verified_at = case when r.status = 'verified' then now() end
      where id = uid;
  end loop;
end $$;

-- 2. Give the two VERIFIED staff a filled-in profile (so My Profile shows data)
update public.profiles set profile = $j$
{"firstName":"Maria","middleName":"L.","lastName":"Santos","sex":"Female","dob":"1988-06-12","civilStatus":"Married","nationality":"Filipino","mobile":"0917-555-0123","secondaryEmail":"","address":"12 Bayan-bayanan Ave, Marikina City","emergencyName":"Ramon Santos","emergencyNumber":"0917-555-9000","employeeId":"2024-00892","position":"School Registrar","department":"Office of the Registrar","dateHired":"2015-08-15","employmentType":"Full-time","supervisor":"","education":"Bachelor of Science in Education","course":"BSED","prcLicense":"0912345","certifications":"","photo":""}
$j$::jsonb
where email = 'registrar@nsdgamarikina.edu.ph';

update public.profiles set profile = $j$
{"firstName":"Jose","middleName":"P.","lastName":"Dela Cruz","sex":"Male","dob":"1985-03-22","civilStatus":"Single","nationality":"Filipino","mobile":"0918-444-2211","secondaryEmail":"","address":"45 J.P. Rizal St, Marikina City","emergencyName":"Ana Dela Cruz","emergencyNumber":"0918-444-0000","employeeId":"2024-00450","position":"Website Administrator","department":"Administration Office","dateHired":"2016-01-10","employmentType":"Full-time","supervisor":"","education":"Bachelor of Science in Information Technology","course":"BSIT","prcLicense":"","certifications":"","photo":""}
$j$::jsonb
where email = 'admin@nsdgamarikina.edu.ph';

-- 3. See the result (incl. the visible demo passwords)
select email, name, role, status, disabled, demo_password
from public.profiles
order by role, status, email;
