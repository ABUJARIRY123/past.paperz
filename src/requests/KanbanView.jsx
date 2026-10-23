import { Avatar, TypePill } from "./Primitives";

const COLS = [
  { key: "pending",   label: "Pending",   dot: "bg-amber-400",  bar: "bg-amber-400"  },
  { key: "approved",  label: "Approved",  dot: "bg-emerald-500", bar: "bg-emerald-500" },
  { key: "rejected",  label: "Rejected",  dot: "bg-red-500",    bar: "bg-red-500"    },
  { key: "retired",   label: "Retired",   dot: "bg-zinc-400",   bar: "bg-zinc-400"   },
];

const STATUS_PCT = {
  pending:  25,
  approved: 75,
  rejected: 100,
  retired:  100,
};

function getInitials(name = "") {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// "12 Jun – 18 Jun" for the leave period
function formatRange(a, b) {
  if (!a) return "—";
  const opts = { day: "numeric", month: "short" };
  const start = new Date(a).toLocaleDateString("en-GB", opts);
  if (!b) return start;
  return `${start} – ${new Date(b).toLocaleDateString("en-GB", opts)}`;
}

function formatAmount(n) {
  if (n == null) return null;
  return `KES ${Number(n).toLocaleString()}`;
}

function formatDays(n) {
  if (n == null) return null;
  return `${n} day${Number(n) === 1 ? "" : "s"}`;
}

function ApproverDot({ slot, label }) {
  let dotClass = "bg-zinc-200 dark:bg-zinc-700";
  if (slot?.status === "approved") dotClass = "bg-emerald-500";
  if (slot?.status === "rejected") dotClass = "bg-red-500";
  if (slot?.status === "pending")  dotClass = "bg-amber-400";

  return (
    <div className="flex items-center gap-1">
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      <span className="text-[10px] text-zinc-400">{label}</span>
    </div>
  );
}

function KanbanCard({ r, idx, isActive, onClick }) {
  const col = COLS.find(c => c.key === r.status);
  const pct = STATUS_PCT[r.status] || 0;
  const isLeave = r.type === "leave";

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-zinc-900 border rounded-xl p-3.5 cursor-pointer hover:-translate-y-0.5 transition-all duration-150 group ${
        isActive
          ? "border-blue-500 dark:border-blue-500"
          : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600"
      }`}
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {r.activity || "Untitled"}
        </span>
        <TypePill type={r.type} />
      </div>

      {/* Body — leave shows period + reviewer; fund shows project + venue */}
      {isLeave ? (
        <>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-0.5 line-clamp-1 leading-relaxed">
            📅 {formatRange(r.start_date, r.end_date)}
          </p>
          {r.supervisor_name && (
            <p className="text-xs text-zinc-300 dark:text-zinc-600 mb-3 line-clamp-1">
              → {r.supervisor_name.split(" ")[0]} (reviewer)
            </p>
          )}
        </>
      ) : (
        <>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-0.5 line-clamp-1 leading-relaxed">
            {r.project || "—"}
          </p>
          {r.venue && (
            <p className="text-xs text-zinc-300 dark:text-zinc-600 mb-3 line-clamp-1">
              📍 {r.venue}
            </p>
          )}
        </>
      )}

      {/* Progress bar */}
      <div className="w-full h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${col?.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar ini={getInitials(r.submitted_by)} idx={idx} size="w-7 h-7" />
          <span className="text-[11px] text-zinc-400 line-clamp-1 max-w-[80px]">
            {r.submitted_by?.split(" ")[0] || "—"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {isLeave ? (
            <span className="text-[11px] text-zinc-400 font-mono">
              {formatDate(r.start_date)}
            </span>
          ) : (
            <>
              <ApproverDot slot={r.approver1} label="A1" />
              <ApproverDot slot={r.approver2} label="A2" />
              <ApproverDot slot={r.approver3} label="A3" />
              <span className="text-[11px] text-zinc-400 font-mono ml-1">
                {formatDate(r.request_date)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Bottom chip — leave shows duration, fund shows requested amount */}
      {isLeave ? (
        r.leave_days != null && (
          <div className="mt-2.5 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-[11px] text-zinc-400">Duration</span>
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 font-mono">
              {formatDays(r.leave_days)}
            </span>
          </div>
        )
      ) : (
        r.requested_amount != null && (
          <div className="mt-2.5 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-[11px] text-zinc-400">Requested</span>
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 font-mono">
              {formatAmount(r.requested_amount)}
            </span>
          </div>
        )
      )}
    </div>
  );
}

export default function KanbanView({ records, activeId, onSelect }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {COLS.map(col => {
        const items = records.filter(r => r.status === col.key);
        return (
          <div key={col.key}>
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  {col.label}
                </span>
              </div>
              <span className="text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-full px-2 py-0.5">
                {items.length}
              </span>
            </div>

            <div className="space-y-2.5">
              {items.length ? (
                items.map((r, idx) => (
                  <KanbanCard
                    key={r.id}
                    r={r}
                    idx={idx}
                    isActive={activeId === r.id}
                    onClick={() => onSelect(r)}
                  />
                ))
              ) : (
                <div className="text-xs text-zinc-300 dark:text-zinc-600 text-center py-6 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                  No requests
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}