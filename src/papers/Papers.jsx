// PapersPage.jsx - React + Tailwind
// Usage: <PapersPage user={profile} />
//   user: the profile from /me: { id, role, school_curricula }
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshCw, Plus, Pencil, FileText, ClipboardCheck, Download, X, Search, Heart, Gem,
} from 'lucide-react';
import {
  API, INK, PAPER, SCHEME, FAV, GEM, RULE, ROLE_OPTIONS, ROLE_LABEL,
  fmtCount, authFetch, AudienceBadges, FileCard, LockedFiles, UnlockDialog,
} from './paperShared';

// Dropdown choices. Values already used by saved papers are merged in automatically.
const BASE_CURRICULA = [
  'Cambridge', 'IGCSE', 'CBC', '8-4-4', 'IB', 'American',
];
const BASE_SUBJECTS = ['Mathematics', 'Science', 'English'];
const GRADES = Array.from({ length: 13 }, (_, i) => `Grade ${i + 1}`);
const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: THIS_YEAR - 1989 }, (_, i) => String(THIS_YEAR - i));

const merge = (base, extra) => [...new Set([...base, ...extra.filter(Boolean)])];

// Accepts the profile directly, or wrapped as { profile } / { user }.
const resolveRole = (user) => {
  const p = user?.role != null ? user : user?.profile ?? user?.user ?? user;
  return String(p?.role ?? '').trim().toLowerCase();
};

