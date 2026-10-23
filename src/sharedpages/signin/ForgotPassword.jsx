// src/sharedpages/signin/ForgotPassword.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { AuthShell, Notice, inputClass, primaryButtonClass, EMAIL_RE } from './AuthShell';
import Captcha, { captchaEnabled } from './Captcha';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [sent, setSent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [captchaKey, setCaptchaKey] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(cleanEmail)) return setNotice({ type: 'error', text: 'Enter a valid email address.' });
    if (captchaEnabled && !captchaToken) return setNotice({ type: 'error', text: 'Complete the verification first.' });

    setLoading(true);
    setNotice(null);
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
      captchaToken: captchaToken || undefined,
    });
    setLoading(false);

    if (error && (error.status === 429 || /captcha/i.test(error.message))) {
      setNotice({
        type: 'error',
        text: error.status === 429 ? 'Too many requests. Wait a few minutes and try again.' : 'Verification failed. Try again.',
      });
      setCaptchaToken(null);
      setCaptchaKey((k) => k + 1);
      return;
    }
    // Same message whether or not the email exists, so accounts can't be probed.
    setSent(true);
  };

  if (sent) {
    return (
      <AuthShell title="Check your email" subtitle="If an account exists for that address, a reset link is on its way.">
        <Link to="/sign-in" className={primaryButtonClass}>Back to sign in</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Reset your password" subtitle="Enter your email and we'll send you a reset link.">
      <Notice notice={notice} />
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <input
          id="email" type="email" autoComplete="email" placeholder="you@example.com"
          value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} className={inputClass}
        />
        <Captcha onToken={setCaptchaToken} resetKey={captchaKey} />
        <button type="submit" disabled={loading} className={primaryButtonClass}>
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
      <p className="text-center text-sm">
        <Link to="/sign-in" className="font-medium text-green-700 hover:text-green-600">Back to sign in</Link>
      </p>
    </AuthShell>
  );
}