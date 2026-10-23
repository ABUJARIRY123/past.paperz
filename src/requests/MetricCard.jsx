const METRICS = [
  { key: "all",      label: "All requests",      icon: "⊞", barCls: "bg-blue-500",    iconBg: "bg-blue-50 dark:bg-blue-950",    iconCls: "text-blue-600 dark:text-blue-400",   border: "border-blue-100 dark:border-zinc-800"    },
  { key: "pending",  label: "Awaiting approval", icon: "⏳", barCls: "bg-amber-500",   iconBg: "bg-amber-50 dark:bg-amber-950",   iconCls: "text-amber-600 dark:text-amber-400",  border: "border-amber-100 dark:border-zinc-800"   },
  { key: "approved", label: "Approved",           icon: "✓",  barCls: "bg-emerald-500", iconBg: "bg-emerald-50 dark:bg-emerald-950", iconCls: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-100 dark:border-zinc-800" },
  { key: "rejected", label: "Rejected",           icon: "✕",  barCls: "bg-red-500",     iconBg: "bg-red-50 dark:bg-red-950",     iconCls: "text-red-600 dark:text-red-400",     border: "border-red-100 dark:border-zinc-800"     },
];

export default function MetricCards({ requests = [] }) {
  const total = requests.length;

  const counts = {
    all:      total,
    pending:  requests.filter(r => r.status === "pending").length,
    approved: requests.filter(r => r.status === "approved").length,
    rejected: requests.filter(r => r.status === "rejected").length,
  };

  return (
    <div className="grid grid-cols-4 gap-3">
      {METRICS.map(m => {
        const val = counts[m.key];
        const pct = m.key === "all" ? 100 : total > 0 ? Math.round((val / total) * 100) : 0;
        return (
          <div
            key={m.key}
            className={`bg-white dark:bg-zinc-900 rounded-2xl border ${m.border} p-4 hover:-translate-y-0.5 transition-all duration-150`}
          >
            <div className={`w-7 h-7 rounded-lg ${m.iconBg} flex items-center justify-center ${m.iconCls} text-sm font-semibold mb-3`}>
              {m.icon}
            </div>
            <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1 leading-none">
              {val}
            </div>
            <div className="text-xs text-zinc-400 mb-3">{m.label}</div>
            <div className="h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${m.barCls} rounded-full transition-all duration-700`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}