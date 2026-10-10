// src/components/ChatbotWidget.jsx
// Floating "Admission Assistant" chat bubble for applicants. Answers enrollment
// FAQs by calling the `chatbot` Edge Function (which proxies to the Claude API —
// the key stays server-side). Scoped to the applicant experience (Apply wizard +
// Application Status). Pass an optional `context` string so the bot knows where
// the user is (e.g. their status label) — keep it NON-sensitive.
import { useEffect, useRef, useState } from 'react';
import { HiOutlineChat, HiOutlineX, HiOutlinePaperAirplane } from 'react-icons/hi';
import { supabase } from '../lib/supabase';

const SUGGESTIONS = [
  'Anong mga requirements para mag-enroll?',
  'Paano mag-apply online?',
  'Ano ibig sabihin ng "Under Review"?',
  'Anong strand ang pwede sa Senior High?',
];

const GREETING = {
  role: 'assistant',
  content:
    "Hi! 👋 Ako ang Admission Assistant ng NSDGA. Pwede mo akong tanungin tungkol sa requirements, paano mag-apply, strands, o ang status ng application mo. Paano kita matutulungan?",
};

const ChatbotWidget = ({ context = '' }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, open]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const send = async (text) => {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setError('');
    setInput('');
    // Build the history we send (exclude the static greeting; keep real turns).
    const history = messages.filter((m) => m !== GREETING);
    const next = [...messages, { role: 'user', content: q }];
    setMessages(next);
    setLoading(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('chatbot', {
        body: { messages: [...history, { role: 'user', content: q }], context },
      });
      if (fnErr) {
        // On a non-2xx, supabase-js hides the body behind a generic message —
        // dig out the real { error } we returned so the reason is visible.
        let msg = fnErr.message || 'Request failed';
        try { const body = await fnErr.context?.json(); if (body?.error) msg = body.error; } catch { /* keep generic */ }
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);
      setMessages((m) => [...m, { role: 'assistant', content: data.reply }]);
    } catch (e) {
      setError(e.message || 'The assistant is unavailable right now.');
      setMessages((m) => m.slice(0, -1)); // roll back the unanswered question
      setInput(q); // let them retry without retyping
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* Launcher bubble */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open the Admission Assistant chat"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-[#800000] text-white shadow-xl hover:bg-[#6b0000] transition-all active:scale-95 cursor-pointer"
        >
          <HiOutlineChat size={22} />
          <span className="hidden sm:inline text-sm font-bold">Need help?</span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-5 sm:right-5 z-50 sm:w-[380px] sm:max-h-[70vh] sm:rounded-2xl bg-white shadow-2xl flex flex-col border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#800000] text-white shrink-0">
            <div className="flex items-center gap-2">
              <HiOutlineChat size={20} />
              <div>
                <p className="text-sm font-bold leading-tight">Admission Assistant</p>
                <p className="text-[10px] opacity-80 leading-tight">NSDGA · FAQ helper</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="p-1 rounded hover:bg-white/15 cursor-pointer">
              <HiOutlineX size={20} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8F9FA]">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap break-words ${
                    m.role === 'user'
                      ? 'bg-[#800000] text-white rounded-br-sm'
                      : 'bg-white text-slate-700 border border-gray-100 rounded-bl-sm shadow-sm'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm shadow-sm px-4 py-3 flex gap-1">
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {/* Starter suggestions (only before the first question) */}
            {messages.length === 1 && !loading && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-left text-[12px] px-3 py-1.5 rounded-full bg-white border border-[#800000]/20 text-[#800000] hover:bg-[#800000]/5 transition-colors cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {error && <p className="text-[12px] text-red-500 text-center">{error}</p>}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-100 bg-white shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Type your question…"
                maxLength={2000}
                className="flex-1 resize-none max-h-24 px-3 py-2 text-[13px] border border-gray-200 rounded-xl outline-none focus:border-[#800000] bg-[#F8F9FA]"
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                aria-label="Send message"
                className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-[#800000] text-white hover:bg-[#6b0000] disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
              >
                <HiOutlinePaperAirplane size={18} className="rotate-90" />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-1.5">
              AI assistant · For official decisions, contact the Registrar.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;
