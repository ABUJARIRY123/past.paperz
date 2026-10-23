// src/sharedpages/signin/SignUp.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { USER_TYPES } from '../../components/roles';
import { AuthShell, PasswordInput, inputClass, primaryButtonClass, EMAIL_RE } from './AuthShell';
import Captcha, { captchaEnabled } from './Captcha';
import Toast from './Toast';

// Values must match the allowed list in the handle_new_user() trigger.
const CURRICULA = [
  { value: 'cambridge', label: 'Cambridge' },
  { value: 'igcse', label: 'IGCSE' },
  { value: 'cbc', label: 'CBC (Kenya)' },
  { value: '844', label: '8-4-4' },
  { value: 'ib', label: 'IB' },
  { value: 'american', label: 'American' },
];
const ALLOWED_CURRICULA = new Set(CURRICULA.map((c) => c.value));

// Keep these in step with the CHECK constraints in add_school_curricula.sql.
const LIMITS = { name: 100, organisation: 150, email: 254, passwordBytes: 72 };

// Control characters, zero-width characters and bidi overrides (used for spoofing).
/* eslint-disable no-control-regex */
const INVISIBLE_RE = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028\u2029\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/g;
const HAS_INVISIBLE_RE = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028\u2029\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/;
/* eslint-enable no-control-regex */

