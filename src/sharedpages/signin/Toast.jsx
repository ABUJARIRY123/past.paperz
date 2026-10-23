// src/sharedpages/signin/Toast.jsx
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const STYLES = {
  error: {
    bar: 'border-l-red-600',
    icon: 'text-red-600',
    role: 'alert',
    path: 'M12 8v5m0 3.5h.01M12 3a9 9 0 100 18 9 9 0 000-18z',
  },
  success: {
    bar: 'border-l-green-600',
    icon: 'text-green-600',
    role: 'status',
    path: 'M8 12.5l3 3 5-6M12 3a9 9 0 100 18 9 9 0 000-18z',
  },
};

/**
 * Floating notification in the bottom right corner.
 * - Click anywhere on it, press the X, or press Escape to close it.
 * - It closes by itself after `duration` ms.
 * - Hovering or focusing it suspends the countdown, and it resumes when you move away.
 */
export default function Toast({ notice, onClose, duration = 6000 }) {
  const [paused, setPaused] = useState(false);
  const [shown, setShown] = useState(false);
  const remaining = useRef(duration);
  const startedAt = useRef(0);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // A new notice restarts the countdown and plays the entrance again.
  useEffect(() => {
    remaining.current = duration;
    setPaused(false);
    setShown(false);
    if (!notice) return undefined;
    const frame = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(frame);
  }, [notice, duration]);

  // Countdown. Pausing stops the timer and keeps the time that is left.
  useEffect(() => {
    if (!notice || paused) return undefined;
    startedAt.current = Date.now();
    const id = setTimeout(() => closeRef.current?.(), remaining.current);
    return () => {
      clearTimeout(id);
      remaining.current = Math.max(remaining.current - (Date.now() - startedAt.current), 0);
    };
  }, [notice, paused]);

  // Escape closes it.
  useEffect(() => {
    if (!notice) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') closeRef.current?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [notice]);

  if (!notice) return null;
  const style = STYLES[notice.type] || STYLES.error;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-end sm:inset-x-auto sm:right-4">
      <div
        role={style.role}
        aria-live={notice.type === 'error' ? 'assertive' : 'polite'}
        onClick={() => closeRef.current?.()}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        className={`pointer-events-auto flex w-full cursor-pointer items-start gap-3 rounded-lg border border-l-4 border-gray-200 bg-white px-4 py-3 shadow-lg transition-all duration-300 sm:max-w-sm ${style.bar} ${
          shown ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" className={`mt-0.5 h-5 w-5 shrink-0 ${style.icon}`} aria-hidden="true">
          <path d={style.path} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="flex-1 text-sm text-gray-900">{notice.text}</p>
        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={(e) => { e.stopPropagation(); closeRef.current?.(); }}
          className="shrink-0 rounded p-0.5 text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600"
        >
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>,
    document.body
  );
}