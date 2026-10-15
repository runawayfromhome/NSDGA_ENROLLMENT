// Cloudflare Turnstile — a privacy-friendly CAPTCHA ("I'm not a robot") that is
// usually invisible. Protects the public applicant sign-up from bots / mass
// account creation + OTP email abuse.
//
// Keys: set VITE_TURNSTILE_SITE_KEY (frontend) and TURNSTILE_SECRET (the
// create-applicant Edge Function) to your real Cloudflare keys before go-live.
// With no env key set we fall back to Cloudflare's OFFICIAL TEST site key, which
// always passes — so the widget is visible during demo/manual testing without a
// Cloudflare account. The matching test secret is the server-side default.
import { useEffect, useRef } from 'react';

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
// Cloudflare's documented "always passes" test site key.
const TEST_SITE_KEY = '1x00000000000000000000AA';
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || TEST_SITE_KEY;

let scriptPromise = null;
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT_SRC; s.async = true; s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => { scriptPromise = null; reject(new Error('Failed to load Turnstile.')); };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

// Props: onToken(token) — called with the token on success, '' on expire/error.
export default function Turnstile({ onToken }) {
  const boxRef = useRef(null);
  const widgetId = useRef(null);
  const cb = useRef(onToken);
  cb.current = onToken;

  useEffect(() => {
    let cancelled = false;
    loadTurnstile().then(() => {
      if (cancelled || !boxRef.current || !window.turnstile) return;
      if (widgetId.current !== null) return; // already rendered (StrictMode guard)
      widgetId.current = window.turnstile.render(boxRef.current, {
        sitekey: SITE_KEY,
        callback: (token) => cb.current?.(token),
        'expired-callback': () => cb.current?.(''),
        'error-callback': () => cb.current?.(''),
      });
    }).catch(() => { /* network blocked — leave the field empty, validation stops submit */ });

    return () => {
      cancelled = true;
      if (widgetId.current !== null && window.turnstile) {
        try { window.turnstile.remove(widgetId.current); } catch { /* ignore */ }
        widgetId.current = null;
      }
    };
  }, []);

  return <div ref={boxRef} className="min-h-[65px]" />;
}