export default function PapersPage({ user }) {
  // The server's verified role (from the database) wins over whatever the parent passes.
  const [serverRole, setServerRole] = useState('');
  const role = serverRole || resolveRole(user);
  const isAdmin = role === 'sysadmin';

  const [papers, setPapers] = useState([]);
  const [favourites, setFavourites] = useState(() => new Set()); // paper ids this user has saved
  const [diamonds, setDiamonds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [query, setQuery] = useState('');
  const [curriculum, setCurriculum] = useState('all');
  const [tab, setTab] = useState('all'); // 'all' | 'favourites'
  const [editing, setEditing] = useState(null); // null = closed, {} = add, paper = edit
  const [unlocking, setUnlocking] = useState(null); // paper being confirmed for unlock
  const [unlockBusy, setUnlockBusy] = useState(false);
  const [unlockError, setUnlockError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const body = await authFetch(`${API}/allpapers`);
      const list = body.papers || [];
      setPapers(list);
      // Favourites come from the database on every load, so they persist across sessions
      setFavourites(
        new Set([...(body.favourites || []), ...list.filter((p) => p.is_favourite).map((p) => p.id)])
      );
      setDiamonds(Number(body.viewer?.diamonds ?? 0));
      setServerRole(String(body.viewer?.role ?? '').trim().toLowerCase());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Counts one download when a file card is clicked. The count goes up on screen straight away
  // and is replaced by the server's number when it replies.
  const trackDownload = useCallback((paperId) => {
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
  }, []);

  // Adds (POST) or removes (DELETE) this user's favourite. The heart updates at once and reverts on failure.
  // Removing only deletes this user's row; other users who saved the paper keep theirs.
  const setFavourite = useCallback(async (paperId, makeFav) => {
    const apply = (on) =>
      setFavourites((set) => {
        const next = new Set(set);
        if (on) next.add(paperId);
        else next.delete(paperId);
        return next;
      });

    apply(makeFav);
    try {
      const body = await authFetch(
        `${API}/${makeFav ? 'addfavourite' : 'removefavourite'}/${paperId}`,
        { method: makeFav ? 'POST' : 'DELETE' }
      );
      setToast(body.message || (makeFav ? 'Added to favourites.' : 'Removed from favourites.'));
    } catch (e) {
      apply(!makeFav); // undo
      setToast(e.message || 'Could not update favourites');
    }
  }, []);

  // Spends diamonds. The server returns the paper with its file links, so it opens without a reload.
  const confirmUnlock = async () => {
    if (!unlocking) return;
    setUnlockBusy(true);
    setUnlockError('');
    try {
      const body = await authFetch(`${API}/unlock/${unlocking.id}`, { method: 'POST' });
      setPapers((list) => list.map((p) => (p.id === body.paper.id ? { ...p, ...body.paper } : p)));
      if (typeof body.diamonds === 'number') setDiamonds(body.diamonds);
      setUnlocking(null);
      setToast(body.message || 'Paper unlocked.');
    } catch (e) {
      setUnlockError(e.message);
    } finally {
      setUnlockBusy(false);
    }
  };

  const curricula = useMemo(
    () => [...new Set(papers.map((p) => p.curriculum).filter(Boolean))].sort(),
    [papers]
  );

  // Options for the form dropdowns: the standard list plus anything already saved.
  const curriculumOptions = useMemo(() => merge(BASE_CURRICULA, curricula), [curricula]);
  const subjectOptions = useMemo(
    () => merge(BASE_SUBJECTS, papers.map((p) => p.subject)),
    [papers]
  );
  const levelOptions = useMemo(
    () => merge(GRADES, papers.map((p) => p.level)),
    [papers]
  );
  const yearOptions = useMemo(
    () => merge(YEARS, papers.map((p) => (p.year != null ? String(p.year) : ''))),
    [papers]
  );

  const favouriteCount = useMemo(
    () => papers.filter((p) => favourites.has(p.id)).length,
    [papers, favourites]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return papers.filter(
      (p) =>
        (tab === 'all' || favourites.has(p.id)) &&
        (curriculum === 'all' || p.curriculum === curriculum) &&
        (!q || [p.title, p.subject, p.level, p.year, p.curriculum].join(' ').toLowerCase().includes(q))
    );
  }, [papers, favourites, tab, query, curriculum]);

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
            <h1 className="text-3xl" style={{ fontFamily: 'Newsreader, Georgia, serif', fontWeight: 600 }}>
              Past papers
            </h1>
            <p className="mt-1 text-sm" style={{ color: '#5B6978' }}>
              {isAdmin
                ? 'All papers across every curriculum.'
                : 'Papers for your curriculum. Papers outside your plan can be unlocked with diamonds.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!isAdmin && (
              <span
                className="inline-flex items-center gap-1.5 rounded-md border bg-white px-3 py-2 text-sm font-medium"
                style={{ borderColor: RULE, color: GEM }}
                title="Your diamond balance"
              >
                <Gem size={16} /> {fmtCount(diamonds)}
              </span>
            )}
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 disabled:opacity-60"
              style={{ borderColor: RULE }}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            {isAdmin && (
              <button
                onClick={() => setEditing({})}
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white focus:outline-none focus-visible:ring-2"
                style={{ background: INK }}
              >
                <Plus size={16} /> Add paper
              </button>
            )}
          </div>
        </header>

        {/* Tabs */}
        <div className="mt-6 flex gap-2" role="tablist" aria-label="Paper list">
          <TabButton active={tab === 'all'} onClick={() => setTab('all')}>
            All papers
            <Count>{papers.length}</Count>
          </TabButton>
          <TabButton active={tab === 'favourites'} onClick={() => setTab('favourites')}>
            <Heart size={14} /> Favourites
            <Count>{favouriteCount}</Count>
          </TabButton>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap gap-3">
          <label className="relative min-w-[220px] flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: '#8896A6' }}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, subject, level or year"
              className="w-full rounded-md border bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus-visible:ring-2"
              style={{ borderColor: RULE }}
            />
          </label>
          {isAdmin && curricula.length > 1 && (
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
              {tab === 'favourites' && favouriteCount === 0
                ? 'No favourites yet. Tap the heart on a paper to save it here.'
                : papers.length === 0
                  ? isAdmin
                    ? 'No papers yet. Add the first one.'
                    : 'No papers are available for your curriculum yet.'
                  : 'No papers match your search.'}
            </div>
          )}

          {visible.map((p) => {
            const locked = p.access === 'locked';
            const isFav = favourites.has(p.id);
            return (
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
                    <AudienceBadges roles={p.for_who} access={p.access} />
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {!locked && (
                      <button
                        onClick={() => setFavourite(p.id, !isFav)}
                        aria-pressed={isFav}
                        aria-label={isFav ? `Remove ${p.title} from favourites` : `Add ${p.title} to favourites`}
                        title={isFav ? 'Remove from favourites' : 'Add to favourites'}
                        className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm font-medium focus:outline-none focus-visible:ring-2"
                        style={{
                          borderColor: isFav ? FAV : RULE,
                          background: isFav ? `${FAV}0F` : '#fff',
                          color: isFav ? FAV : INK,
                        }}
                      >
                        <Heart size={14} fill={isFav ? FAV : 'none'} />
                        <span className="hidden sm:inline">{isFav ? 'Saved' : 'Save'}</span>
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => setEditing(p)}
                        aria-label={`Edit ${p.title}`}
                        className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm font-medium focus:outline-none focus-visible:ring-2"
                        style={{ borderColor: RULE }}
                      >
                        <Pencil size={14} /> Edit
                      </button>
                    )}
                  </div>
                </div>

                {locked ? (
                  <LockedFiles
                    paper={p}
                    onUnlock={() => {
                      setUnlockError('');
                      setUnlocking(p);
                    }}
                  />
                ) : (
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
                )}
              </article>
            );
          })}
        </div>
      </div>

      {editing && (
        <PaperForm
          paper={editing.id ? editing : null}
          curriculumOptions={curriculumOptions}
          subjectOptions={subjectOptions}
          levelOptions={levelOptions}
          yearOptions={yearOptions}
          onClose={() => setEditing(null)}
          onSaved={(msg) => {
            setEditing(null);
            setToast(msg);
            load();
          }}
        />
      )}

      {unlocking && (
        <UnlockDialog
          paper={unlocking}
          balance={diamonds}
          busy={unlockBusy}
          error={unlockError}
          onConfirm={confirmUnlock}
          onClose={() => setUnlocking(null)}
        />
      )}

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

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2"
      style={{
        borderColor: active ? INK : RULE,
        background: active ? INK : '#fff',
        color: active ? '#fff' : INK,
      }}
    >
      {children}
    </button>
  );
}

