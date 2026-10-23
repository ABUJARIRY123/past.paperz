// src/sharedpages/signin/Captcha.jsx
// Cloudflare Turnstile. Replaces the Firebase reCAPTCHA component.
// Enable it in Supabase: Authentication -> Attack Protection -> CAPTCHA -> Turnstile,
// and paste the secret key there. Put the SITE key in VITE_TURNSTILE_SITE_KEY.
// If the env var is missing, the widget is skipped (use only while CAPTCHA is off in Supabase).
import React, { useEffect, useRef } from 'react';

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
export const captchaEnabled = Boolean(SITE_KEY);

let scriptPromise;
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

// Tokens are single-use: bump `resetKey` after every submit attempt to get a fresh one.
export default function Captcha({ onToken, resetKey = 0 }) {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    if (!SITE_KEY) return undefined;
    let cancelled = false;

    loadTurnstile()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        widgetRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          callback: (token) => onTokenRef.current(token),
          'expired-callback': () => onTokenRef.current(null),
          'error-callback': () => onTokenRef.current(null),
        });
      })
      .catch(() => onTokenRef.current(null));

    return () => {
      cancelled = true;
      if (widgetRef.current != null && window.turnstile) {
        try { window.turnstile.remove(widgetRef.current); } catch { /* already gone */ }
      }
      widgetRef.current = null;
    };
  }, [resetKey]);

  if (!SITE_KEY) return null;
  return <div ref={containerRef} className="flex justify-center" />;
}