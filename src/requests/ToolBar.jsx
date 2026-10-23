const TYPE_TABS = [
  { key: "all",    label: "All"        },
  { key: "leave",  label: "Leave"      },
  { key: "fund",   label: "Fund"       },
];

export default function Toolbar({ search, onSearch, typeFilter, onTypeFilter, view, onView }) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Search */}
      <div className="flex-1 min-w-40 flex items-center gap-2 px-3 h-9 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-zinc-400 flex-shrink-0">
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
          <path d="m11 11 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Search by name, project, reference…"
          className="flex-1 bg-transparent text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 outline-none"
        />
      </div>

      {/* Type filter */}
      <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1">
        {TYPE_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => onTypeFilter(t.key)}
            className={`px-3 h-7 rounded-lg text-xs font-medium transition-all ${
              typeFilter === t.key
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1">
        <button
          onClick={() => onView("kanban")}
          title="Kanban"
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
            view === "kanban"
              ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
              : "text-zinc-400 hover:text-zinc-600"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="4" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
            <rect x="7" y="1" width="4" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          </svg>
        </button>
        <button
          onClick={() => onView("list")}
          title="List"
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
            view === "list"
              ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
              : "text-zinc-400 hover:text-zinc-600"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 3.5h10M2 7h10M2 10.5h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}