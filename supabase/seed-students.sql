-- ============================================================================
-- NSDGA — REALISTIC DEMO STUDENTS (20) for a believable demo/grading dataset.
-- Run in the Supabase SQL Editor AFTER schema.sql + students.sql + sections.sql.
-- Safe to re-run: it first WIPES every student, then re-inserts a clean set.
--
-- ⚠️  DEMO DATA ONLY. Every account below is fictional. This file DELETES ALL
--     student accounts (role = 'student') and their applications. Staff accounts
--     (registrar / admin / headadmin) are NOT touched. Do NOT run on a live
--     system that already has real enrolled students.
--
-- Student login (all 20):  password = Student@123
-- Email pattern:           <name>@demo.nsdga.test   (sentinel, easy to find)
-- Every application is tagged  form->>'seed' = true  for easy bulk-deletion.
-- ============================================================================

-- 1) WIPE all existing students (demo reset). Staff untouched.
do $$
begin
  create temp table _wipe on commit drop as
    select id from public.profiles where role = 'student';
  delete from public.applications where student_id in (select id from _wipe);
  delete from auth.identities    where user_id    in (select id from _wipe);
  delete from public.profiles    where id         in (select id from _wipe);
  delete from auth.users         where id         in (select id from _wipe);
end $$;

-- Remove the demo sections this file (re)creates, so a re-run starts clean.
delete from public.sections where school_year = '2026-2027'
  and name in ('Sampaguita', 'Rizal', 'St. Lorenzo', 'St. Agnes',
               'Mabini (HT)', 'Bonifacio (CP)', 'Luna (IT)');

-- 2) Create the demo sections (APPROVED, so students see their class).
insert into public.sections (school_year, grade, name, strand, adviser, capacity, status) values
  ('2026-2027', 'Grade 1',  'Sampaguita',     null,                               'Ms. Lopez',   45, 'approved'),
  ('2026-2027', 'Grade 5',  'Rizal',          null,                               'Mr. Aquino',  45, 'approved'),
  ('2026-2027', 'Grade 7',  'St. Lorenzo',    null,                               'Ms. Ramos',   45, 'approved'),
  ('2026-2027', 'Grade 10', 'St. Agnes',      null,                               'Mr. Cruz',    45, 'approved'),
  ('2026-2027', 'Grade 11', 'Mabini (HT)',    'HT - Hospitality and Tourism',     'Ms. Flores',  45, 'approved'),
  ('2026-2027', 'Grade 11', 'Bonifacio (CP)', 'CP - Computer Programming',        'Mr. Tan',     45, 'approved'),
  ('2026-2027', 'Grade 12', 'Luna (IT)',      'IT - Industrial Technologies',     'Mr. Reyes',   45, 'approved');

-- 3) Create the 20 students (auth user + identity + profile + application).
do $$
declare
  r   record;
  uid uuid;
  lvl text;
  f   jsonb;
  cnt int := 0;
