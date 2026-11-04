-- ============================================================================
-- NSDGA FULL SYSTEM SEEDER (FIXED FOR SUPABASE DASHBOARD)
-- ============================================================================

do $$
declare
  v_headadmin_id uuid := gen_random_uuid();
  v_admin_id     uuid := gen_random_uuid();
  v_registrar_id uuid := gen_random_uuid();
  v_student_id   uuid := gen_random_uuid();
  v_app_id       uuid := gen_random_uuid();
  v_password     text := 'Password123!';
begin
  -- ==========================================================================
  -- 1. CREATE HEADADMIN
  -- ==========================================================================
  if not exists (select 1 from auth.users where email = 'headadmin@example.com') then
    insert into auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at, 
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data, 
      is_super_admin, role, aud,
      -- These empty strings are required for the Dashboard to recognize the user
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      v_headadmin_id, '00000000-0000-0000-0000-000000000000', 'headadmin@example.com', 
      crypt(v_password, gen_salt('bf')), now(), now(), now(), 
      '{"provider":"email","providers":["email"]}', '{"name":"System HeadAdmin"}', 
      false, 'authenticated', 'authenticated',
      '', '', '', ''
    );
    
    insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_headadmin_id, 'headadmin@example.com', 'email', format('{"sub":"%s","email":"%s"}', v_headadmin_id, 'headadmin@example.com')::jsonb, now(), now(), now());
    
    update public.profiles set role = 'headadmin', name = 'System HeadAdmin' where id = v_headadmin_id;
  end if;

  -- ==========================================================================
  -- 2. CREATE ADMIN
  -- ==========================================================================
  if not exists (select 1 from auth.users where email = 'admin@example.com') then
    insert into auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at, 
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data, 
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      v_admin_id, '00000000-0000-0000-0000-000000000000', 'admin@example.com', 
      crypt(v_password, gen_salt('bf')), now(), now(), now(), 
      '{"provider":"email","providers":["email"]}', '{"name":"Test Admin"}', 
      false, 'authenticated', 'authenticated',
      '', '', '', ''
    );
    
    insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_admin_id, 'admin@example.com', 'email', format('{"sub":"%s","email":"%s"}', v_admin_id, 'admin@example.com')::jsonb, now(), now(), now());
    
    update public.profiles set role = 'admin', name = 'Test Admin' where id = v_admin_id;
  end if;

  -- ==========================================================================
  -- 3. CREATE REGISTRAR
  -- ==========================================================================
  if not exists (select 1 from auth.users where email = 'registrar@example.com') then
    insert into auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at, 
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data, 
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      v_registrar_id, '00000000-0000-0000-0000-000000000000', 'registrar@example.com', 
      crypt(v_password, gen_salt('bf')), now(), now(), now(), 
      '{"provider":"email","providers":["email"]}', '{"name":"Test Registrar"}', 
      false, 'authenticated', 'authenticated',
      '', '', '', ''
    );
    
    insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_registrar_id, 'registrar@example.com', 'email', format('{"sub":"%s","email":"%s"}', v_registrar_id, 'registrar@example.com')::jsonb, now(), now(), now());
    
    update public.profiles set role = 'registrar', name = 'Test Registrar' where id = v_registrar_id;
  end if;

  -- ==========================================================================
  -- 4. CREATE STUDENT & DUMMY APPLICATION
  -- ==========================================================================
  if not exists (select 1 from auth.users where email = 'student@example.com') then
    insert into auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at, 
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data, 
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      v_student_id, '00000000-0000-0000-0000-000000000000', 'student@example.com', 
      crypt(v_password, gen_salt('bf')), now(), now(), now(), 
      '{"provider":"email","providers":["email"]}', '{"name":"Dummy Student"}', 
      false, 'authenticated', 'authenticated',
      '', '', '', ''
    );
    
    insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_student_id, 'student@example.com', 'email', format('{"sub":"%s","email":"%s"}', v_student_id, 'student@example.com')::jsonb, now(), now(), now());

    insert into public.applications (
      id, student_id, school_year, grade_level, student_type, status, form, documents
    ) values (
      v_app_id,
      v_student_id,
      '2026-2027',
      'Junior High School',
      'New Student',
      'submitted',
      '{
        "firstName": "Dummy", "middleName": "Test", "lastName": "Student", "suffix": "",
        "lrn": "136676090147", "sex": "Male", "dob": "2013-05-15", "age": "13",
        "birthplace": "Marikina City", "nationality": "Filipino", "religion": "Roman Catholic",
        "region": "National Capital Region (NCR)", "province": "Metro Manila", "city": "Marikina",
        "barangay": "San Roque", "houseStreet": "123 Test Street",
        "fatherName": "Father Test", "motherName": "Mother Test", "guardianName": "Guardian Test",
        "guardianContact": "09171234567", "lastSchool": "Marikina Elementary School",
        "prevSchoolType": "Public", "lastSchoolAddress": "Marikina", "lastGrade": "Grade 6",
        "gwa": "90", "grade": "Grade 7", "contact": "09171234567", "schoolYear": "2026-2027"
      }'::jsonb,
      '{
        "photo": {"name": "2x2.jpg", "path": "dummy/photo.jpg", "status": "uploaded"},
        "psa": {"name": "psa.pdf", "path": "dummy/psa.pdf", "status": "uploaded"},
        "reportCard": {"name": "report-card.pdf", "path": "dummy/report-card.pdf", "status": "uploaded"}
      }'::jsonb
    );
  end if;

  raise notice 'Seeding complete!';
end $$;