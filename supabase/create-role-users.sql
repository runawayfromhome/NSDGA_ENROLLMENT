-- NSDGA Enrollment - create one test account for every application role
--
-- Run this in Supabase Dashboard -> SQL Editor after the migrations have been
-- applied. Rotate or delete these accounts after testing.
--
-- Do not commit the filled-in passwords to source control.

begin;

do $$
declare
  v_row record;
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
    ('headadmin.test@nsdgamarikina.edu.ph', 'Test Head Administrator', 'headadmin', 'Tst!H3adAdm1n-2026'),
    ('registrar.test@nsdgamarikina.edu.ph', 'Test Registrar',          'registrar', 'Tst!R3g1strar-2026'),
    ('admin.test@nsdgamarikina.edu.ph',     'Test Administrator',      'admin',     'Tst!Adm1n-2026'),
    ('student.test@nsdgamarikina.edu.ph',   'Test Student',            'student',   'Tst!Stud3nt-2026');

  if exists (
    select 1
    from role_users
    where password like 'CHANGE_ME%'
  ) then
    raise exception
      'Replace every CHANGE_ME password in create-role-users.sql before running it';
  end if;

  if exists (
    select 1
    from role_users
    where length(password) < 12
  ) then
    raise exception
      'Every test password must be at least 12 characters';
  end if;

  select count(*)
    into v_existing_count
    from auth.users u
    join role_users ru on lower(u.email) = lower(ru.email);

  if v_existing_count > 0 then
    raise exception
      'One or more role-user emails already exist; no accounts were changed';
  end if;

  for v_row in select * from role_users loop
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
      lower(v_row.email),
      crypt(v_row.password, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('name', v_row.display_name),
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
      jsonb_build_object('sub', v_id::text, 'email', lower(v_row.email)),
      'email',
      now(),
      now(),
      now()
    );

    -- handle_new_user() creates this row with the default student role.
    update public.profiles
       set name = v_row.display_name,
           role = v_row.role_name,
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