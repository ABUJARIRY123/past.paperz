// src/sharedpages/signin/ResetPassword.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { AuthShell, Notice, PasswordInput, primaryButtonClass } from './AuthShell';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(null); // null = checking, true/false = result
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  // The emailed link signs the user in with a short-lived recovery session.
  // App.jsx may have consumed the PASSWORD_RECOVERY event before this page mounted,
  // so check for an existing session as well as listening for the event.
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => active && setReady(Boolean(data.session)));
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' && active) setReady(true);
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (password.length < 8) return setNotice({ type: 'error', text: 'Use at least 8 characters for your password.' });
    if (password !== confirm) return setNotice({ type: 'error', text: 'The passwords do not match.' });

    setLoading(true);
    setNotice(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setLoading(false);
      setNotice({
        type: 'error',
        text: /different from the old/i.test(error.message)
          ? 'Choose a password you have not used before.'
          : 'We could not update your password. Request a new reset link and try again.',
      });
      return;
    }

    await supabase.auth.signOut();
    navigate('/sign-in', { replace: true, state: { message: 'Password updated. Sign in with your new password.' } });
  };

  if (ready === null) return <AuthShell title="Checking your link…" />;

  if (!ready) {
    return (
      <AuthShell title="This link has expired" subtitle="Reset links work once and expire after a short time.">
        <Link to="/forgot-password" className={primaryButtonClass}>Request a new link</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password">
      <Notice notice={notice} />
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <PasswordInput
          id="password" value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="New password (8+ characters)" autoComplete="new-password" disabled={loading}
        />
        <PasswordInput
          id="confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm new password" autoComplete="new-password" disabled={loading}
        />
        <button type="submit" disabled={loading} className={primaryButtonClass}>
          {loading ? 'Saving…' : 'Save new password'}
        </button>
      </form>
    </AuthShell>
  );
}