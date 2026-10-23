import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { signoutSuccess } from "../../redux/user/userSlice";
import { useDispatch } from "react-redux";
import PageCardSkeleton from "./PageCardSkeleton";
import {
  Search, RefreshCw, Eye, Pencil, ExternalLink,
  TrendingUp, TrendingDown, Minus, AlertTriangle,
  LayoutGrid, Globe, BarChart2,
} from "lucide-react";

const EDIT_LINKS = {
  "/":               "/managerdashboard?tab=homeedit",
  "/about":          "/managerdashboard?tab=aboutedit",
  "/programs":       "/managerdashboard?tab=programsedit",
  "/newsandupdates": "/managerdashboard?tab=newsedit",
  "/resources":      "/managerdashboard?tab=resourcesedit",
  "/contact":        "/managerdashboard?tab=contactedit",
  "/donate":         "/managerdashboard?tab=donateedit",
  "/careers":        "/managerdashboard?tab=careersedit",
};

const PAGES = [
  { id: 1, title: "Home",          slug: "/",              status: "published", lastEdited: "2 hours ago",  sections: ["hero","programs","impact","cta"],          desc: "Main landing — hero, programs overview, impact stats and call-to-action." },
  { id: 2, title: "About",         slug: "/about",         status: "published", lastEdited: "1 day ago",    sections: ["hero","mission","board","cta"],             desc: "PYO story, board of directors, mission and values." },
  { id: 3, title: "Programs",      slug: "/programs",      status: "published", lastEdited: "3 days ago",   sections: ["header","cards","sub-programs","cta"],      desc: "4 core programs and 7 sub-programs with full detail pages." },
  { id: 4, title: "News & Updates",slug: "/newsandupdates",status: "published", lastEdited: "5 hours ago",  sections: ["header","grid","filters","pagination"],     desc: "Latest articles, stories and PYO announcements." },
  { id: 5, title: "Resources",     slug: "/resources",     status: "published", lastEdited: "2 days ago",   sections: ["header","downloads","pdfs","links"],        desc: "Downloadable PDFs, toolkits and learning resources." },
  { id: 6, title: "Contact",       slug: "/contact",       status: "published", lastEdited: "1 week ago",   sections: ["hero","form","map","info"],                 desc: "Contact form, Likoni office location and support info." },
  { id: 7, title: "Donate",        slug: "/donate",        status: "published", lastEdited: "4 days ago",   sections: ["hero","tiers","flutterwave","impact"],      desc: "Donation tiers with Flutterwave payment integration." },
  { id: 8, title: "Careers",       slug: "/careers",       status: "published", lastEdited: "1 week ago",   sections: ["header","openings","apply","faq"],          desc: "Open positions, volunteer opportunities and application form." },
];

const SEG_COLORS = ["#4ade80","#22c55e","#16a34a","#15803d","#166534"];
const getSegColor = (i) => SEG_COLORS[i % SEG_COLORS.length];

function timeAgo(isoString) {
  if (!isoString) return null;
  const diff  = Date.now() - new Date(isoString).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30)  return `${days}d ago`;
  return new Date(isoString).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// ── Sparkline ─────────────────────────────────────────────────────────────────
