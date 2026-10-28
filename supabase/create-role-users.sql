-- NSDGA Enrollment - create one test account for every application role
--
-- Run this in Supabase Dashboard -> SQL Editor after the migrations have been
-- applied. Replace every CHANGE_ME password before running this script.
--
-- This script:
--   * creates one verified account for headadmin, registrar, admin, and student
--   * creates the matching public.profiles rows through the auth trigger
--   * is safe from accidental overwrites: it stops if an email already exists
--
-- Do not commit real passwords to source control. Change these values only in
-- the SQL Editor, then rotate the passwords after testing.

begin;

do $$
declare
  r record;
  v_id uuid;
  v_existing_count integer;
begin
  -- Edit only the values in this block.
  create temporary table role_users (
    email text not null,
    display_name text not null,
    role_name text not null,
    password text not null
  ) on commit drop;

  insert into role_users (email, display_name, role_name, password) values
    ('headadmin.test@nsdgamarikina.edu.ph', 'Test Head Administrator', 'headadmin', 'CHANGE_ME_HEADADMIN'),
    ('registrar.test@nsdgamarikina.edu.ph', 'Test Registrar', 'registrar', 'CHANGE_ME_REGISTRAR'),
    ('admin.test@nsdgamarikina.edu.ph', 'Test Administrator', 'admin', 'CHANGE_ME_ADMIN'),
    ('student.test@nsdgamarikina.edu.ph', 'Test Student', 'student', 'CHANGE_ME_STUDENT');

  if exists (
    select 1
    from role_users
    where password like 'CHANGE_ME%'
  ) then
    raise exception
      'Replace every CHANGE_ME password in create-role-users.sql before running it';
  end if;

  select count(*)
    into v_existing_count
    from auth.users u
    join role_users r on lower(u.email) = lower(r.email);

  if v_existing_count > 0 then
    raise exception
      'One or more role-user emails already exist; no accounts were changed';
  end if;

  for r in select * from role_users loop
    v_id := gen_random_uuid();

    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_id,
      'authenticated',
      'authenticated',
      lower(r.email),
      extensions.crypt(r.password, extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('name', r.display_name),
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    insert into auth.identities (
      id,
      user_id,
      provider_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) values (
      gen_random_uuid(),
      v_id,
      v_id::text,
      jsonb_build_object('sub', v_id::text, 'email', lower(r.email)),
      'email',
      now(),
      now(),
      now()
    );

    -- handle_new_user() creates this row with the default student role.
    update public.profiles
       set name = r.display_name,
           role = r.role_name,
           status = 'verified',
           verified_at = now()
     where id = v_id;
  end loop;
end
$$;

commit;

select u.email, p.name, p.role, p.status, p.disabled
from auth.users u
join public.profiles p on p.id = u.id
where u.email in (
  'headadmin.test@nsdgamarikina.edu.ph',
  'registrar.test@nsdgamarikina.edu.ph',
  'admin.test@nsdgamarikina.edu.ph',
  'student.test@nsdgamarikina.edu.ph'
)
order by p.role;
