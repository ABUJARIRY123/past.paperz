import { Avatar, Badge, TypePill } from "./Primitives";

function getInitials(name = "") {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatAmount(n) {
  if (n == null) return "—";
  return `KES ${Number(n).toLocaleString()}`;
}

function formatDays(n) {
  if (n == null) return "—";
  return `${n} day${Number(n) === 1 ? "" : "s"}`;
}

export default function ListView({ records, activeId, onSelect }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
      {/* Head — column 4 is amount for fund / duration for leave */}
      <div className="grid grid-cols-[1fr_120px_110px_110px_80px_56px] text-[10px] font-semibold uppercase tracking-widest text-zinc-400 px-5 py-3 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-700">
        <span>Request</span>
        <span>Type</span>
        <span>Date</span>
        <span>Amount / Days</span>
        <span>Status</span>
        <span />
      </div>

      {records.length === 0 ? (
        <div className="text-center py-12 text-zinc-300 dark:text-zinc-600 text-sm">
          No requests match your filters
        </div>
      ) : (
        records.map((r, idx) => {
          const isActive = activeId === r.id;
          const ini = getInitials(r.submitted_by);
          const isLeave = r.type === "leave";

          return (
            <div
              key={r.id}
              onClick={() => onSelect(r)}
              className={`grid grid-cols-[1fr_120px_110px_110px_80px_56px] items-center px-5 py-3.5 border-b border-zinc-50 dark:border-zinc-800 last:border-0 cursor-pointer transition-colors group ${
                isActive
                  ? "bg-blue-50 dark:bg-zinc-800 border-l-2 border-l-blue-500"
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              {/* Request info */}
              <div className="flex items-center gap-3 min-w-0">
                <Avatar ini={ini} idx={idx} size="w-8 h-8" />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                    {r.activity || "Untitled"}
                  </div>
                  <div className="text-xs text-zinc-400 truncate">
                    {isLeave
                      ? `${r.submitted_by} · ${formatDays(r.leave_days)}`
                      : `${r.submitted_by} · ${r.project || "—"}`}
                  </div>
                </div>
              </div>

              <TypePill type={r.type || "fund"} />

              <span className="text-xs text-zinc-400">{formatDate(r.request_date)}</span>

              <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
                {isLeave ? formatDays(r.leave_days) : formatAmount(r.requested_amount)}
              </span>

              <Badge status={r.status} />

              <button
                onClick={e => { e.stopPropagation(); onSelect(r); }}
                className="text-xs px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                View
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}