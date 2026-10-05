-- ============================================================================
-- NSDGA — REALISTIC DEMO STUDENTS (100) for a believable demo/grading dataset.
-- Run in the Supabase SQL Editor AFTER schema.sql + students.sql + sections.sql.
-- Safe to re-run: it first WIPES every student, then re-inserts a clean set.
--
-- ⚠️  DEMO DATA ONLY. Every account below is fictional. This file DELETES ALL
--     student accounts (role = 'student') and their applications. Staff accounts
--     (registrar / admin / headadmin) are NOT touched. Do NOT run on a live
--     system that already has real enrolled students.
--
-- Student login (all 100):  password = Student@123
-- Email pattern:            <first>.<last><n>@demo.nsdga.test  (sentinel)
-- Every application is tagged  form->>'seed' = true  for easy bulk-deletion.
--
-- Documents: most students have 0–3 RANDOM document slots filled; the first 5
--            students (2026-0001..0005) have the COMPLETE set of requirements.
--            NOTE: these are seeded METADATA only — the files are not uploaded to
--            Storage, so the checklist/status shows correctly but "view file"
--            won't open an actual document. Upload real files via the UI if a
--            viewable document is needed for the demo.
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

-- Remove the demo sections this file (re)creates — plus the older demo names —
-- so a re-run starts clean.
delete from public.sections where school_year = '2026-2027'
  and (name = 'Section A'
       or name = any(array['HT - Hospitality and Tourism','IT - Industrial Technologies',
                           'CP - Computer Programming','TECHPRO - Technical-Professional'])
       or name in ('Sampaguita','Rizal','St. Lorenzo','St. Agnes',
                   'Mabini (HT)','Bonifacio (CP)','Luna (IT)'));

-- 2) Create the demo sections (APPROVED). One "Section A" per Grade 1–10, and
--    one section per strand for Grade 11 & 12.
insert into public.sections (school_year, grade, name, strand, adviser, capacity, status)
select '2026-2027', 'Grade ' || gg, 'Section A', null, 'Class Adviser', 45, 'approved'
from generate_series(1, 10) gg;

insert into public.sections (school_year, grade, name, strand, adviser, capacity, status)
select '2026-2027', gr, s, s, 'Class Adviser', 45, 'approved'
from (values ('Grade 11'), ('Grade 12')) as g(gr)
cross join unnest(array['HT - Hospitality and Tourism','IT - Industrial Technologies',
                        'CP - Computer Programming','TECHPRO - Technical-Professional']) as s;

-- 3) Generate 100 students (auth user + identity + profile + application).
do $$
declare
  first_m text[] := array['Juan','Jose','Mark','John','Daniel','Joshua','Nathan','Miguel','Carlo','Lance','Kevin','Ryan','Paolo','Angelo','Gabriel','Rafael','Luis','Vincent','Christian','Enrico','Dale','Francis','Kurt','Neil','Aldrin'];
  first_f text[] := array['Maria','Angela','Patricia','Kyla','Sophia','Bea','Andrea','Erica','Trisha','Hannah','Reyna','Camille','Nicole','Danica','Julia','Althea','Bianca','Chloe','Denise','Faith','Grace','Ivy','Jasmine','Krista','Lara'];
  lasts   text[] := array['Reyes','Santos','Dela Cruz','Gomez','Ramos','Mendoza','Torres','Aquino','Flores','Castillo','Navarro','Lim','Villanueva','Pascual','Domingo','Bautista','Ocampo','Cruz','Garcia','Mercado','Rivera','Gonzales','Aguilar','Fernandez','Salazar','Tan','Lazaro','Marquez','Padilla','Ysmael'];
  mids    text[] := array['A','B','C','D','E','F','G','H','J','K','L','M','N','P','R','S','T','V'];
  streets text[] := array['Bayan-bayanan Ave','J.P. Rizal St','Shoe Ave','Sumulong Hwy','Concepcion Uno','Nangka St','Tanong','Malanday','Parang','Fortune','San Roque','Industrial Valley','Marikina Heights','Jesus Dela Peña','Sto. Niño'];
  schools text[] := array['Marikina Science High School','Marikina Heights NHS','Concepcion Elementary School','Sta. Elena Elementary School','Nangka Elementary School','San Roque NHS','Parang NHS','Marikina Catholic School','Fortune Elementary School','NSDGA'];
  strands text[] := array['HT - Hospitality and Tourism','IT - Industrial Technologies','CP - Computer Programming','TECHPRO - Technical-Professional'];
  dockeys text[] := array['photo','reportCard','form137','psa','goodMoral'];

  i int; uid uuid; g int; grade_txt text; lvl text; is_f boolean;
  fn text; mn text; ln text; email text; st text; strand text; sect text;
  sno text; sno_ctr int := 0; docs jsonb; f jsonb; note text;
  dk text; sel text[]; nfiles int; dstat text; rc numeric; created timestamptz;
