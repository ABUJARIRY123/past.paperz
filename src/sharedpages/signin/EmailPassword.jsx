import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { EyeIcon, EyeOffIcon, ShieldCheckIcon } from 'lucide-react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeInput(raw) {
  return raw.replace(/[<>]/g, '').replace(/[\x00-\x1F\x7F]/g, '');
}

export default function CredentialsComponent({ onSubmit, loading, disabled = false }) {
  const [formData, setFormData] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleChange = (e) => {
    if (disabled) return;
    const clean = sanitizeInput(e.target.value);
    setFormData({ ...formData, [e.target.id]: clean });
    if (e.target.id === 'email' && emailError) setEmailError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (disabled || loading) {
      e.stopPropagation();
      return false;
    }

    const email = (formData.email || '').trim();
    if (!EMAIL_RE.test(email)) {
      setEmailError('Enter a valid email address');
      return;
    }

    onSubmit({ ...formData, email });
  };

  return (
    <div className="space-y-6">
      {disabled && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <ShieldCheckIcon className="text-green-700 w-5 h-5" />
          <div className="text-sm text-green-900">
            <strong>Security Check Required:</strong> Complete the verification above to continue.
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div>
          <input
            id="email"
            type="email"
            required
            disabled={disabled || loading}
            aria-invalid={!!emailError}
            aria-describedby={emailError ? 'email-error' : undefined}
            className={`appearance-none rounded-lg relative block w-full px-3 py-2 border transition-all duration-300 ${
              disabled
                ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                : emailError
                ? 'border-red-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600'
            }`}
            placeholder={disabled ? 'Complete verification first' : 'examplemail@test.com'}
            onChange={handleChange}
            value={formData.email || ''}
          />
          {emailError && (
            <p id="email-error" className="mt-1 text-sm text-red-600">
              {emailError}
            </p>
          )}
        </div>

        <div className="relative w-full">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            required
            disabled={disabled || loading}
            placeholder={disabled ? 'Complete verification first' : 'Enter your password'}
            onChange={handleChange}
            value={formData.password || ''}
            className={`w-full pr-10 pl-3 py-2 border rounded-lg transition-all duration-300 ${
              disabled
                ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                : 'border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600'
            }`}
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => setShowPassword(!showPassword)}
            className={`absolute right-3 top-[50%] transform -translate-y-1/2 bg-transparent border-none ${
              disabled ? 'cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            {showPassword ? (
              <EyeOffIcon className={`w-5 h-5 ${disabled ? 'text-gray-300' : 'text-gray-500'}`} />
            ) : (
              <EyeIcon className={`w-5 h-5 ${disabled ? 'text-gray-300' : 'text-gray-500'}`} />
            )}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading || disabled}
          className={`cursor-pointer group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg transition-all duration-300 ${
            disabled
              ? 'text-gray-400 bg-gray-200 cursor-not-allowed'
              : loading
              ? 'text-white bg-gray-400 cursor-not-allowed'
              : 'text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600'
          }`}
        >
          {loading ? (
            <div className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Signing In...
            </div>
          ) : disabled ? (
            <div className="flex items-center">
              <ShieldCheckIcon className="w-5 h-5 mr-2" />
              Complete Security Check
            </div>
          ) : (
            'Sign In'
          )}
        </button>

        <div className="text-center mt-4">
          <span className="text-gray-600">Forgot Password? </span>
          <Link
            to="/passwordreset"
            className="font-medium text-green-700 hover:text-green-600 transition-colors duration-300"
          >
            Reset
          </Link>
        </div>
      </form>
    </div>
  );
}