// supabase/functions/seed-test-data/index.ts
// TEST UTILITY — wipes all student accounts + records and seeds fresh test data.
// Head-Admin only. Delete this function before going to production.
//
// Actions (POST body):
//   { action: "clean" }
//       → deletes every student auth user (cascades their applications + profile)
//         and clears all sections.
//   { action: "seed", grades: ["Grade 1", ...], enrolled: 20, pending: 10,
//     schoolYear: "2026-2027" }
//       → for each grade, creates `enrolled` enrolled students (with student
//         numbers) + `pending` not-yet-enrolled applicants.
//
// Deploy:  supabase functions deploy seed-test-data
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

const FIRST = ['Juan', 'Maria', 'Jose', 'Ana', 'Pedro', 'Rosa', 'Mark', 'Grace', 'Paolo', 'Liza', 'Carlo', 'Andrea', 'Miguel', 'Bea', 'Nathan', 'Sofia', 'Rafael', 'Camille', 'Diego', 'Ella', 'Kevin', 'Hannah', 'Luis', 'Ivy', 'Neil', 'Faith', 'Ryan', 'Joy', 'Aldrin', 'Mica'];
const LAST = ['Santos', 'Reyes', 'Cruz', 'Bautista', 'Garcia', 'Torres', 'Flores', 'Ramos', 'Villanueva', 'Mendoza', 'Castro', 'Aquino', 'Rivera', 'Gonzales', 'Domingo', 'Navarro', 'Salazar', 'Pascual', 'Fernandez', 'Lorenzo'];
const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
const levelOf = (grade: string) => {
  const n = parseInt(String(grade).replace(/\D/g, ''), 10);
  if (n >= 1 && n <= 6) return 'Elementary';
  if (n >= 7 && n <= 10) return 'Junior High School';
  return 'Senior High School';
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const url = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(url, serviceKey);

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const caller = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) return json({ error: 'Not authenticated.' }, 401);
    const { data: prof } = await admin.from('profiles').select('role').eq('id', user.id).single();
    if (!prof || prof.role !== 'headadmin') return json({ error: 'Only the Head Administrator can seed test data.' }, 403);

    const body = await req.json();

    if (body.action === 'clean') {
      const { data: studs } = await admin.from('profiles').select('id').eq('role', 'student');
      let deleted = 0;
      for (const s of (studs || [])) { await admin.auth.admin.deleteUser(s.id); deleted++; }
      await admin.from('sections').delete().gte('created_at', '1900-01-01');
      return json({ ok: true, deletedStudents: deleted, sectionsCleared: true });
    }

    if (body.action === 'seed') {
      const grades: string[] = body.grades || [];
      const enrolled = body.enrolled ?? 20;
      const pending = body.pending ?? 10;
      const schoolYear = body.schoolYear || '2026-2027';

      const { data: nums } = await admin.from('applications').select('student_no').ilike('student_no', '2026-%');
      let no = 1 + (nums || []).reduce((m: number, r: { student_no: string }) => Math.max(m, parseInt((r.student_no || '').split('-')[1] || '0', 10) || 0), 0);
      const stamp = Date.now();
      let created = 0, en = 0, pe = 0;

      const mk = async (grade: string, status: string, i: number) => {
        const first = pick(FIRST), last = pick(LAST);
        const email = `test-${stamp}-${String(grade).replace(/\D/g, '')}-${i}-${Math.random().toString(16).slice(2, 6)}@nsdga.test`;
        const { data: u, error } = await admin.auth.admin.createUser({
          email, password: 'Test@1234', email_confirm: true, user_metadata: { name: `${first} ${last}`, role: 'student' },
        });
        if (error || !u?.user) return;
        const form: Record<string, unknown> = {
          firstName: first, lastName: last, sex: i % 2 ? 'Male' : 'Female',
          dob: '2012-06-15', grade, schoolYear, gwa: String(78 + Math.floor(Math.random() * 20)), contact: '0917 000 0000',
        };
        const row: Record<string, unknown> = { student_id: u.user.id, school_year: schoolYear, grade_level: levelOf(grade), student_type: 'New Student', status, form };
        if (status === 'enrolled') row.student_no = `2026-${String(no++).padStart(4, '0')}`;
        await admin.from('applications').insert(row);
        created++;
      };

      for (const grade of grades) {
        for (let i = 0; i < enrolled; i++) { await mk(grade, 'enrolled', i); en++; }
        for (let i = 0; i < pending; i++) { await mk(grade, 'submitted', 1000 + i); pe++; }
      }
      return json({ ok: true, created, enrolled: en, pending: pe });
    }

    return json({ error: 'Unknown action.' }, 400);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
