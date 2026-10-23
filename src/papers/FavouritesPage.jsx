// FavouritesPage.jsx - React + Tailwind
// Usage: <FavouritesPage user={profile} />
// Shows only the papers the signed-in user has saved. Same look as PapersPage.
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshCw, FileText, ClipboardCheck, Download, Search, Heart,
} from 'lucide-react';
import { getAccessToken } from '../utils/api';

const API = `${import.meta.env.VITE_API_BASE_URL}/api/papers`;

const INK = '#16222E';
const PAPER = '#2F5D8C';   // blue = question paper
const SCHEME = '#2C7A5B';  // green = marking scheme
const FAV = '#B4375A';     // rose = favourite
const RULE = '#D8DEE6';

const fmtSize = (b) =>
  !b ? '' : b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;

const fmtCount = (n) => Number(n || 0).toLocaleString();

export default function FavouritesPage() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [query, setQuery] = useState('');
  const [curriculum, setCurriculum] = useState('all');

  const authFetch = useCallback(async (url, opts = {}) => {
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
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const body = await authFetch(`${API}/myfavourites`);
      setPapers(body.papers || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Counts one download when a file card is clicked (same behaviour as the main papers page).
  const trackDownload = useCallback(
    (paperId) => {
      setPapers((list) =>
        list.map((p) => (p.id === paperId ? { ...p, downloads: (p.downloads ?? 0) + 1 } : p))
      );
      authFetch(`${API}/download/${paperId}`, { method: 'POST', keepalive: true })
        .then((body) => {
          if (typeof body.downloads === 'number') {
            setPapers((list) =>
              list.map((p) => (p.id === paperId ? { ...p, downloads: body.downloads } : p))
            );
          }
        })
        .catch(() => {
          setPapers((list) =>
            list.map((p) =>
              p.id === paperId ? { ...p, downloads: Math.max(0, (p.downloads ?? 1) - 1) } : p
            )
          );
        });
    },
    [authFetch]
  );

  // Removes this user's favourite only (DELETE). Other users who saved the paper keep theirs.
  // The card disappears at once and returns if the request fails.
  const removeFavourite = useCallback(
    async (paper) => {
      const index = papers.findIndex((p) => p.id === paper.id);
      setPapers((list) => list.filter((p) => p.id !== paper.id));
      try {
        const body = await authFetch(`${API}/removefavourite/${paper.id}`, { method: 'DELETE' });
        setToast(body.message || 'Removed from favourites.');
      } catch (e) {
        setPapers((list) => {
          if (list.some((p) => p.id === paper.id)) return list;
          const next = [...list];
          next.splice(Math.max(0, index), 0, paper);
          return next;
        });
        setToast(e.message || 'Could not update favourites');
      }
    },
    [authFetch, papers]
  );

  const curricula = useMemo(
    () => [...new Set(papers.map((p) => p.curriculum).filter(Boolean))].sort(),
    [papers]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return papers.filter(
      (p) =>
        (curriculum === 'all' || p.curriculum === curriculum) &&
        (!q || [p.title, p.subject, p.level, p.year, p.curriculum].join(' ').toLowerCase().includes(q))
    );
  }, [papers, query, curriculum]);

  return (
    <div
      className="mt-20 min-h-screen px-4 py-8 sm:px-8"
      style={{ background: '#F5F7FA', color: INK, fontFamily: '"Instrument Sans", system-ui, sans-serif' }}
    >
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Newsreader:opsz,wght@6..72,500;6..72,600&display=swap"
      />

      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1
              className="inline-flex items-center gap-3 text-3xl"
              style={{ fontFamily: 'Newsreader, Georgia, serif', fontWeight: 600 }}
            >
              <Heart size={26} fill={FAV} style={{ color: FAV }} />
              My favourites
            </h1>
            <p className="mt-1 text-sm" style={{ color: '#5B6978' }}>
              {papers.length
                ? `${papers.length} saved ${papers.length === 1 ? 'paper' : 'papers'}, newest first.`
                : 'Papers you save will appear here.'}
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 disabled:opacity-60"
            style={{ borderColor: RULE }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </header>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap gap-3">
          <label className="relative min-w-[220px] flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: '#8896A6' }}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your favourites by title, subject, level or year"
              className="w-full rounded-md border bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus-visible:ring-2"
              style={{ borderColor: RULE }}
            />
          </label>
          {curricula.length > 1 && (
            <select
              value={curriculum}
              onChange={(e) => setCurriculum(e.target.value)}
              className="rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2"
              style={{ borderColor: RULE }}
            >
              <option value="all">All curricula</option>
              {curricula.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
        </div>

        {/* Column key */}
        <div
          className="mt-6 hidden grid-cols-2 gap-4 px-1 text-xs font-medium sm:grid"
          style={{ color: '#5B6978' }}
        >
          <span className="flex items-center gap-2">
            <i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: PAPER }} />
            Question paper
          </span>
          <span className="flex items-center gap-2">
            <i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: SCHEME }} />
            Marking scheme
          </span>
        </div>

        {/* List */}
        <div className="mt-2 space-y-3">
          {error && (
            <div
              className="rounded-md border bg-white p-4 text-sm"
              style={{ borderColor: '#E3B4B4', color: '#8A2B2B' }}
            >
              {error}{' '}
              <button onClick={load} className="ml-2 font-medium underline">
                Try again
              </button>
            </div>
          )}

          {loading &&
            !papers.length &&
            [0, 1, 2].map((i) => (
              <div key={i} className="grid animate-pulse gap-4 sm:grid-cols-2">
                <div className="h-24 rounded-lg bg-white" style={{ border: `1px solid ${RULE}` }} />
                <div className="h-24 rounded-lg bg-white" style={{ border: `1px solid ${RULE}` }} />
              </div>
            ))}

          {!loading && !error && visible.length === 0 && (
            <div
              className="rounded-lg border border-dashed bg-white p-10 text-center text-sm"
              style={{ borderColor: RULE, color: '#5B6978' }}
            >
              {papers.length === 0
                ? 'No favourites yet. Tap the heart on any paper to save it here.'
                : 'No favourites match your search.'}
            </div>
          )}

          {visible.map((p) => (
            <article
              key={p.id}
              className="rounded-lg bg-white p-3 sm:p-4"
              style={{ border: `1px solid ${RULE}` }}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2
                    className="truncate text-lg"
                    style={{ fontFamily: 'Newsreader, Georgia, serif', fontWeight: 600 }}
                  >
                    {p.title}
                  </h2>
                  <p className="text-sm" style={{ color: '#5B6978' }}>
                    {[p.subject, p.level, p.year, p.curriculum].filter(Boolean).join(' · ')}
                  </p>
                  <p
                    className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium"
                    style={{ color: '#5B6978' }}
                    title="Total downloads"
                  >
                    <Download size={13} />
                    {fmtCount(p.downloads)} {Number(p.downloads) === 1 ? 'download' : 'downloads'}
                  </p>
                </div>
                <button
                  onClick={() => removeFavourite(p)}
                  aria-pressed="true"
                  aria-label={`Remove ${p.title} from favourites`}
                  title="Remove from favourites"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm font-medium focus:outline-none focus-visible:ring-2"
                  style={{ borderColor: FAV, background: `${FAV}0F`, color: FAV }}
                >
                  <Heart size={14} fill={FAV} />
                  <span className="hidden sm:inline">Saved</span>
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <FileCard
                  color={PAPER}
                  Icon={FileText}
                  label="Question paper"
                  url={p.paper_url}
                  name={p.paper_name}
                  size={p.paper_size}
                  onOpen={() => trackDownload(p.id)}
                />
                <FileCard
                  color={SCHEME}
                  Icon={ClipboardCheck}
                  label="Marking scheme"
                  url={p.scheme_url}
                  name={p.scheme_name}
                  size={p.scheme_size}
                  emptyText="No marking scheme uploaded yet"
                  onOpen={() => trackDownload(p.id)}
                />
              </div>
            </article>
          ))}
        </div>
      </div>

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-md px-4 py-2 text-sm text-white shadow-lg"
          style={{ background: INK }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function FileCard({ color, Icon, label, url, name, size, onOpen, emptyText = 'No file uploaded yet' }) {
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