-- ============================================================================
-- Billing / Payment handoff to Finance.
-- The system is NOT a finance system — it only holds a payment STATUS per yearly
-- enrollment record, updated by staff (Admin) after Finance assesses/receives
-- payment offline. Students see it read-only. Run once in the Supabase SQL Editor.
-- (Needs is_staff() + enforce_application_update() from students.sql.)
-- ============================================================================

-- 1) A per-application billing record (staff-managed, student read-only).
--    Shape (jsonb): { status, amountDue, amountPaid, orNumber, remarks,
--                     updatedByName, updatedAt }
alter table public.applications
  add column if not exists billing jsonb not null default '{}'::jsonb;

-- 2) Guard: a STUDENT must not be able to change their own billing (only staff).
--    Re-create the enforce trigger function with the extra check. Staff and
--    server-side (auth.uid() is null) still bypass, exactly as before.
create or replace function public.enforce_application_update()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_staff() then
    return new;                                        -- staff can do anything
  end if;
  if new.status is distinct from old.status
     and not (old.status = 'needs_correction' and new.status = 'submitted') then
    raise exception 'Not allowed to change application status';
  end if;
  if new.student_no is distinct from old.student_no then
    raise exception 'Not allowed to set a student number';
  end if;
  if new.billing is distinct from old.billing then
    raise exception 'Not allowed to change billing';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_application on public.applications;
create trigger trg_enforce_application
  before update on public.applications
  for each row execute function public.enforce_application_update();
