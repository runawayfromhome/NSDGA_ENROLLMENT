-- ============================================================================
-- NSDGA — DEMO APPLICANTS: GRADE 1 THROUGH GRADE 12
-- Run after the schema and application security SQL.
--
-- DEMO DATA ONLY. This file creates 12 fictional student accounts and
-- applications, one for each grade from Grade 1 through Grade 12.
--
-- Before running, set a password for the demo accounts:
--   select set_config('app.student_password', 'ChangeMe123!', false);
--
-- Demo emails follow this pattern:
--   applicant.grade01@demo.nsdga.test through applicant.grade12@demo.nsdga.test
--
-- Safe to re-run: only rows tagged seed_applicants_1_to_12 are removed.
-- Do not run this file on a production database with real demo-tagged records.
-- ============================================================================

do $$
declare
  i int;
  uid uuid;
  email text;
  first_name text;
  last_name text;
  grade_text text;
  level_text text;
  strand_text text;
  form_data jsonb;
begin
  if current_setting('app.student_password', true) is null
     or current_setting('app.student_password', true) = '' then
    raise exception 'Set app.student_password before running this seed file.';
  end if;

  -- Remove only rows created by this seed. Staff and other students remain.
  create temp table _seed_applicants on commit drop as
    select id from public.profiles
    where role = 'student'
      and email like 'applicant.grade%@demo.nsdga.test';

  delete from public.applications
  where student_id in (select id from _seed_applicants)
     or coalesce((form->>'seed')::boolean, false) = true
        and form->>'seedSource' = 'seed_applicants_1_to_12';
  delete from auth.identities
  where user_id in (select id from _seed_applicants);
  delete from public.profiles
  where id in (select id from _seed_applicants);
  delete from auth.users
  where id in (select id from _seed_applicants);

  for i in 1..12 loop
    uid := gen_random_uuid();
    email := 'applicant.grade' || lpad(i::text, 2, '0') || '@demo.nsdga.test';
    first_name := case when i % 2 = 0 then 'Maria' else 'Juan' end;
    last_name := 'Grade' || lpad(i::text, 2, '0') || ' Applicant';
    grade_text := format('Grade %s', i);
    level_text := case
      when i <= 6 then 'Elementary'
      when i <= 10 then 'Junior High School'
      else 'Senior High School'
    end;
    strand_text := case
      when i >= 11 then case when i % 2 = 0
        then 'IT - Industrial Technologies'
        else 'CP - Computer Programming'
      end
      else null
    end;

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000',
      uid,
      'authenticated',
      'authenticated',
      email,
      extensions.crypt(
        current_setting('app.student_password'),
        extensions.gen_salt('bf')
      ),
      now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('name', first_name || ' ' || last_name),
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(),
      uid,
      uid::text,
      jsonb_build_object('sub', uid::text, 'email', email),
      'email',
      now(),
      now(),
      now()
    );

    insert into public.profiles (id, email, name, role, status, verified_at)
    values (
      uid,
      email,
      first_name || ' ' || last_name,
      'student',
      'verified',
      now()
    )
    on conflict (id) do update
      set email = excluded.email,
          name = excluded.name,
          role = 'student',
          status = 'verified',
          verified_at = now();

    form_data := jsonb_build_object(
      'firstName', first_name,
      'middleName', 'Demo',
      'lastName', last_name,
      'suffix', '',
      'lrn', '1300' || lpad(i::text, 8, '0'),
      'sex', case when i % 2 = 0 then 'Female' else 'Male' end,
      'dob', to_char(make_date(2026 - (i + 5), 1 + (i % 12), 1 + i), 'YYYY-MM-DD'),
      'age', (i + 5)::text,
      'birthplace', 'Marikina City',
      'nationality', 'Filipino',
      'religion', 'Roman Catholic',
      'address', format('%s Demo Street, Marikina City', 10 + i),
      'fatherName', 'Demo Father',
      'motherName', 'Demo Mother',
      'guardianName', 'Demo Guardian',
      'guardianContact', '09' || (100000000 + i)::text,
      'lastSchool', 'Demo Previous School',
      'lastSchoolAddress', 'Marikina City',
      'lastGrade', '',
      'gwa', '90',
      'grade', grade_text,
      'contact', '09' || (100000000 + i)::text,
      'schoolYear', '2026-2027',
      'seed', true,
      'seedSource', 'seed_applicants_1_to_12'
    );

    if strand_text is not null then
      form_data := form_data || jsonb_build_object('strand', strand_text);
    end if;

    insert into public.applications (
      student_id, school_year, grade_level, student_type, status,
      form, documents, review_note, created_at, submitted_at
    ) values (
      uid,
      '2026-2027',
      level_text,
      'New Student',
      'submitted',
      form_data,
      '{}'::jsonb,
      '',
      now() - (i || ' days')::interval,
      now() - (i || ' days')::interval
    );
  end loop;
end $$;

-- Summary of the seeded applicant queue.
select form->>'grade' as grade, status, email
from public.applications a
join public.profiles p on p.id = a.student_id
where form->>'seedSource' = 'seed_applicants_1_to_12'
order by (regexp_replace(form->>'grade', '\D', '', 'g'))::int;
