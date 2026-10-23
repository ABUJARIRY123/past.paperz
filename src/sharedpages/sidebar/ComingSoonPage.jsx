// ComingSoonPage.jsx - React + Tailwind
// Usage: <ComingSoonPage />
//        <ComingSoonPage title="Practice quizzes" launchDate="2026-12-01" />
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Hourglass, ArrowLeft, FileText, ClipboardCheck } from 'lucide-react';

const INK = '#16222E';
const PAPER = '#2F5D8C';   // blue
const SCHEME = '#2C7A5B';  // green
const RULE = '#D8DEE6';

const pad = (n) => String(n).padStart(2, '0');

// Returns { days, hours, minutes, seconds } until the date, or null if no date / already passed
function timeLeft(launchDate) {
  if (!launchDate) return null;
  const diff = new Date(launchDate).getTime() - Date.now();
  if (Number.isNaN(diff) || diff <= 0) return null;
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function ComingSoonPage({
  title = 'Something new is on the way',
  description = "We're working on this page and it will be available soon. Thanks for your patience.",
  launchDate = null,   // e.g. '2026-12-01' or '2026-12-01T09:00:00+03:00'
  backTo = '/',        // where the button goes
  backLabel = 'Back to home',
}) {
  const [left, setLeft] = useState(() => timeLeft(launchDate));

  useEffect(() => {
    if (!launchDate) return;
    setLeft(timeLeft(launchDate));
    const t = setInterval(() => setLeft(timeLeft(launchDate)), 1000);
    return () => clearInterval(t);
  }, [launchDate]);

  return (
    <div
      className="mt-20 flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-10 sm:px-8"
      style={{ background: '#F5F7FA', color: INK, fontFamily: '"Instrument Sans", system-ui, sans-serif' }}
    >
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Newsreader:opsz,wght@6..72,500;6..72,600&display=swap"
      />

      <div
        className="w-full max-w-xl rounded-lg bg-white p-6 text-center sm:p-10"
        style={{ border: `1px solid ${RULE}` }}
      >
        {/* Icon cluster: paper (blue) and scheme (green), echoing the papers page */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-md"
            style={{ background: `${PAPER}0F`, borderLeft: `4px solid ${PAPER}` }}
          >
            <FileText size={22} style={{ color: PAPER }} />
          </span>
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: INK }}
          >
            <Hourglass size={26} color="#fff" />
          </span>
          <span
            className="flex h-11 w-11 items-center justify-center rounded-md"
            style={{ background: `${SCHEME}0F`, borderLeft: `4px solid ${SCHEME}` }}
          >
            <ClipboardCheck size={22} style={{ color: SCHEME }} />
          </span>
        </div>

        <p
          className="mb-2 text-xs font-semibold uppercase tracking-widest"
          style={{ color: '#5B6978' }}
        >
          Coming soon
        </p>

        <h1
          className="text-3xl sm:text-4xl"
          style={{ fontFamily: 'Newsreader, Georgia, serif', fontWeight: 600 }}
        >
          {title}
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed" style={{ color: '#5B6978' }}>
          {description}
        </p>

        {left && (
          <div className="mt-8 grid grid-cols-4 gap-2 sm:gap-3" role="timer" aria-label="Time until launch">
            {[
              ['Days', left.days],
              ['Hours', left.hours],
              ['Minutes', left.minutes],
              ['Seconds', left.seconds],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-md py-3"
                style={{ background: '#F5F7FA', border: `1px solid ${RULE}` }}
              >
                <div
                  className="text-2xl tabular-nums sm:text-3xl"
                  style={{ fontFamily: 'Newsreader, Georgia, serif', fontWeight: 600 }}
                >
                  {label === 'Days' ? value : pad(value)}
                </div>
                <div className="mt-0.5 text-xs font-medium" style={{ color: '#8896A6' }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        )}

        <Link
          to={backTo}
          className="mt-8 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white focus:outline-none focus-visible:ring-2"
          style={{ background: INK }}
        >
          <ArrowLeft size={16} /> {backLabel}
        </Link>
      </div>
    </div>
  );
}