import { useState, useMemo, useEffect, useCallback } from "react";
import EditProgramModal from "./EditPrograms";
import AddProgramModal  from "./ProgramAdding";

// ── Icons ──────────────────────────────────────────────────────────────────────
const IconPlus = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IconEdit = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const IconTrash = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" />
  </svg>
);
const IconEye = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const IconChevronRight = ({ open }) => (
  <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-90" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const IconSearch = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IconGitBranch = () => (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="6" y1="3" x2="6" y2="15" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9" />
  </svg>
);
const IconRefresh = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  Active:   "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  Draft:    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  Archived: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
};

const BADGE_COLORS = [
  "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
];

const hashColor = (id = "") =>
  BADGE_COLORS[Math.abs(id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % BADGE_COLORS.length];

const buildTree = (flat) => {
  const roots      = flat.filter((p) => !p.parent_id);
  const childrenOf = (parentId) => flat.filter((p) => p.parent_id === parentId);
  return roots.map((r) => ({ ...r, children: childrenOf(r.id) }));
};

const normalise = (p) => ({
  ...p,
  desc:      p.description      ?? p.desc      ?? "",
  full_desc: p.full_description ?? p.full_desc ?? "",
});

// ── Skeleton loader row ───────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-t border-zinc-100 dark:border-zinc-800 animate-pulse">
      <td className="pl-4 pr-2 py-3.5"><div className="w-4 h-4 rounded bg-zinc-200 dark:bg-zinc-700" /></td>
      <td className="py-3.5 pr-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-zinc-200 dark:bg-zinc-700 flex-shrink-0" />
          <div className="space-y-1.5">
            <div className="h-3 w-28 sm:w-40 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-2 w-12 sm:w-16 rounded bg-zinc-100 dark:bg-zinc-800" />
          </div>
        </div>
      </td>
      {[...Array(5)].map((_, i) => (
        <td key={i} className="py-3.5 pr-4 hidden sm:table-cell">
          <div className="h-3 w-14 rounded bg-zinc-200 dark:bg-zinc-700" />
        </td>
      ))}
    </tr>
  );
}

// ── Error banner ──────────────────────────────────────────────────────────────
function ErrorBanner({ message, onRetry }) {
  return (
    <tr>
      <td colSpan={7}>
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400 mr-3">{message}</p>
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:underline flex-shrink-0"
          >
            <IconRefresh /> Retry
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent, loading }) {
  return (
    <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-xl p-3 sm:p-4">
      <p className="text-[10px] sm:text-xs text-zinc-400 dark:text-zinc-500 mb-1 truncate">{label}</p>
      {loading ? (
        <div className="h-6 sm:h-7 w-10 sm:w-12 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse mt-1" />
      ) : (
        <p className={`text-xl sm:text-2xl font-semibold ${accent || "text-zinc-800 dark:text-zinc-100"}`}>{value}</p>
      )}
      {sub && <p className="text-[10px] sm:text-xs text-zinc-400 dark:text-zinc-500 mt-1 truncate">{sub}</p>}
    </div>
  );
}

