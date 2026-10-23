// ─── Config ───────────────────────────────────────────────────────────────────
const AV_COLORS = [
  "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
  "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
];

const STATUS_META = {
  pending:  { icon: "⏳", bg: "bg-amber-50 dark:bg-amber-950/40",   text: "text-amber-600 dark:text-amber-400",   border: "border-amber-200 dark:border-amber-800"   },
  approved: { icon: "✓",  bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800" },
  rejected: { icon: "✕",  bg: "bg-red-50 dark:bg-red-950/40",       text: "text-red-600 dark:text-red-400",       border: "border-red-200 dark:border-red-800"       },
  retired:  { icon: "✔",  bg: "bg-zinc-100 dark:bg-zinc-800",        text: "text-zinc-500 dark:text-zinc-400",     border: "border-zinc-200 dark:border-zinc-700"     },
  draft:    { icon: "✎",  bg: "bg-zinc-100 dark:bg-zinc-800",        text: "text-zinc-500 dark:text-zinc-400",     border: "border-zinc-200 dark:border-zinc-700"     },
};

const TYPE_META = {
  fund:    { label: "Fund request",       bg: "bg-blue-50 dark:bg-blue-950/40",    text: "text-blue-600 dark:text-blue-400"    },
  leave:   { label: "Leave",              bg: "bg-violet-50 dark:bg-violet-950/40", text: "text-violet-600 dark:text-violet-400" },
  retire:  { label: "Expense retirement", bg: "bg-teal-50 dark:bg-teal-950/40",    text: "text-teal-600 dark:text-teal-400"    },
  report:  { label: "Financial report",   bg: "bg-orange-50 dark:bg-orange-950/40", text: "text-orange-600 dark:text-orange-400" },
};

// ─── Components ───────────────────────────────────────────────────────────────
export function Avatar({ ini, idx, size = "w-9 h-9" }) {
  const cls = AV_COLORS[idx % AV_COLORS.length];
  return (
    <div className={`${size} rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${cls}`}>
      {ini}
    </div>
  );
}

export function Badge({ status }) {
  const m = STATUS_META[status] || STATUS_META.draft;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${m.bg} ${m.text} ${m.border}`}>
      <span className="text-[10px]">{m.icon}</span>
      {status && status !== "—" ? status.charAt(0).toUpperCase() + status.slice(1) : "—"}
    </span>
  );
}

export function TypePill({ type }) {
  const m = TYPE_META[type] || TYPE_META.fund;
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${m.bg} ${m.text} whitespace-nowrap`}>
      {m.label}
    </span>
  );
}

export function CloseButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="cursor-pointer w-7 h-7 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  );
}