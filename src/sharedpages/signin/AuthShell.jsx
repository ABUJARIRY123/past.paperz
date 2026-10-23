// src/sharedpages/signin/AuthShell.jsx
// Shared layout + inputs for sign in, sign up, forgot and reset password.
import React, { useState } from 'react';
import { EyeIcon, EyeOffIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react';
import logo from '../../assets/logo.png';

export const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 transition-all duration-300 ' +
  'focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400';

export const primaryButtonClass =
  'w-full flex justify-center items-center rounded-lg py-2 px-4 text-sm font-medium text-white transition-all duration-300 ' +
  'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 ' +
  'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-400';

// maxWidth is a Tailwind class (max-w-md, max-w-xl, max-w-2xl...). Defaults to max-w-md.
export function AuthShell({ title, subtitle, children, maxWidth = 'max-w-md' }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className={`${maxWidth} w-full space-y-6 bg-white rounded-2xl shadow-xl p-8 border border-green-100`}>
        <div className="flex justify-center">
          <img src={logo} alt="Logo" className="h-14 w-auto object-contain" />
        </div>
        {title && (
          <div className="text-center">
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function Notice({ notice }) {
  if (!notice) return null;
  const ok = notice.type === 'success';
  const Icon = ok ? CheckCircleIcon : XCircleIcon;
  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${
        ok ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
      }`}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <p>{notice.text}</p>
    </div>
  );
}

export function PasswordInput({ id, value, onChange, placeholder, autoComplete, disabled }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative w-full">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        required
        className={`${inputClass} pr-10`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer"
      >
        {show ? <EyeOffIcon className="w-5 h-5 text-gray-500" /> : <EyeIcon className="w-5 h-5 text-gray-500" />}
      </button>
    </div>
  );
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;