begin
  for i in 1..100 loop
    uid := gen_random_uuid();
    is_f := (i % 2 = 0);
    fn := case when is_f then first_f[1 + (i % array_length(first_f, 1))]
               else first_m[1 + (i % array_length(first_m, 1))] end;
    mn := mids[1 + (i % array_length(mids, 1))];
    ln := lasts[1 + (i % array_length(lasts, 1))];
    email := lower(replace(fn, ' ', '') || '.' || replace(ln, ' ', '') || i) || '@demo.nsdga.test';

    g := 1 + (i % 12);                        -- Grade 1..12
    grade_txt := 'Grade ' || g;
    lvl := case when g <= 6 then 'Elementary'
                when g <= 10 then 'Junior High School'
                else 'Senior High School' end;

    -- Status mix (first 5 are always enrolled + complete docs).
    if i <= 5 then
      st := 'enrolled';
    else
      rc := random();
      st := case when rc < 0.60 then 'enrolled'
                 when rc < 0.75 then 'submitted'
                 when rc < 0.87 then 'under_review'
                 when rc < 0.95 then 'needs_correction'
                 else 'rejected' end;
    end if;

    strand := case when g >= 11 then strands[1 + floor(random() * 4)::int] else null end;

    -- Documents
    docs := '{}'::jsonb;
    if i <= 5 then
      foreach dk in array dockeys loop
        docs := docs || jsonb_build_object(dk, jsonb_build_object(
          'path', uid::text || '/' || dk || '-seed.pdf', 'name', dk || '.pdf',
          'size', (80000 + floor(random() * 150000))::int, 'uploadedAt', now(), 'status', 'uploaded'));
      end loop;
    else
      nfiles := floor(random() * 4)::int;     -- 0..3 random files
      if nfiles > 0 then
        select array_agg(k) into sel from (select k from unnest(dockeys) as k order by random() limit nfiles) t;
        foreach dk in array sel loop
          dstat := (array['uploaded','uploaded','uploaded','verified','rejected'])[1 + floor(random() * 5)::int];
          docs := docs || jsonb_build_object(dk, jsonb_build_object(
            'path', uid::text || '/' || dk || '-seed.pdf', 'name', dk || '.pdf',
            'size', (80000 + floor(random() * 150000))::int, 'uploadedAt', now(), 'status', dstat));
        end loop;
      end if;
    end if;

    -- Enrolled → student number + section assignment
    sno := null; sect := null;
    if st = 'enrolled' then
      sno_ctr := sno_ctr + 1;
      sno := '2026-' || lpad(sno_ctr::text, 4, '0');
      sect := case when g >= 11 then strand else 'Section A' end;
    end if;

    note := case st
      when 'needs_correction' then 'Please upload a clearer copy of your Report Card and PSA Birth Certificate.'
      when 'rejected' then 'After careful review, we are unable to offer admission at this time.'
      else '' end;

    -- Auth user + identity (email pre-confirmed so they can log in).
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      email, crypt('Student@123', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', jsonb_build_object('name', fn || ' ' || ln),
      now(), now(), '', '', '', ''
    );
    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), uid, uid::text,
      jsonb_build_object('sub', uid::text, 'email', email), 'email', now(), now(), now()
    );

    -- Force student/verified regardless of which handle_new_user() trigger is active.
    insert into public.profiles (id, email, name, role, status, verified_at)
    values (uid, email, fn || ' ' || ln, 'student', 'verified', now())
    on conflict (id) do update
      set role = 'student', status = 'verified', name = excluded.name, verified_at = now();

    -- Admission form
    f := jsonb_build_object(
      'firstName', fn, 'middleName', mn, 'lastName', ln, 'suffix', '',
      'lrn', '1360' || lpad((i * 7919)::text, 8, '0'),
      'sex', case when is_f then 'Female' else 'Male' end,
      'dob', to_char(make_date(2026 - (g + 6), 1 + floor(random() * 12)::int, 1 + floor(random() * 28)::int), 'YYYY-MM-DD'),
      'birthplace', 'Marikina City',
      'address', (1 + floor(random() * 120)::int)::text || ' ' || streets[1 + floor(random() * array_length(streets, 1))::int] || ', Marikina City',
      'fatherName', 'Mr. ' || ln, 'motherName', 'Mrs. ' || ln, 'guardianName', 'Mrs. ' || ln,
      'guardianContact', '09' || lpad((100000000 + i)::text, 9, '0'),
      'lastSchool', schools[1 + floor(random() * array_length(schools, 1))::int],
      'lastSchoolAddress', 'Marikina City', 'lastGrade', '',
      'gwa', (80 + floor(random() * 16))::text,
      'grade', grade_txt, 'contact', '09' || lpad((100000000 + i)::text, 9, '0'),
      'schoolYear', '2026-2027', 'seed', true
    );
    if strand is not null then f := f || jsonb_build_object('strand', strand); end if;
    if sect is not null then f := f || jsonb_build_object('section', sect, 'sectionApproved', true); end if;

    created := now() - (i || ' days')::interval;
    insert into public.applications (
      student_id, school_year, grade_level, student_type, status, form, documents,
      review_note, student_no, created_at, submitted_at, reviewed_at
    ) values (
      uid, '2026-2027', lvl,
      (array['New Student','New Student','New Student','Transferee','Returnee'])[1 + (i % 5)],
      st, f, docs, note, sno, created, created,
      case when st in ('enrolled','rejected','needs_correction') then created + interval '1 day' else null end
    );
  end loop;
end $$;

-- 4) Fill each enrolled student's classmates list from their co-section members.
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
