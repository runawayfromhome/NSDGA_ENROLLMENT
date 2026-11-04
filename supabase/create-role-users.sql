-- NSDGA Enrollment - create/update one test account for every application role
-- Run this in Supabase Dashboard -> SQL Editor.

begin;

do $$
declare
  v_row record;
  v_id uuid;
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
    ('  ', 'Test Registrar',          'registrar', 'Tst!R3g1strar-2026'),
    ('admin.test@nsdgamarikina.edu.ph',     'Test Administrator',      'admin',     'Tst!Adm1n-2026'),
    ('student.test@nsdgamarikina.edu.ph',   'Test Student',            'student',   'Tst!Stud3nt-2026');

  if exists (select 1 from role_users where length(password) < 12) then
    raise exception 'Every test password must be at least 12 characters';
  end if;

  for v_row in select * from role_users loop
    -- Check if the user already exists
    select id into v_id from auth.users where lower(email) = lower(v_row.email);

    if v_id is null then
      -- ==========================================
      -- ACCOUNT DOES NOT EXIST: CREATE NEW
      -- ==========================================
      v_id := gen_random_uuid();

      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change
      ) values (
        '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
        lower(v_row.email), crypt(v_row.password, gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('name', v_row.display_name),
        now(), now(), '', '', '', ''
      );

      insert into auth.identities (
        id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
      ) values (
        gen_random_uuid(), v_id, v_id::text, 
        jsonb_build_object('sub', v_id::text, 'email', lower(v_row.email)),
        'email', now(), now(), now()
      );
    else
      -- ==========================================
      -- ACCOUNT EXISTS: UPDATE PASSWORD & CONFIRM
      -- ==========================================
      update auth.users 
      set encrypted_password = crypt(v_row.password, gen_salt('bf')),
          email_confirmed_at = now(),
          updated_at = now()
      where id = v_id;
    end if;

    -- ==========================================
    -- UPSERT THE PROFILE (Works for both new and existing)
    -- ==========================================
    insert into public.profiles (id, email, name, role, status, verified_at)
    values (v_id, lower(v_row.email), v_row.display_name, v_row.role_name, 'verified', now())
    on conflict (id) do update set
      name = excluded.name,
      role = excluded.role,
      status = 'verified',
      verified_at = now(),
      disabled = false;
      
  end loop;
end
$$;

commit;

-- Show the results
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