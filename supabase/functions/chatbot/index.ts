// supabase/functions/chatbot/index.ts
// NSDGA Admission Assistant — a grounded FAQ chatbot for applicants.
// Proxies to the Claude API server-side so the API key never reaches the browser.
// Scope: admission / enrollment / portal questions ONLY. It is given the school's
// facts below and told to refer anything outside that to the Registrar. It never
// sees real student records — only the short, non-sensitive `context` the page
// passes in (e.g. the applicant's own status label).
//
// Request:  { messages: [{ role: 'user'|'assistant', content: string }], context?: string }
// Response: { reply: string }  (or { error })
//
// Deploy:   supabase functions deploy chatbot
// Secret:   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//           (set it in the Supabase dashboard → Edge Functions → Secrets)
// Needs:    public.chat_rate_check() (see supabase/chatbot-ratelimit.sql).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RATE_LIMIT = 20;   // max chat requests ...
const RATE_WINDOW = 60;  // ... per this many seconds, per IP (abuse / cost guard)

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

const MODEL = 'claude-haiku-4-5';
const MAX_MESSAGES = 16;      // cap conversation length (cost + abuse guard)
const MAX_CHARS = 2000;       // cap per-message length
const MAX_CONTEXT = 600;      // cap page-supplied context

const SYSTEM = `You are the Admission Assistant for Nuestra Señora de Guia Academy of Marikina (NSDGA), a Catholic school in Marikina City, Philippines. You help applicants and parents with the school's ONLINE ADMISSION and the student portal. Be warm, concise, and clear.

LANGUAGE: Reply in the same language the person uses. Filipino/Taglish is welcome; plain English is fine too. Keep answers short (a few sentences or a short list).

WHAT YOU KNOW (use ONLY these facts — do not invent policies, fees, dates, or requirements):

Levels & grades: Elementary, Junior High School (Grades 7–10), and Senior High School (Grades 11–12). Student types: New Student, Transferee, Returnee.

Senior High strands/courses: the school sets which strands are offered, and the list can change with DepEd's curriculum. If the CONTEXT below lists the current strands, use exactly that list when asked; otherwise tell the applicant to check the strand dropdown on the application form rather than naming specific strands. Choosing a strand is required when entering Grade 11, and it carries over automatically to Grade 12.

Admission documents to prepare: PSA Birth Certificate, Report Card (Form 138), Good Moral Certificate, and a 2x2 picture. Advise applicants to prepare these; the Registrar confirms which are required for each case. Note: Form 137 is NOT submitted by the student — it is a confidential record transmitted directly school-to-school (the previous school forwards it to NSDGA), so do not ask the applicant to upload or bring it.

How to apply online (6 steps): (1) Create an account with email + password; (2) Fill in Personal Information (student + parent/guardian); (3) choose Grade & Student Type; (4) Academic Background; (5) upload the Document requirements; (6) Review and Submit. After submitting, a 6-digit verification code is emailed to confirm the application.

After submitting — application status flow: Submitted → Under Review → Enrolled. Status meanings:
- Submitted: the application was received.
- Under Review: the Registrar is checking the form and documents.
- Needs Correction: something must be fixed — open the form, update it, and resubmit.
- Enrolled: accepted. A Student Number is issued and the full student portal unlocks.
- Not Accepted: the application was not approved.
- Completed: the school year was finished.
Documents can be marked "Needs Re-upload" — upload a clearer copy if so.

Enrollment period: online admission is only open during the school's announced admission period. The current school year is 2026–2027. For exact opening/closing dates, tell them to check the portal announcements or contact the Registrar.

Accounts & login: the portal is login-only until a student is enrolled. If they forget their password, use "Forgot Password" (a code is emailed). Students can enable Two-Factor Authentication (MFA) in Settings after enrolling; if locked out of their MFA, contact the Registrar/Admin to reset it.

Contact: Registrar's Office — registrar@nsdgamarikina.edu.ph. Office hours: Monday–Friday 8:00 AM–5:00 PM, Saturday 8:00 AM–12:00 PM.

RULES:
- Only answer questions about NSDGA admission, enrollment, requirements, strands, status, documents, and using the portal. If asked anything unrelated (homework, general chit-chat, other schools, etc.), politely say you can only help with NSDGA admission and point them to the Registrar.
- If you are unsure or a question needs exact figures/dates/decisions (fees, tuition, specific deadlines, whether a specific person was accepted), say you don't have that detail and advise contacting the Registrar. Never guess.
- You cannot see the applicant's actual account, grades, or documents beyond any short status note provided to you. Do not claim to look anything up.
- Never ask for or repeat passwords, verification codes (OTP), or other people's personal information.
- You are an assistant, not an official decision — admission decisions are made by the Registrar.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) return json({ error: 'The assistant is not configured on the server.' }, 500);

  // Per-IP rate limit (F-04) so a script can't drain Anthropic credits. Fails
  // open: if the limiter itself errors, the chat still works.
  try {
    const sbUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (sbUrl && serviceKey) {
      const ip = (req.headers.get('cf-connecting-ip') || (req.headers.get('x-forwarded-for') || '').split(',')[0] || '').trim();
      const admin = createClient(sbUrl, serviceKey);
      const { data: allowed } = await admin.rpc('chat_rate_check', { p_ip: ip, p_limit: RATE_LIMIT, p_window_secs: RATE_WINDOW });
      if (allowed === false) {
        return json({ error: 'You are sending messages too quickly. Please wait a moment and try again.' }, 429);
      }
    }
  } catch { /* limiter unavailable — don't block legitimate users */ }

  try {
    const body = await req.json().catch(() => ({}));
    const rawMessages = Array.isArray(body?.messages) ? body.messages : [];
    const context = typeof body?.context === 'string' ? body.context.slice(0, MAX_CONTEXT) : '';

    // Sanitize + cap the conversation.
    const messages = rawMessages
      .filter((m: unknown): m is { role: string; content: string } =>
        !!m && (m as { role?: unknown }).role !== undefined && typeof (m as { content?: unknown }).content === 'string')
      .map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content).slice(0, MAX_CHARS),
      }))
      .slice(-MAX_MESSAGES);

    if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
      return json({ error: 'Please type a question.' }, 400);
    }

    const system = context ? `${SYSTEM}\n\nCONTEXT FOR THIS SESSION (non-sensitive, from the page the user is on): ${context}` : SYSTEM;

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ model: MODEL, max_tokens: 1024, system, messages }),
    });

    const data = await r.json();
    if (!r.ok) {
      return json({ error: data?.error?.message || 'The assistant is temporarily unavailable. Please try again.' }, 502);
    }
    const reply = (data?.content || [])
      .filter((b: { type?: string }) => b.type === 'text')
      .map((b: { text?: string }) => b.text || '')
      .join('\n')
      .trim();

    return json({ reply: reply || "Sorry, I couldn't come up with a reply. Please try rephrasing, or contact the Registrar." });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