function Sparkline({ percentage }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const steps = 10;
    const base  = (percentage || 0) / 100;
    const points = Array.from({ length: steps }, (_, i) => {
      const progress = i / (steps - 1);
      const noise = Math.sin(i * 2.3) * 0.12 + Math.cos(i * 1.7) * 0.08;
      return Math.max(0.05, Math.min(0.95, base * (0.6 + progress * 0.4) + noise));
    });
    points[steps - 1] = Math.max(0.05, Math.min(0.95, base));
    const color =
      (percentage || 0) > 40 ? "#22c55e" :
      (percentage || 0) > 15 ? "#f59e0b" : "#ef4444";

    ctx.clearRect(0, 0, W, H);
    ctx.beginPath();
    points.forEach((v, i) => {
      const x = (i / (steps - 1)) * W;
      const y = H - v * (H - 4) - 2;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    ctx.fillStyle = color + "18"; ctx.fill();

    ctx.beginPath();
    points.forEach((v, i) => {
      const x = (i / (steps - 1)) * W;
      const y = H - v * (H - 4) - 2;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color; ctx.lineWidth = 1.5;
    ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.stroke();

    const lastY = H - points[steps - 1] * (H - 4) - 2;
    ctx.beginPath(); ctx.arc(W, lastY, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
  }, [percentage]);

  return (
    <canvas ref={canvasRef} width={72} height={22} aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }} />
  );
}

// ── Trend icon ────────────────────────────────────────────────────────────────
function TrendIcon({ percentage }) {
  if (percentage > 40) return <TrendingUp size={11} color="#22c55e" />;
  if (percentage < 10) return <TrendingDown size={11} color="#ef4444" />;
  return <Minus size={11} color="rgba(150,150,150,0.8)" />;
}

// ── Section bar ───────────────────────────────────────────────────────────────
function SectionBar({ sections }) {
  return (
    <div className="flex gap-[2px] h-[3px] rounded-full overflow-hidden mb-3">
      {sections.map((s, i) => (
        <div key={s} title={s}
          style={{ flex: 1, borderRadius: 99, backgroundColor: getSegColor(i) }} />
      ))}
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  return status === "published" ? (
    <span className="text-[9px] font-bold tracking-[0.06em] uppercase px-[7px] py-[2px] rounded-full shrink-0 whitespace-nowrap"
      style={{ background: "rgba(74,222,128,0.12)", color: "#4ade80", border: "0.5px solid rgba(74,222,128,0.30)" }}>
      Published
    </span>
  ) : (
    <span className="text-[9px] font-bold tracking-[0.06em] uppercase px-[7px] py-[2px] rounded-full shrink-0 whitespace-nowrap
      bg-black/5 text-black/40 border-[0.5px] border-black/10
      dark:bg-white/[0.06] dark:text-white/40 dark:border-white/10">
      Draft
    </span>
  );
}

// ── Metric card ───────────────────────────────────────────────────────────────
function MetricCard({ label, value, icon: Icon }) {
  return (
    <div className="flex-1 min-w-0 basis-[120px] rounded-[10px] p-[10px_14px] flex items-center gap-[10px]
      bg-black/[0.03] border-[0.5px] border-green-600/[0.12]
      dark:bg-white/[0.04] dark:border-[#4ade80]/10">
      {Icon && (
        <div className="w-[30px] h-[30px] rounded-lg shrink-0 flex items-center justify-center"
          style={{ background: "rgba(74,222,128,0.10)" }}>
          <Icon size={14} color="#4ade80" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-[9px] uppercase tracking-[0.06em] mb-[2px] whitespace-nowrap
          text-black/40 dark:text-white/[0.38]">
          {label}
        </p>
        <p className="text-[18px] font-semibold leading-none overflow-hidden text-ellipsis whitespace-nowrap
          text-[#111] dark:text-white">
          {value ?? "—"}
        </p>
      </div>
    </div>
  );
}

// ── Visits block ──────────────────────────────────────────────────────────────
function VisitsBlock({ visitData }) {
  if (!visitData) {
    return (
      <p className="text-[11px] mb-2 text-black/25 dark:text-white/[0.22]">
        No visit data
      </p>
    );
  }
  const { visits, percentage } = visitData;
  const barColor =
    percentage > 40 ? "#22c55e" : percentage > 15 ? "#f59e0b" : "#ef4444";

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-1 gap-2">
        <div className="flex items-center gap-[5px]">
          <TrendIcon percentage={percentage} />
          <span className="text-[16px] font-semibold text-[#111] dark:text-white">
            {visits.toLocaleString()}
          </span>
          <span className="text-[10px] text-black/30 dark:text-white/30">visits</span>
        </div>
        <Sparkline percentage={percentage} />
      </div>
      <div className="h-[2px] rounded-full overflow-hidden bg-black/[0.07] dark:bg-white/[0.07]">
        <div style={{ width: `${percentage}%`, background: barColor }}
          className="h-full rounded-full transition-[width] duration-[0.6s] ease-in-out" />
      </div>
      <p className="text-[10px] mt-[3px] text-black/30 dark:text-white/[0.28]">
        {percentage}% of total traffic
      </p>
    </div>
  );
}

// ── Page card ─────────────────────────────────────────────────────────────────
function PageCard({ page, onEdit, visitData }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`rounded-xl p-4 flex flex-col transition-all duration-200 border-[0.5px]
        ${hovered
          ? "bg-[rgba(22,163,74,0.05)] border-[rgba(22,163,74,0.45)] dark:bg-[rgba(74,222,128,0.04)] dark:border-[rgba(74,222,128,0.38)]"
          : "bg-black/[0.02] border-[rgba(22,163,74,0.15)] dark:bg-white/[0.03] dark:border-[rgba(74,222,128,0.10)]"
        }`}
    >
      <SectionBar sections={page.sections} />

      {/* Title row */}
      <div className="flex items-start justify-between gap-2 mb-[6px]">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold leading-[1.3] text-[#111] dark:text-white">
            {page.title}
          </p>
          <p className="text-[10px] font-mono mt-[2px] overflow-hidden text-ellipsis whitespace-nowrap
            text-black/30 dark:text-white/30">
            {page.slug}
          </p>
        </div>
        <StatusBadge status={page.status} />
      </div>

      {/* Description */}
      <p className="text-[11px] leading-[1.6] mb-2 text-black/50 dark:text-white/[0.38]">
        {page.desc}
      </p>

      {/* Section chips */}
      <div className="flex flex-wrap gap-1 mb-[10px]">
        {page.sections.map((s) => (
          <span key={s}
            className="text-[9px] px-[6px] py-[2px] rounded capitalize
              bg-black/[0.05] text-black/40
              dark:bg-white/[0.05] dark:text-white/[0.38]">
            {s}
          </span>
        ))}
      </div>

      {/* Visits */}
      <VisitsBlock visitData={visitData} />

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 border-t-[0.5px] pt-[10px] mt-auto flex-wrap
        border-black/[0.07] dark:border-white/[0.06]">
        <div className="flex items-center gap-1 text-[10px] min-w-0 text-black/30 dark:text-white/[0.28]">
          <Eye size={11} />
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">
            {visitData?.lastVisit
              ? `Last visit ${timeAgo(visitData.lastVisit)}`
              : page.lastEdited
                ? `Edited ${page.lastEdited}`
                : "No visits yet"
            }
          </span>
        </div>

        <div className="flex gap-[6px] shrink-0">
          <a
            href={page.slug}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[9px] font-semibold px-2 py-1 rounded-md no-underline cursor-pointer
              text-[#4ade80] hover:opacity-85 transition-opacity
              bg-[rgba(22,163,74,0.08)] border-[0.5px] border-[rgba(22,163,74,0.30)]
              dark:bg-[rgba(74,222,128,0.10)] dark:border-[rgba(74,222,128,0.30)]"
            title="View live page"
          >
            <ExternalLink size={10} /> View
          </a>
          <button
            onClick={() => onEdit(page.slug)}
            className="flex items-center gap-1 text-[9px] font-semibold px-2 py-1 rounded-md cursor-pointer
              text-[#4ade80] hover:opacity-85 transition-opacity
              bg-[rgba(22,163,74,0.08)] border-[0.5px] border-[rgba(22,163,74,0.30)]
              dark:bg-[rgba(74,222,128,0.10)] dark:border-[rgba(74,222,128,0.30)]"
            title="Go to editor"
          >
            <Pencil size={10} /> Edit
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Website() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [search, setSearch]       = useState("");
  const [visitsMap, setVisitsMap] = useState({});
  const [summary, setSummary]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [spinning, setSpinning]   = useState(false);
  const [error, setError]         = useState(null);

  const fetchVisits = useCallback(async () => {
    try {
      setLoading(true); setSpinning(true); setError(null);
      const res  = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/visits/visits/by-page`,
        { credentials: "include" }
      );
      const json = await res.json();
      if (json.logout) { dispatch(signoutSuccess()); navigate("/sign-in"); return; }
      if (!res.ok) throw new Error(json.message || `Server returned ${res.status}`);
      const map = {};
      (json.pages || []).forEach((p) => { map[p.page] = p; });
      setVisitsMap(map);
      setSummary({
        total:     json.total ?? 0,
        pageCount: (json.pages || []).length,
        topPage:   json.pages?.[0]?.page ?? "—",
      });
    } catch (err) {
      console.error("Failed to fetch visits:", err);
      setError(err.message || "Failed to load visits");
    } finally {
      setLoading(false); setSpinning(false);
    }
  }, [dispatch, navigate]);

  useEffect(() => { fetchVisits(); }, [fetchVisits]);

  const handleEdit = (slug) => { const p = EDIT_LINKS[slug]; if (p) navigate(p); };

  const getVisitData = (page) =>
    visitsMap[page.title] ||
    visitsMap[page.slug]  ||
    visitsMap[page.slug.replace("/", "")] ||
    null;

  const filtered = PAGES.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .website-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        @media (max-width: 1200px) { .website-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 860px)  { .website-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 520px)  { .website-grid { grid-template-columns: 1fr; } }
        @media (max-width: 520px) {
          .website-toolbar { padding: 10px 16px !important; gap: 8px; }
          .website-toolbar-search { flex: 1 1 100% !important; max-width: 100% !important; }
          .website-summary { padding: 10px 16px !important; }
          .website-grid-wrap { padding: 14px 16px 24px !important; }
        }
        .search-input::placeholder { color: rgba(0,0,0,0.30); }
        .dark .search-input::placeholder { color: rgba(255,255,255,0.28); }
        .website-btn:hover { opacity: 0.85; }
      `}</style>

      <div
        className="mt-20 min-h-screen flex flex-col transition-all duration-500
          bg-gradient-to-br from-[#f0fdf4] via-[#dcfce7] to-[#f0fdf4]
          dark:bg-[#05110a] dark:bg-none"
        style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >
        {/* ── Toolbar ──────────────────────────────────────────────────────── */}
        <div
          className="website-toolbar flex items-center gap-[10px] flex-wrap px-6 py-[10px]
            sticky top-0 z-10 backdrop-blur-[10px] transition-all duration-500
            bg-[rgba(240,253,244,0.95)] border-b-[0.5px] border-green-600/[0.12]
            dark:bg-[rgba(5,17,10,0.95)] dark:border-[rgba(74,222,128,0.10)]"
        >
          {/* Search */}
          <div className="website-toolbar-search relative flex-[1_1_200px] max-w-[360px]">
            <Search size={13}
              className="absolute left-[10px] top-1/2 -translate-y-1/2 pointer-events-none
                text-black/30 dark:text-white/[0.28]" />
            <input
              className="search-input w-full rounded-lg py-[7px] pr-[10px] pl-[30px] text-[12px]
                outline-none transition-all duration-200
                bg-black/[0.04] border-[0.5px] border-green-600/25 text-[#111]
                dark:bg-white/[0.04] dark:border-[rgba(74,222,128,0.18)] dark:text-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search pages…"
            />
          </div>

          <div className="flex-1" />

          {error && (
            <span className="flex items-center gap-[5px] text-[11px] shrink-0
              text-red-600 dark:text-[rgba(248,113,113,0.85)]">
              <AlertTriangle size={12} /> {error}
            </span>
          )}

          <button
            onClick={fetchVisits}
            disabled={loading}
            title="Refresh visit data"
            className="website-btn flex items-center gap-[6px] text-[11px] font-semibold
              px-3 py-[7px] rounded-lg shrink-0 transition-opacity duration-200
              text-[#4ade80] cursor-pointer disabled:cursor-not-allowed disabled:opacity-60
              bg-[rgba(22,163,74,0.08)] border-[0.5px] border-[rgba(22,163,74,0.30)]
              dark:bg-[rgba(74,222,128,0.10)] dark:border-[rgba(74,222,128,0.30)]"
          >
            <RefreshCw size={13}
              style={{ animation: spinning ? "spin 0.8s linear infinite" : "none" }} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* ── Summary metrics ───────────────────────────────────────────────── */}
        {summary && !loading && (
          <div className="website-summary flex gap-[10px] flex-wrap px-6 py-[14px]
            border-b-[0.5px] border-green-600/[0.10] dark:border-[rgba(74,222,128,0.08)]">
            <MetricCard label="Total visits"   value={summary.total.toLocaleString()} icon={BarChart2} />
            <MetricCard label="Pages tracked"  value={summary.pageCount}              icon={LayoutGrid} />
            <MetricCard label="Top page"       value={summary.topPage}                icon={Globe} />
          </div>
        )}

        {/* ── Page grid ─────────────────────────────────────────────────────── */}
        <div className="website-grid-wrap flex-1 overflow-y-auto px-6 py-5 pb-8">
          {loading ? (
            <div className="website-grid">
              {PAGES.map((p) => <PageCardSkeleton key={p.id} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20
              text-black/25 dark:text-white/[0.22]">
              <Search size={32} className="opacity-30 mb-3" />
              <p className="text-[13px]">No pages match your search.</p>
            </div>
          ) : (
            <div className="website-grid">
              {filtered.map((page) => (
                <PageCard
                  key={page.id}
                  page={page}
                  onEdit={handleEdit}
                  visitData={getVisitData(page)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}