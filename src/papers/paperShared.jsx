// paperShared.jsx - pieces used by both PapersPage and FavouritesPage
import { Lock, Gem, Download, X } from 'lucide-react';
import { getAccessToken } from '../utils/api';

export const API = `${import.meta.env.VITE_API_BASE_URL}/api/papers`;

export const INK = '#16222E';
export const PAPER = '#2F5D8C';   // blue = question paper
export const SCHEME = '#2C7A5B';  // green = marking scheme
export const FAV = '#B4375A';     // rose = favourite
export const GEM = '#6B4FBB';     // purple = diamonds / locked
export const RULE = '#D8DEE6';

export const ROLE_OPTIONS = ['free', 'member', 'premium', 'sysadmin'];
export const ROLE_LABEL = { free: 'Free', member: 'Member', premium: 'Premium', sysadmin: 'Sysadmin' };

export const fmtSize = (b) =>
  !b ? '' : b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;

export const fmtCount = (n) => Number(n || 0).toLocaleString();

export const roleText = (roles) =>
  (roles || []).map((r) => ROLE_LABEL[r] || r).join(', ') || 'selected';

// fetch with the signed-in user's token; throws an Error carrying the server's message
export async function authFetch(url, opts = {}) {
  const token = await getAccessToken();
  const res = await fetch(url, {
    ...opts,
    headers: { ...(opts.headers || {}), Authorization: `Bearer ${token}` },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(
      new Error(body.message || body.error || `Request failed (${res.status})`),
      { errors: body.errors }
    );
  }
  return body;
}

// Who the paper is for, plus its status for this user
export function AudienceBadges({ roles, access }) {
  const chip = 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium';
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">      
      {access === 'unlocked' && (
        <span className={chip} style={{ background: `${GEM}14`, color: GEM }}>
          <Gem size={12} /> Unlocked
        </span>
      )}
      {access === 'locked' && (
        <span className={chip} style={{ background: `${GEM}14`, color: GEM }}>
          <Lock size={12} /> Locked
        </span>
      )}
    </div>
  );
}

export function FileCard({ color, Icon, label, url, name, size, onOpen, emptyText = 'No file uploaded yet' }) {
  if (!url) {
    return (
      <div
        className="flex items-center gap-3 rounded-md border border-dashed p-3 text-sm"
        style={{ borderColor: RULE, color: '#8896A6' }}
      >
        <Icon size={20} /> {emptyText}
      </div>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      download
      onClick={onOpen}
      className="group flex items-center gap-3 rounded-md p-3 focus:outline-none focus-visible:ring-2"
      style={{ background: `${color}0F`, borderLeft: `4px solid ${color}` }}
    >
      <Icon size={22} style={{ color }} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold" style={{ color }}>{label}</span>
        <span className="block truncate text-xs" style={{ color: '#5B6978' }}>
          {name}
          {size ? ` · ${fmtSize(size)}` : ''}
        </span>
      </span>
      <Download size={18} className="shrink-0 opacity-60 group-hover:opacity-100" style={{ color }} />
    </a>
  );
}

// Shown instead of the two file cards when the paper is locked for this user
export function LockedFiles({ paper, onUnlock }) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-dashed p-3 text-sm"
      style={{ borderColor: GEM, background: `${GEM}0A` }}
    >
      <span className="flex min-w-0 items-center gap-2" style={{ color: GEM }}>
        <Lock size={18} className="shrink-0" />
        <span>
           Unlock it to download it and or save it
          to favourites.
        </span>
      </span>
      <button
        onClick={onUnlock}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-white focus:outline-none focus-visible:ring-2"
        style={{ background: GEM }}
      >
        <Gem size={14} /> Unlock · {fmtCount(paper.diamond_cost)}
      </button>
    </div>
  );
}

// Confirmation before spending diamonds
export function UnlockDialog({ paper, balance, busy, error, onConfirm, onClose }) {
  const cost = Number(paper.diamond_cost || 0);
  const enough = balance >= cost;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Unlock paper"
        className="w-full max-w-md rounded-t-xl bg-white p-5 sm:rounded-xl"
        style={{ color: INK }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl" style={{ fontFamily: 'Newsreader, Georgia, serif', fontWeight: 600 }}>
            Unlock this paper?
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="rounded p-1 focus:outline-none focus-visible:ring-2"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-sm font-medium">{paper.title}</p>
        <p className="mt-1 text-sm" style={{ color: '#5B6978' }}>
          It will be yours permanently, and you can add it to your favourites.
        </p>

        <dl className="mt-4 space-y-1 rounded-md p-3 text-sm" style={{ background: '#F5F7FA' }}>
          <div className="flex justify-between"><dt>Cost</dt><dd className="font-medium">{fmtCount(cost)} diamonds</dd></div>
          <div className="flex justify-between"><dt>Your balance</dt><dd className="font-medium">{fmtCount(balance)} diamonds</dd></div>
          {enough && (
            <div className="flex justify-between" style={{ color: '#5B6978' }}>
              <dt>After unlocking</dt><dd>{fmtCount(balance - cost)} diamonds</dd>
            </div>
          )}
        </dl>

        {!enough && (
          <p className="mt-3 text-sm" style={{ color: '#8A2B2B' }}>
            You need {fmtCount(cost - balance)} more diamonds to unlock this paper.
          </p>
        )}
        {error && <p className="mt-3 text-sm" style={{ color: '#8A2B2B' }}>{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-md border px-3 py-2 text-sm font-medium"
            style={{ borderColor: RULE }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy || !enough}
            className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            style={{ background: GEM }}
          >
            <Gem size={14} /> {busy ? 'Unlocking…' : `Unlock for ${fmtCount(cost)}`}
          </button>
        </div>
      </div>
    </div>
  );
}