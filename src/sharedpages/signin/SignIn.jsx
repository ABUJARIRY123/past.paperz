// src/sharedpages/signin/SignIn.jsx
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { supabase } from '../../supabaseClient';
import { DASHBOARD_BY_ROLE } from '../../components/roles';
import { AuthShell, PasswordInput, inputClass, primaryButtonClass, EMAIL_RE } from './AuthShell';
import Captcha, { captchaEnabled } from './Captcha';
import Toast from './Toast';

function friendlyError(error) {
  if (error.code === 'email_not_confirmed' || /not confirmed/i.test(error.message))
    return 'Confirm your email first. Check your inbox for the link we sent.';
  if (error.status === 429 || error.code === 'over_request_rate_limit')
    return 'Too many attempts. Wait a few minutes and try again.';
  if (/captcha/i.test(error.message))
    return 'Verification failed. Complete the check again.';
  if (error.code === 'invalid_credentials' || /invalid login/i.test(error.message))
    return 'Email or password is incorrect.';
  return 'We could not sign you in. Try again.';
}

export default function SignIn() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [captchaKey, setCaptchaKey] = useState(0);

  useEffect(() => {
    if (location.state?.message) setNotice({ type: 'success', text: location.state.message });
  }, [location.state]);

  // App.jsx loads the profile after sign-in; once it lands, go to the role's dashboard.
  useEffect(() => {
    if (currentUser) navigate(DASHBOARD_BY_ROLE[currentUser.role] ?? '/', { replace: true });
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(cleanEmail)) return setNotice({ type: 'error', text: 'Enter a valid email address.' });
    if (!password) return setNotice({ type: 'error', text: 'Enter your password.' });
    if (captchaEnabled && !captchaToken) return setNotice({ type: 'error', text: 'Complete the verification first.' });

    setLoading(true);
    setNotice(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
      options: captchaToken ? { captchaToken } : undefined,
    });
    setLoading(false);

    if (error) {
      setNotice({ type: 'error', text: friendlyError(error) });
      setCaptchaToken(null);
      setCaptchaKey((k) => k + 1);
    }
    // On success, onAuthStateChange in App.jsx does the rest.
  };

  return (
    <AuthShell title="Sign in" subtitle="Welcome back.">
      {/* Floats in the bottom right. Click to close, hover to suspend the auto close. */}
      <Toast notice={notice} onClose={() => setNotice(null)} />

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={loading}
          className={inputClass}
        />
        <PasswordInput
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Your password"
          autoComplete="current-password"
          disabled={loading}
        />
        <Captcha onToken={setCaptchaToken} resetKey={captchaKey} />
        <button type="submit" disabled={loading} className={primaryButtonClass}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="flex justify-between text-sm">
        <Link to="/forgot-password" className="font-medium text-green-700 hover:text-green-600">
          Forgot password?
        </Link>
        <Link to="/sign-up" className="font-medium text-green-700 hover:text-green-600">
          Create account
        </Link>
      </div>
    </AuthShell>
  );
}