// Allowlists: any character NOT matched here is removed as the user types or pastes.
// Names: letters (any language), accents, spaces, apostrophe, full stop, hyphen.
const NAME_DISALLOWED = /[^\p{L}\p{M}\s'’.\-]/gu;
// Organisations: the same plus digits and & , ( ) /
const ORG_DISALLOWED = /[^\p{L}\p{M}\p{N}\s'’.,&()/\-]/gu;
// Emails: the characters valid in an address, no spaces.
const EMAIL_DISALLOWED = /[^A-Za-z0-9.!#$%&'*+/=?^_`{|}~@\-]/g;

const strip = (v, disallowed) =>
  String(v ?? '')
    .replace(/\s+/g, ' ')
    .replace(INVISIBLE_RE, '')
    .replace(disallowed, '')
    .replace(/\s+/g, ' ');

// While typing: strip bad characters but keep a single trailing space so words can be separated.
const live = (disallowed) => (v) => strip(v, disallowed).replace(/^ /, '');
// On submit: normalise Unicode too, then trim.
const clean = (v, disallowed) => strip(String(v ?? '').normalize('NFKC'), disallowed).trim();

const liveName = live(NAME_DISALLOWED);
const liveOrg = live(ORG_DISALLOWED);
const liveEmail = (v) => String(v ?? '').replace(/\s/g, '').replace(INVISIBLE_RE, '').replace(EMAIL_DISALLOWED, '');

const hasLetter = (v) => /\p{L}/u.test(v);
const byteLength = (v) => new TextEncoder().encode(v).length;

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="M4.5 10.5l3.5 3.5 7.5-8"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SignUp() {
  const [form, setForm] = useState({
    full_name: '', user_type: '', organisation_name: '', email: '', password: '', confirm: '',
    school_curricula: [],
  });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [done, setDone] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [captchaKey, setCaptchaKey] = useState(0);

  const selectedType = USER_TYPES.find((t) => t.value === form.user_type);

  // Every keystroke and paste passes through the field's sanitiser before it reaches state.
  const set = (key, sanitizer = (v) => v) => (e) => {
    const value = sanitizer(e.target.value);
    setForm((f) => ({ ...f, [key]: value }));
  };

  const toggleCurriculum = (value) =>
    setForm((f) => ({
      ...f,
      school_curricula: f.school_curricula.includes(value)
        ? f.school_curricula.filter((c) => c !== value)
        : [...f.school_curricula, value],
    }));

  // Builds the final sanitised values once. Validation and submission both use these, never the raw form.
  const sanitize = () => ({
    full_name: clean(form.full_name, NAME_DISALLOWED),
    user_type: selectedType ? selectedType.value : '',
    organisation_name: selectedType?.needsOrganisation ? clean(form.organisation_name, ORG_DISALLOWED) : null,
    email: liveEmail(form.email.normalize('NFKC')).toLowerCase(),
    school_curricula: [...new Set(form.school_curricula.filter((c) => ALLOWED_CURRICULA.has(c)))],
  });

  const validate = (v) => {
    if (v.full_name.length < 2 || !hasLetter(v.full_name)) return 'Enter your full name.';
    if (v.full_name.length > LIMITS.name) return `Your name must be ${LIMITS.name} characters or fewer.`;
    if (!selectedType) return 'Choose what describes you best.';
    if (selectedType.needsOrganisation) {
      if (v.organisation_name.length < 2 || !hasLetter(v.organisation_name))
        return `Enter your ${selectedType.organisationLabel.toLowerCase()}.`;
      if (v.organisation_name.length > LIMITS.organisation)
        return `The ${selectedType.organisationLabel.toLowerCase()} must be ${LIMITS.organisation} characters or fewer.`;
    }
    if (v.school_curricula.length === 0) return 'Select at least one curriculum.';
    if (v.email.length > LIMITS.email || HAS_INVISIBLE_RE.test(v.email) || !EMAIL_RE.test(v.email))
      return 'Enter a valid email address.';
    // Passwords are never trimmed or altered, only length checked. 72 bytes is the bcrypt limit.
    if (form.password.length < 8) return 'Use at least 8 characters for your password.';
    if (byteLength(form.password) > LIMITS.passwordBytes) return 'Your password is too long. Use 72 bytes or fewer.';
    if (form.password !== form.confirm) return 'The passwords do not match.';
    if (captchaEnabled && !captchaToken) return 'Complete the verification first.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const values = sanitize();
    const problem = validate(values);
    if (problem) return setNotice({ type: 'error', text: problem });

    setLoading(true);
    setNotice(null);

    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: form.password,
      options: {
        // Read by the handle_new_user() trigger, which sanitises again. Role is NOT sent: everyone starts as 'free'.
        data: {
          full_name: values.full_name,
          user_type: values.user_type,
          organisation_name: values.organisation_name,
          school_curricula: values.school_curricula,
        },
        emailRedirectTo: `${window.location.origin}/sign-in`,
        captchaToken: captchaToken || undefined,
      },
    });
    setLoading(false);

    if (error) {
      setNotice({
        type: 'error',
        text: error.status === 429
          ? 'Too many attempts. Wait a few minutes and try again.'
          : error.message || 'We could not create your account.',
      });
      setCaptchaToken(null);
      setCaptchaKey((k) => k + 1);
      return;
    }

    // With email-enumeration protection on, an existing email returns a user with no identities.
    if (data.user && data.user.identities?.length === 0) {
      setNotice({ type: 'error', text: 'An account with this email already exists. Sign in or reset your password.' });
      setCaptchaToken(null);
      setCaptchaKey((k) => k + 1);
      return;
    }

    // If email confirmation is off, a session exists and App.jsx signs the user straight in.
    if (!data.session) setDone(true);
  };

  if (done) {
    return (
      <AuthShell title="Check your email" subtitle={`We sent a confirmation link to ${form.email.trim()}.`}>
        <p className="text-sm text-gray-600 text-center">
          Open the link to activate your account, then sign in.
        </p>
        <Link to="/sign-in" className={primaryButtonClass}>Go to sign in</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Free to start. Upgrade whenever you need more."
      maxWidth="max-w-2xl"
    >
      {/* Floats in the bottom right. Click to close, hover to suspend the auto close. */}
      <Toast notice={notice} onClose={() => setNotice(null)} />

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-gray-900">I am a…</legend>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {USER_TYPES.map((t) => {
              const active = form.user_type === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setForm((f) => ({ ...f, user_type: t.value }))}
                  className={`rounded-lg border px-3 py-2 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-green-600 ${
                    active ? 'border-green-600 bg-green-50' : 'border-gray-300 bg-white hover:border-green-400'
                  }`}
                >
                  <span className="block text-sm font-medium text-gray-900">{t.label}</span>
                  <span className="block text-xs text-gray-600">{t.hint}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Asked for every user type. Several can be selected, each shows a tick. */}
        <fieldset>
          <legend className="mb-2 flex w-full items-baseline justify-between text-sm font-medium text-gray-900">
            <span>Which curricula are you associated with?</span>
            <span className="text-xs font-normal text-gray-600">
              {form.school_curricula.length > 0
                ? `${form.school_curricula.length} selected`
                : 'Select all that apply'}
            </span>
          </legend>
          <div role="group" className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CURRICULA.map((c) => {
              const active = form.school_curricula.includes(c.value);
              return (
                <button
                  key={c.value}
                  type="button"
                  role="checkbox"
                  aria-checked={active}
                  onClick={() => toggleCurriculum(c.value)}
                  disabled={loading}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-green-600 ${
                    active ? 'border-green-600 bg-green-50' : 'border-gray-300 bg-white hover:border-green-400'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                      active ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300 bg-white text-transparent'
                    }`}
                  >
                    <CheckIcon />
                  </span>
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Two fields per row on wider screens, one column on phones */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <input
            id="full_name" type="text" autoComplete="name" placeholder="Full name"
            maxLength={LIMITS.name} spellCheck={false}
            value={form.full_name} onChange={set('full_name', liveName)} disabled={loading} className={inputClass}
          />

          {selectedType?.needsOrganisation && (
            <input
              id="organisation_name" type="text" autoComplete="organization"
              placeholder={selectedType.organisationLabel}
              maxLength={LIMITS.organisation} spellCheck={false}
              value={form.organisation_name} onChange={set('organisation_name', liveOrg)} disabled={loading} className={inputClass}
            />
          )}

          {/* Takes the full row when the organisation field is showing, so no field is left alone */}
          <input
            id="email" type="email" autoComplete="email" placeholder="you@example.com"
            maxLength={LIMITS.email} spellCheck={false}
            value={form.email} onChange={set('email', liveEmail)} disabled={loading}
            className={`${inputClass} ${selectedType?.needsOrganisation ? 'sm:col-span-2' : ''}`}
          />

          <PasswordInput
            id="password" value={form.password} onChange={set('password')}
            placeholder="Password (8+ characters)" autoComplete="new-password" disabled={loading}
          />
          <PasswordInput
            id="confirm" value={form.confirm} onChange={set('confirm')}
            placeholder="Confirm password" autoComplete="new-password" disabled={loading}
          />
        </div>

        <Captcha onToken={setCaptchaToken} resetKey={captchaKey} />
        <button type="submit" disabled={loading} className={primaryButtonClass}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link to="/sign-in" className="font-medium text-green-700 hover:text-green-600">Sign in</Link>
      </p>
    </AuthShell>
  );
}