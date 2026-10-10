-- ============================================================================
-- Cap the number of sections per grade / school year (anti-spam). A compromised
-- or careless registrar can otherwise create unlimited sections. Enforced in the
-- DB so it can't be bypassed by calling the API directly (the UI caps it too).
-- Run once in the Supabase SQL Editor.
-- ============================================================================
create or replace function public.enforce_section_limit()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  cnt int;
  max_per_grade int;
begin
  -- Service role bypasses (seed scripts); staff/registrar are capped.
  if auth.uid() is null then
    return new;
  end if;
  -- Admin-configurable cap (EditEnrollment → Max Sections); default 20.
  select nullif(content->>'maxSectionsPerGrade', '')::int into max_per_grade
    from public.site_content where section = 'enrollment';
  if max_per_grade is null or max_per_grade < 1 then max_per_grade := 20; end if;
  -- Cap per "bucket": per grade (Elem/JHS), or per grade+strand (SHS) so each
  -- strand gets its own allowance.
  if new.strand is not null then
    select count(*) into cnt from public.sections
      where school_year = new.school_year and grade = new.grade and strand = new.strand;
  else
    select count(*) into cnt from public.sections
      where school_year = new.school_year and grade = new.grade and strand is null;
  end if;
  if cnt >= max_per_grade then
    raise exception 'This grade/strand already has the maximum % sections per school year.', max_per_grade;
  end if;
  return new;
end; $$;

drop trigger if exists trg_enforce_section_limit on public.sections;
create trigger trg_enforce_section_limit
  before insert on public.sections
  for each row execute function public.enforce_section_limit();