// ── Detail panel ──────────────────────────────────────────────────────────────
function DetailPanel({ program, isChild, onEdit, onAddSub }) {
  return (
    <tr>
      <td colSpan={7} className="p-0">
        <div className={`border-t border-green-100 dark:border-green-900/30 bg-zinc-50 dark:bg-zinc-900/40 ${isChild ? "pl-0 sm:pl-10" : ""}`}>
          <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">Overview</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Impact</p>
                    <p className="text-base font-semibold text-green-700 dark:text-green-400">{program.impact}</p>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{program.impact_label}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Status</p>
                    <span className={`mt-1 inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[program.status]}`}>
                      {program.status}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5">Short description</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">{program.desc}</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">Key highlights</p>
              <ul className="space-y-1.5">
                {(program.highlights || []).map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Detail actions — wrap on tiny screens */}
          <div className="flex flex-wrap items-center gap-2 px-4 sm:px-5 pb-4 pt-1 border-t border-green-50 dark:border-green-900/20">
            <button onClick={() => onEdit(program)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-700 hover:bg-green-800 text-white transition-colors">
              <IconEdit /> Edit program
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <IconEye /> Preview on site
            </button>
            {!isChild && (
              <button onClick={() => onAddSub(program)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <IconGitBranch /> Add sub-program
              </button>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

// ── Sub-program row ────────────────────────────────────────────────────────────
function SubRow({ sub, expandedIds, onToggle, onEdit, onDelete }) {
  const isOpen = expandedIds.has(sub.id);
  return (
    <>
      <tr className="bg-zinc-50/60 dark:bg-zinc-900/30 hover:bg-green-50/40 dark:hover:bg-green-900/10 transition-colors cursor-pointer" onClick={() => onToggle(sub.id)}>
        <td className="pl-6 sm:pl-8 pr-2 py-3">
          <button onClick={(e) => { e.stopPropagation(); onToggle(sub.id); }} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors" aria-label="Expand sub-program">
            <IconChevronRight open={isOpen} />
          </button>
        </td>
        <td className="py-3 pr-3 sm:pr-4">
          <div className="flex items-center gap-2 sm:gap-2.5 pl-2 sm:pl-4">
            <div className="flex-shrink-0 w-[2px] h-5 rounded-full bg-green-300 dark:bg-green-700" />
            <div className="w-7 h-7 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-sm flex-shrink-0">{sub.icon}</div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200 truncate">{sub.title}</p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Sub-program</p>
            </div>
          </div>
        </td>
        <td className="py-3 pr-3 sm:pr-4 hidden sm:table-cell">
          <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full ${hashColor(sub.id)}`}>{sub.badge}</span>
        </td>
        <td className="py-3 pr-3 sm:pr-4 hidden sm:table-cell">
          <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[sub.status]}`}>{sub.status}</span>
        </td>
        <td className="py-3 pr-3 sm:pr-4 hidden md:table-cell">
          <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200">{sub.impact}</p>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{sub.impact_label}</p>
        </td>
        <td className="py-3 pr-3 sm:pr-4 hidden lg:table-cell">
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">—</span>
        </td>
        <td className="py-3 pr-3 sm:pr-4">
          <div className="flex items-center gap-0.5 sm:gap-1">
            <button onClick={(e) => { e.stopPropagation(); onEdit(sub); }} className="p-1.5 rounded-lg text-zinc-400 hover:text-green-700 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors" title="Edit"><IconEdit /></button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(sub.id); }} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete"><IconTrash /></button>
          </div>
        </td>
      </tr>
      {isOpen && <DetailPanel program={sub} isChild={true} onEdit={onEdit} onAddSub={() => {}} />}
    </>
  );
}

// ── Main program row ───────────────────────────────────────────────────────────
function ProgramRow({ node, expandedIds, onToggle, onEdit, onDelete, onAddSub }) {
  const isOpen      = expandedIds.has(node.id);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <>
      <tr className="bg-white dark:bg-zinc-950 hover:bg-green-50/30 dark:hover:bg-green-900/10 transition-colors cursor-pointer border-t border-zinc-100 dark:border-zinc-800" onClick={() => onToggle(node.id)}>
        <td className="pl-4 pr-2 py-3.5">
          <button onClick={(e) => { e.stopPropagation(); onToggle(node.id); }} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors" aria-label="Expand program">
            <IconChevronRight open={isOpen} />
          </button>
        </td>
        <td className="py-3.5 pr-3 sm:pr-4 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-base flex-shrink-0">{node.icon}</div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate max-w-[130px] sm:max-w-none">{node.title}</p>
              {node.program_no && <p className="text-[10px] text-zinc-400 dark:text-zinc-500">#{node.program_no}</p>}
            </div>
          </div>
        </td>
        <td className="py-3.5 pr-3 sm:pr-4 hidden sm:table-cell">
          <span className={`inline-flex text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${hashColor(node.id)}`}>{node.badge}</span>
        </td>
        <td className="py-3.5 pr-3 sm:pr-4 hidden sm:table-cell">
          <span className={`inline-flex text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${STATUS_STYLES[node.status]}`}>{node.status}</span>
        </td>
        <td className="py-3.5 pr-3 sm:pr-4 hidden md:table-cell">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{node.impact}</p>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{node.impact_label}</p>
        </td>
        <td className="py-3.5 pr-3 sm:pr-4 hidden lg:table-cell">
          {hasChildren ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full px-2 py-0.5">
              <IconGitBranch />{node.children.length}
            </span>
          ) : (
            <span className="text-[11px] text-zinc-300 dark:text-zinc-600">—</span>
          )}
        </td>
        <td className="py-3.5 pr-3 sm:pr-4">
          <div className="flex items-center gap-0.5 sm:gap-1">
            <button onClick={(e) => { e.stopPropagation(); onEdit(node); }} className="p-1.5 rounded-lg text-zinc-400 hover:text-green-700 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors" title="Edit"><IconEdit /></button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(node.id); }} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete"><IconTrash /></button>
          </div>
        </td>
      </tr>

      {isOpen && <DetailPanel program={node} isChild={false} onEdit={onEdit} onAddSub={onAddSub} />}
      {isOpen && hasChildren && node.children.map((child) => (
        <SubRow key={child.id} sub={child} expandedIds={expandedIds} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminProgramsPage() {
  const [programs, setPrograms]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [filter, setFilter]           = useState("All");
  const [search, setSearch]           = useState("");
  const [addOpen, setAddOpen]         = useState(false);
  const [editTarget, setEditTarget]   = useState(null);
  const [addParentId, setAddParentId] = useState(null);

  // ── Fetch from API ──────────────────────────────────────────────────────────
  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/programs/getprograms`, {
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Server error ${res.status}`);
      }
      const { programs: raw } = await res.json();
      setPrograms(raw.map(normalise));
    } catch (err) {
      console.error("Failed to fetch programs:", err);
      setError(err.message || "Failed to load programs. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPrograms(); }, [fetchPrograms]);

  useEffect(() => {
    const timer = setTimeout(fetchPrograms, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchPrograms, search]);

  // ── Tree + stats ────────────────────────────────────────────────────────────
  const tree        = useMemo(() => buildTree(programs), [programs]);
  const totalCores  = programs.filter((p) => !p.parent_id).length;
  const totalSubs   = programs.filter((p) =>  p.parent_id).length;
  const totalActive = programs.filter((p) => p.status === "Active").length;
  const totalDraft  = programs.filter((p) => p.status === "Draft").length;

  const visibleTree = useMemo(() => {
    if (filter === "All" && !search) return tree;
    return tree.filter((node) => {
      const matchStatus = filter === "All" || node.status === filter;
      const matchSearch = !search || node.title.toLowerCase().includes(search.toLowerCase()) || (node.badge || "").toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [tree, filter, search]);

  const toggleExpand = (id) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleDelete = (id) => {
    if (!window.confirm("Delete this program? This cannot be undone.")) return;
    setPrograms((prev) => prev.filter((p) => p.id !== id && p.parent_id !== id));
  };

  const handleAdded = (newProgram) => {
    setPrograms((prev) => [...prev, normalise(newProgram)]);
    if (newProgram.parent_id) setExpandedIds((prev) => new Set([...prev, newProgram.parent_id]));
  };

  const handleUpdated = (updated) =>
    setPrograms((prev) => prev.map((p) => (p.id === updated.id ? normalise(updated) : p)));

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="mt-18 overflow-hidden bg-zinc-100 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 font-sans">
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── Top bar ── */}
        <header className="bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0">
          {/* Row 1: breadcrumb + icon actions */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-3.5">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-semibold text-zinc-800 dark:text-zinc-100">Programs</h1>
              <span className="text-zinc-300 dark:text-zinc-700">/</span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">Manage</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Refresh — always visible */}
              <button
                onClick={fetchPrograms}
                disabled={loading}
                className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40"
                title="Refresh"
              >
                <IconRefresh />
              </button>
              {/* Add — always visible */}
              <button
                onClick={() => { setAddParentId(null); setAddOpen(true); }}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold bg-green-700 hover:bg-green-800 text-white transition-colors"
              >
                <IconPlus />
                <span className="hidden xs:inline sm:inline">Add program</span>
              </button>
            </div>
          </div>

          {/* Row 2: search bar — full width on mobile */}
          <div className="px-4 sm:px-6 pb-3 sm:hidden">
            <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-400 w-full">
              <IconSearch />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search programs…"
                className="bg-transparent outline-none text-zinc-600 dark:text-zinc-300 placeholder-zinc-300 dark:placeholder-zinc-600 flex-1 min-w-0"
              />
            </div>
          </div>

          {/* Search on desktop — injected into row 1 via absolute trick; easier to just re-render */}
          <div className="hidden sm:flex items-center px-6 pb-0 absolute top-[calc(18px+1rem)] right-36">
            {/* Desktop search lives inline in the header row above — handled below */}
          </div>
        </header>

        {/* ── Desktop header search patch: re-do header cleanly for sm+ ── */}
        {/* NOTE: The two-row approach above handles both; the hidden sm:flex above is a no-op placeholder removed below */}

        {/* Body */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6">

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            <StatCard loading={loading} label="Total programs"     value={programs.length} sub={`${totalCores} core · ${totalSubs} sub`} />
            <StatCard loading={loading} label="Active"             value={totalActive} accent="text-green-700 dark:text-green-400" />
            <StatCard loading={loading} label="Draft"              value={totalDraft}  accent="text-amber-600 dark:text-amber-400" />
            <StatCard loading={loading} label="Sub-programs"       value={totalSubs} />
          </div>

          {/* Table card */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">

            {/* Toolbar: filter pills — scrollable on mobile */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-zinc-100 dark:border-zinc-800 gap-3">
              <p className="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-200 flex-shrink-0">All programs</p>
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {["All", "Active", "Draft", "Archived"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-shrink-0 ${
                      filter === f ? "bg-green-700 text-white" : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Table — horizontal scroll on mobile */}
            <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
              <table className="w-full text-sm" style={{ minWidth: "480px" }}>
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800">
                    <th className="w-9" />
                    <th className="text-left py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 min-w-[160px]">Program</th>
                    <th className="text-left py-3 pr-4 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 hidden sm:table-cell">Badge</th>
                    <th className="text-left py-3 pr-4 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 hidden sm:table-cell">Status</th>
                    <th className="text-left py-3 pr-4 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 hidden md:table-cell">Impact</th>
                    <th className="text-left py-3 pr-4 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 hidden lg:table-cell">Sub-programs</th>
                    <th className="text-left py-3 pr-4 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && [...Array(4)].map((_, i) => <SkeletonRow key={i} />)}
                  {!loading && error && <ErrorBanner message={error} onRetry={fetchPrograms} />}
                  {!loading && !error && visibleTree.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-sm text-zinc-400 dark:text-zinc-500">
                        No programs match your filter.
                      </td>
                    </tr>
                  )}
                  {!loading && !error && visibleTree.map((node) => (
                    <ProgramRow
                      key={node.id}
                      node={node}
                      expandedIds={expandedIds}
                      onToggle={toggleExpand}
                      onEdit={setEditTarget}
                      onDelete={handleDelete}
                      onAddSub={(p) => { setAddParentId(p.id); setAddOpen(true); }}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                {loading ? "Loading…" : `${visibleTree.length} of ${tree.length} core programs`}
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 flex-shrink-0">
                {loading ? "" : `${programs.length} total`}
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      {addOpen && (
        <AddProgramModal
          defaultParentId={addParentId}
          onClose={() => { setAddOpen(false); setAddParentId(null); }}
          onAdd={(p) => { handleAdded(p); setAddOpen(false); setAddParentId(null); }}
        />
      )}
      {editTarget && (
        <EditProgramModal
          program={editTarget}
          onClose={() => setEditTarget(null)}
          onUpdated={(updated) => { handleUpdated(updated); setEditTarget(null); }}
        />
      )}
    </div>
  );
}