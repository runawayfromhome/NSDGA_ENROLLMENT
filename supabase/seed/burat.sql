-- ============================================================================
-- NSDGA FULL SYSTEM SEEDER
-- Creates one account for each role with dummy data.
-- 
-- All accounts use the exact same password for testing: Password123!
-- 
-- LOGIN CREDENTIALS:
-- HeadAdmin: headadmin@example.com
-- Admin:     admin@example.com
-- Registrar: registrar@example.com
-- Student:   student@example.com
-- ============================================================================

do $$
declare
  -- IDs for the new users
  v_headadmin_id uuid := gen_random_uuid();
  v_admin_id     uuid := gen_random_uuid();
  v_registrar_id uuid := gen_random_uuid();
  v_student_id   uuid := gen_random_uuid();
  
  -- ID for the student's dummy application
  v_app_id       uuid := gen_random_uuid();
  
  -- Shared password
  v_password     text := 'Password123!';
begin
  -- ==========================================================================
  -- 1. CREATE HEADADMIN
  -- ==========================================================================
  if not exists (select 1 from auth.users where email = 'headadmin@example.com') then
    insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud)
    values (v_headadmin_id, '00000000-0000-0000-0000-000000000000', 'headadmin@example.com', crypt(v_password, gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"System HeadAdmin"}', false, 'authenticated', 'authenticated');
    
    insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_headadmin_id, 'headadmin@example.com', 'email', format('{"sub":"%s","email":"%s"}', v_headadmin_id, 'headadmin@example.com')::jsonb, now(), now(), now());
    
    -- The trigger sets them as 'student' by default, we override it here
    update public.profiles set role = 'headadmin', name = 'System HeadAdmin' where id = v_headadmin_id;
  end if;

  -- ==========================================================================
  -- 2. CREATE ADMIN
  -- ==========================================================================
  if not exists (select 1 from auth.users where email = 'admin@example.com') then
    insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud)
    values (v_admin_id, '00000000-0000-0000-0000-000000000000', 'admin@example.com', crypt(v_password, gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Test Admin"}', false, 'authenticated', 'authenticated');
    
    insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_admin_id, 'admin@example.com', 'email', format('{"sub":"%s","email":"%s"}', v_admin_id, 'admin@example.com')::jsonb, now(), now(), now());
    
    update public.profiles set role = 'admin', name = 'Test Admin' where id = v_admin_id;
  end if;

  -- ==========================================================================
  -- 3. CREATE REGISTRAR
  -- ==========================================================================
  if not exists (select 1 from auth.users where email = 'registrar@example.com') then
    insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud)
    values (v_registrar_id, '00000000-0000-0000-0000-000000000000', 'registrar@example.com', crypt(v_password, gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Test Registrar"}', false, 'authenticated', 'authenticated');
    
    insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_registrar_id, 'registrar@example.com', 'email', format('{"sub":"%s","email":"%s"}', v_registrar_id, 'registrar@example.com')::jsonb, now(), now(), now());
    
    update public.profiles set role = 'registrar', name = 'Test Registrar' where id = v_registrar_id;
  end if;

  -- ==========================================================================
  -- 4. CREATE STUDENT & DUMMY APPLICATION
  -- ==========================================================================
  if not exists (select 1 from auth.users where email = 'student@example.com') then
    insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud)
    values (v_student_id, '00000000-0000-0000-0000-000000000000', 'student@example.com', crypt(v_password, gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Dummy Student"}', false, 'authenticated', 'authenticated');
    
    insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_student_id, 'student@example.com', 'email', format('{"sub":"%s","email":"%s"}', v_student_id, 'student@example.com')::jsonb, now(), now(), now());
    
    -- The trigger already sets role to 'student' and status to 'verified', so no update needed for the profile.

    -- Create a submitted application for this student
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

  raise notice 'Seeding complete. You can now log in with the test accounts.';
end $$;