begin
  for r in
    select * from (values
      -- email, first, mid, last, sex, dob, lrn, address, contact, grade, type, strand, gwa, lastSchool, status, section, student_no, note
      ('angela.reyes',     'Angela',   'B', 'Reyes',      'Female', '2009-02-14', '136010001234', '12 Bayan-bayanan Ave, Marikina City', '09171000001', 'Grade 11', 'New Student', 'HT - Hospitality and Tourism',  '90', 'Marikina Science High School', 'enrolled',        'Mabini (HT)',    '2026-0001', ''),
      ('mark.santos',      'Mark Angelo','C','Santos',     'Male',   '2009-05-20', '136010002234', '45 J.P. Rizal St, Marikina City',     '09171000002', 'Grade 11', 'New Student', 'CP - Computer Programming',     '88', 'Marikina Heights NHS',         'enrolled',        'Bonifacio (CP)', '2026-0002', ''),
      ('john.delacruz',    'John Paul','D', 'Dela Cruz',   'Male',   '2008-09-02', '136010003234', '7 Shoe Ave, Marikina City',           '09171000003', 'Grade 12', 'Returnee',    'IT - Industrial Technologies',  '87', 'NSDGA',                        'enrolled',        'Luna (IT)',      '2026-0003', ''),
      ('patricia.gomez',   'Patricia Mae','E','Gomez',     'Female', '2013-03-11', '136010004234', '9 Sumulong Hwy, Marikina City',       '09171000004', 'Grade 7',  'New Student', '',                              '91', 'Sta. Elena Elementary School', 'enrolled',        'St. Lorenzo',    '2026-0004', ''),
      ('daniel.ramos',     'Daniel',   'F', 'Ramos',       'Male',   '2013-07-19', '136010005234', '21 Concepcion Uno, Marikina City',    '09171000005', 'Grade 7',  'New Student', '',                              '89', 'Concepcion Elementary School',  'enrolled',        'St. Lorenzo',    '2026-0005', ''),
      ('kyla.mendoza',     'Kyla',     'G', 'Mendoza',     'Female', '2010-11-05', '136010006234', '3 Nangka St, Marikina City',          '09171000006', 'Grade 10', 'New Student', '',                              '90', 'NSDGA',                        'enrolled',        'St. Agnes',      '2026-0006', ''),
      ('joshua.torres',    'Joshua',   'H', 'Torres',      'Male',   '2015-01-28', '136010007234', '15 Tanong, Marikina City',            '09171000007', 'Grade 5',  'New Student', '',                              '88', 'Nangka Elementary School',      'enrolled',        'Rizal',          '2026-0007', ''),
      ('sophia.aquino',    'Sophia',   'I', 'Aquino',      'Female', '2019-06-10', '',             '8 Malanday, Marikina City',           '09171000008', 'Grade 1',  'New Student', '',                              '',   'Little Angels Kinder School',   'enrolled',        'Sampaguita',     '2026-0008', ''),
      ('nathan.flores',    'Nathan',   'J', 'Flores',      'Male',   '2009-04-22', '136010009234', '30 Parang, Marikina City',            '09171000009', 'Grade 11', 'Transferee',  'HT - Hospitality and Tourism',  '86', 'Marikina Catholic School',      'enrolled',        'Mabini (HT)',    '2026-0009', ''),
      ('bea.castillo',     'Bea Kristine','L','Castillo',  'Female', '2008-12-15', '136010010234', '2 Fortune, Marikina City',            '09171000010', 'Grade 12', 'New Student', 'IT - Industrial Technologies',  '92', 'NSDGA',                        'enrolled',        'Luna (IT)',      '2026-0010', ''),
      ('miguel.navarro',   'Miguel',   'M', 'Navarro',     'Male',   '2010-08-30', '136010011234', '18 San Roque, Marikina City',         '09171000011', 'Grade 10', 'Transferee',  '',                              '85', 'San Roque NHS',                'enrolled',        'St. Agnes',      '2026-0011', ''),
      ('andrea.lim',       'Andrea',   'N', 'Lim',         'Female', '2009-03-03', '136010012234', '11 Industrial Valley, Marikina City', '09171000012', 'Grade 11', 'New Student', 'CP - Computer Programming',     '93', 'Marikina Science High School', 'enrolled',        'Bonifacio (CP)', '2026-0012', ''),
      ('carlo.villanueva', 'Carlo',    'O', 'Villanueva',  'Male',   '2012-02-09', '136010013234', '6 Jesus De La Peña, Marikina City',   '09171000013', 'Grade 8',  'New Student', '',                              '87', 'San Mateo Elementary School',   'submitted',       '',               '',          ''),
      ('erica.pascual',    'Erica',    'P', 'Pascual',     'Female', '2011-10-17', '136010014234', '24 Marikina Heights, Marikina City',  '09171000014', 'Grade 9',  'Transferee',  '',                              '88', 'Marikina Heights NHS',         'submitted',       '',               '',          ''),
      ('lance.domingo',    'Lance',    'Q', 'Domingo',     'Male',   '2009-07-25', '136010015234', '5 Parang, Marikina City',             '09171000015', 'Grade 11', 'New Student', 'TECHPRO - Technical-Professional','86','Parang NHS',                   'submitted',       '',               '',          ''),
      ('trisha.bautista',  'Trisha',   'R', 'Bautista',    'Female', '2013-05-12', '136010016234', '14 Fortune, Marikina City',           '09171000016', 'Grade 7',  'New Student', '',                              '90', 'Fortune Elementary School',     'under_review',    '',               '',          ''),
      ('kevin.ocampo',     'Kevin',    'S', 'Ocampo',      'Male',   '2008-08-08', '136010017234', '28 Concepcion Dos, Marikina City',    '09171000017', 'Grade 12', 'Returnee',    'CP - Computer Programming',     '89', 'NSDGA',                        'under_review',    '',               '',          ''),
      ('hannah.cruz',      'Hannah',   'T', 'Cruz',        'Female', '2010-09-14', '136010018234', '10 Sto. Niño, Marikina City',         '09171000018', 'Grade 10', 'New Student', '',                              '84', 'Jesus Good Shepherd School',    'needs_correction','',               '',          'Please upload a clearer copy of your Report Card and PSA Birth Certificate.'),
      ('paolo.garcia',     'Paolo',    'U', 'Garcia',      'Male',   '2009-06-27', '136010019234', '16 Marikina Heights, Marikina City',  '09171000019', 'Grade 11', 'Transferee',  'HT - Hospitality and Tourism',  '83', 'Marikina Catholic School',      'needs_correction','',               '',          'Your Form 137 is missing. Please attach it and resubmit.'),
      ('ryan.mercado',     'Ryan',     'V', 'Mercado',     'Male',   '2011-11-30', '136010020234', '19 San Roque, Marikina City',         '09171000020', 'Grade 9',  'New Student', '',                              '78', 'San Roque NHS',                'rejected',        '',               '',          'After careful review, we are unable to offer admission at this time.')
    ) as t(email, fn, mn, ln, sex, dob, lrn, addr, contact, grade, stype, strand, gwa, lastsch, status, section, sno, note)
  loop
    cnt := cnt + 1;
    uid := gen_random_uuid();

    -- Grade → level
    lvl := case
      when r.grade in ('Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6') then 'Elementary'
      when r.grade in ('Grade 7','Grade 8','Grade 9','Grade 10') then 'Junior High School'
      else 'Senior High School' end;

    -- Auth user + identity (email pre-confirmed so they can log in).
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      r.email || '@demo.nsdga.test', crypt('Student@123', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('name', r.fn || ' ' || r.ln),
      now(), now(), '', '', '', ''
    );
    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), uid, uid::text,
      jsonb_build_object('sub', uid::text, 'email', r.email || '@demo.nsdga.test'),
      'email', now(), now(), now()
    );

    -- Profile: force student/verified regardless of which handle_new_user() trigger
    -- is active (seed.sql's and students.sql's versions differ).
    insert into public.profiles (id, email, name, role, status, verified_at)
    values (uid, r.email || '@demo.nsdga.test', r.fn || ' ' || r.ln, 'student', 'verified', now())
    on conflict (id) do update
      set role = 'student', status = 'verified', name = excluded.name, verified_at = now();

    -- Build the admission form.
    f := jsonb_build_object(
      'firstName', r.fn, 'middleName', r.mn, 'lastName', r.ln, 'suffix', '',
      'lrn', r.lrn, 'sex', r.sex, 'dob', r.dob, 'birthplace', 'Marikina City',
      'address', r.addr,
      'fatherName', 'Mr. ' || r.ln, 'motherName', 'Mrs. ' || r.ln,
      'guardianName', 'Mrs. ' || r.ln, 'guardianContact', r.contact,
      'lastSchool', r.lastsch, 'lastSchoolAddress', 'Marikina City', 'lastGrade', '',
      'gwa', r.gwa, 'grade', r.grade, 'contact', r.contact, 'schoolYear', '2026-2027',
      'seed', true
    );
    if nullif(r.strand, '') is not null then
      f := f || jsonb_build_object('strand', r.strand);
    end if;
    if nullif(r.section, '') is not null then
      f := f || jsonb_build_object('section', r.section, 'sectionApproved', true);
    end if;

    -- Application (documents left empty so the checklist shows "Not Uploaded").
    insert into public.applications (
      student_id, school_year, grade_level, student_type, status, form, documents,
      review_note, student_no, created_at, submitted_at, reviewed_at
    ) values (
      uid, '2026-2027', lvl, r.stype, r.status, f, '{}'::jsonb,
      coalesce(nullif(r.note, ''), ''),
      nullif(r.sno, ''),
      now() - (cnt * 2 || ' days')::interval,
      now() - (cnt * 2 || ' days')::interval,
      case when r.status in ('enrolled','rejected','needs_correction')
           then now() - ((cnt * 2) - 1 || ' days')::interval else null end
    );
  end loop;
end $$;

-- 4) Fill each enrolled student's classmates list (what the portal shows per
--    section), from their co-section members.
update public.applications a
set form = a.form || jsonb_build_object('classmates', (
  select coalesce(jsonb_agg(
           btrim(concat_ws(' ', b.form->>'firstName', b.form->>'lastName'))
           order by b.form->>'lastName'), '[]'::jsonb)
  from public.applications b
  where b.status = 'enrolled'
    and b.school_year = a.school_year
    and b.form->>'grade'   = a.form->>'grade'
    and b.form->>'section' = a.form->>'section'
))
where a.status = 'enrolled'
  and a.form ? 'section'
  and coalesce((a.form->>'seed')::boolean, false) = true;

-- 5) Result summary
select status, count(*) from public.applications
where coalesce((form->>'seed')::boolean, false) = true
group by status order by status;