function Count({ children }) {
  return (
    <span
      className="rounded-full px-1.5 text-xs"
      style={{ background: 'rgba(128,140,156,0.25)' }}
    >
      {children}
    </span>
  );
}

function PaperForm({
  paper, curriculumOptions, subjectOptions, levelOptions, yearOptions, onClose, onSaved,
}) {
  const isEdit = !!paper;
  const [values, setValues] = useState({
    title: paper?.title ?? '',
    subject: paper?.subject ?? '',
    curriculum: paper?.curriculum ?? '',
    level: paper?.level ?? '',
    year: paper?.year != null ? String(paper.year) : '',
  });
  const [roles, setRoles] = useState(paper?.for_who?.length ? paper.for_who : ROLE_OPTIONS);
  const [cost, setCost] = useState(paper?.diamond_cost != null ? String(paper.diamond_cost) : '10');
  const [paperFile, setPaperFile] = useState(null);
  const [schemeFile, setSchemeFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }));
  const setVal = (k) => (val) => setValues((v) => ({ ...v, [k]: val }));

  const toggleRole = (r) =>
    setRoles((cur) => {
      const next = new Set(cur);
      if (next.has(r)) next.delete(r);
      else next.add(r);
      return ROLE_OPTIONS.filter((o) => next.has(o));
    });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setFormError('');

    const local = {};
    if (!values.title.trim()) local.title = 'Title is required';
    if (!values.subject.trim()) local.subject = 'Subject is required';
    if (!values.curriculum.trim()) local.curriculum = 'Curriculum is required';
    if (!roles.length) local.for_who = 'Choose at least one role';
    const c = Number(cost);
    if (cost.trim() !== '' && (!Number.isInteger(c) || c < 0)) local.diamond_cost = 'Enter a whole number, 0 or more';
    if (!isEdit && !paperFile) local.paper = 'Please attach the paper';
    if (Object.keys(local).length) {
      setErrors(local);
      setSaving(false);
      return;
    }

    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => fd.append(k, typeof v === 'string' ? v.trim() : v ?? ''));
    fd.append('for_who', JSON.stringify(roles));
    fd.append('diamond_cost', cost.trim());
    if (paperFile) fd.append('paper', paperFile);
    if (schemeFile) fd.append('scheme', schemeFile);

    try {
      const body = await authFetch(
        isEdit ? `${API}/editpaper/${paper.id}` : `${API}/addpaper`,
        { method: isEdit ? 'PUT' : 'POST', body: fd } // browser sets the multipart boundary
      );
      onSaved(body.message);
    } catch (err) {
      setErrors(err.errors || {});
      setFormError(err.errors ? '' : err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? 'Edit paper' : 'Add paper'}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-xl bg-white p-5 sm:rounded-xl"
        style={{ color: INK }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl" style={{ fontFamily: 'Newsreader, Georgia, serif', fontWeight: 600 }}>
            {isEdit ? 'Edit paper' : 'Add paper'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 focus:outline-none focus-visible:ring-2"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <Field label="Title" error={errors.title}>
            <input value={values.title} onChange={set('title')} className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Subject" error={errors.subject}>
              <Choice
                value={values.subject}
                onChange={setVal('subject')}
                options={subjectOptions}
                otherPlaceholder="Type the subject"
              />
            </Field>
            <Field label="Curriculum" error={errors.curriculum}>
              <Choice
                value={values.curriculum}
                onChange={setVal('curriculum')}
                options={curriculumOptions}
                otherPlaceholder="Type the curriculum"
              />
            </Field>
            <Field label="Level" error={errors.level}>
              <Choice
                value={values.level}
                onChange={setVal('level')}
                options={levelOptions}
                otherPlaceholder="e.g. Year 8"
              />
            </Field>
            <Field label="Year" error={errors.year}>
              <Choice
                value={values.year}
                onChange={setVal('year')}
                options={yearOptions}
                otherPlaceholder="e.g. 2023"
                inputType="number"
              />
            </Field>
          </div>

          <Field label="Available to" error={errors.for_who}>
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((r) => {
                const on = roles.includes(r);
                return (
                  <label
                    key={r}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium"
                    style={{ borderColor: on ? INK : RULE, background: on ? `${INK}0D` : '#fff' }}
                  >
                    <input type="checkbox" checked={on} onChange={() => toggleRole(r)} />
                    {ROLE_LABEL[r]}
                  </label>
                );
              })}
            </div>
            <span className="mt-1 block text-xs" style={{ color: '#8896A6' }}>
              Everyone else sees this paper locked and can unlock it with diamonds.
            </span>
          </Field>

          <Field label="Unlock cost (diamonds)" error={errors.diamond_cost}>
            <input
              type="number"
              min="0"
              step="1"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="10"
              className={inputCls}
            />
          </Field>

          <Field
            label={isEdit ? 'Replace question paper' : 'Question paper'}
            error={errors.paper}
            hint={isEdit ? paper.paper_name : null}
          >
            <input type="file" onChange={(e) => setPaperFile(e.target.files[0] || null)} className={fileCls} />
          </Field>
          <Field
            label={isEdit && paper.scheme_name ? 'Replace marking scheme' : 'Marking scheme (optional)'}
            error={errors.scheme}
            hint={isEdit ? paper.scheme_name : null}
          >
            <input type="file" onChange={(e) => setSchemeFile(e.target.files[0] || null)} className={fileCls} />
          </Field>
        </div>

        {formError && (
          <p className="mt-3 text-sm" style={{ color: '#8A2B2B' }}>{formError}</p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border px-3 py-2 text-sm font-medium"
            style={{ borderColor: RULE }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            style={{ background: INK }}
          >
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add paper'}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  'w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 border-[#D8DEE6]';
const fileCls =
  'w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#EEF1F5] file:px-3 file:py-2 file:text-sm file:font-medium';

const OTHER = '__other__';

// Dropdown with an "Other..." entry. Choosing it reveals a text box so any value can be typed.
// If the saved value is not in the list (for example when editing), the box opens with it filled in.
function Choice({ value, onChange, options, otherPlaceholder = '', inputType = 'text' }) {
  const [other, setOther] = useState(!!value && !options.includes(value));

  const handle = (e) => {
    const v = e.target.value;
    if (v === OTHER) {
      setOther(true);
      onChange('');
    } else {
      setOther(false);
      onChange(v);
    }
  };

  return (
    <>
      <select value={other ? OTHER : value} onChange={handle} className={`${inputCls} bg-white`}>
        <option value="">Select</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
        <option value={OTHER}>Other...</option>
      </select>
      {other && (
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={otherPlaceholder}
          className={`${inputCls} mt-2`}
          autoFocus
        />
      )}
    </>
  );
}

// A div, not a label, so clicking the text box never sends focus back to the dropdown.
function Field({ label, error, hint, children }) {
  return (
    <div className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      {children}
      {hint && !error && (
        <span className="mt-1 block text-xs" style={{ color: '#8896A6' }}>Current: {hint}</span>
      )}
      {error && (
        <span className="mt-1 block text-xs" style={{ color: '#8A2B2B' }}>{error}</span>
      )}
    </div>
  );
}