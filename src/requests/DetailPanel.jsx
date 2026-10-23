import { Avatar, Badge, TypePill } from "./Primitives";

function formatAmount(n) {
  if (n == null) return "—";
  return `KES ${Number(n).toLocaleString()}`;
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function getInitials(name = "") {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function leaveDuration(r) {
  if (r.leave_days == null) return "—";
  return `${r.leave_days} day${Number(r.leave_days) === 1 ? "" : "s"}`;
}

// ─── Field sets ───────────────────────────────────────────────────────────────
function getFundFields(r) {
  return [
    ["Activity",          r.activity,                       true],
    ["Project",           r.project,                        false],
    ["Venue",             r.venue,                          false],
    ["Activity date",      formatDate(r.request_date),       false],
    ["Requested amount",  formatAmount(r.requested_amount), false],
    ["Submitted by",      r.submitted_by,                   false],
    ["Submitted to",      r.submitted_to_name,              false],
  ];
}

function getLeaveFields(r) {
  const fields = [
    ["Leave type",   r.leave_type,            false],
    ["Duration",     leaveDuration(r),        false],
    ["Start date",   formatDate(r.start_date), false],
    ["End date",     formatDate(r.end_date),   false],
    ["Submitted by", r.submitted_by,          false],
    ["Supervisor",   r.supervisor_name,       false],
  ];
  if (r.acting_staff_name) fields.push(["Acting staff", r.acting_staff_name, false]);
  if (r.reason)            fields.push(["Reason", r.reason, true]);
  if (r.handover_notes)    fields.push(["Handover notes", r.handover_notes, true]);
  return fields;
}

// ─── Items breakdown (fund only) ──────────────────────────────────────────────
function ItemsTable({ items = [] }) {
  if (!items.length) return null;
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">
        Budget breakdown
      </div>
      <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800 text-zinc-400 text-left">
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium">Payee phone</th>
              <th className="px-3 py-2 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">{item.category || "—"}</td>
                <td className="px-3 py-2 text-zinc-500 dark:text-zinc-400 font-mono">
                  {item.payee_phone || "—"}
                </td>
                <td className="px-3 py-2 text-right font-mono text-zinc-700 dark:text-zinc-300">
                  {formatAmount(item.amount)}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
              <td className="px-3 py-2 font-semibold text-zinc-800 dark:text-zinc-200" colSpan={2}>Total</td>
              <td className="px-3 py-2 text-right font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                {formatAmount(items.reduce((s, i) => s + Number(i.amount || 0), 0))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Fund approvals chain ─────────────────────────────────────────────────────
const APPROVAL_AVATAR_STYLES = [
  "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
];

function ApprovalRow({ approval, index }) {
  const avCls = APPROVAL_AVATAR_STYLES[index % APPROVAL_AVATAR_STYLES.length];
  return (
    <div className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${avCls}`}>
        {`A${index + 1}`}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            {approval.username || approval.name || "Unknown approver"}
          </span>
          <Badge status={approval.status} />
        </div>
        <div className="text-xs text-zinc-500 leading-relaxed">
          {approval.notes || approval.comment || "No comment left."}
        </div>
        {(approval.acted_at || approval.decided_at) && (
          <div className="text-[10px] text-zinc-400 mt-1">
            {formatDate(approval.acted_at || approval.decided_at)}
          </div>
        )}
      </div>
    </div>
  );
}

function ApprovalsSection({ approvals = [], status }) {
  const hasApprovals = approvals.length > 0;
  if (!hasApprovals && status !== "pending") return null;
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">
        Approval history
      </div>
      {hasApprovals ? (
        <div className="space-y-2">
          {approvals.map((a, i) => (
            <ApprovalRow key={a.user_id || i} approval={a} index={i} />
          ))}
        </div>
      ) : (
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs text-zinc-400">
          Awaiting review — no approvals yet.
        </div>
      )}
    </div>
  );
}

// ─── Leave review block ───────────────────────────────────────────────────────
// Leave goes through a single supervisor (maker-checker), not the fund
// approvals array — so show who the reviewer is and the current decision.
function LeaveReviewSection({ r }) {
  const status = (r.status || "").toLowerCase();
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">
        Review
      </div>
      <div className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
          {getInitials(r.supervisor_name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              {r.supervisor_name || "Supervisor"}
            </span>
            <Badge status={r.status} />
          </div>
          <div className="text-xs text-zinc-500 leading-relaxed">
            {status === "pending"
              ? "Awaiting the supervisor's decision."
              : status === "approved"
              ? "Approved by the supervisor."
              : status === "rejected"
              ? (r.decision_notes || r.review_notes || "Rejected by the supervisor.")
              : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────
export default function DetailPanel({ r, onEdit, onRetire }) {
  const isLeave = r.type === "leave";
  const fields  = isLeave ? getLeaveFields(r) : getFundFields(r);
  const ini     = getInitials(r.submitted_by);
  const status  = (r.status || "").toLowerCase();

  // Fund edit rule mirrors the backend: editable until the approval chain
  // starts moving, or once it's been rejected (maker fixes & resubmits).
  const approvals       = Array.isArray(r.approvals) ? r.approvals : [];
  const approvalStarted = approvals.some((a) => a?.user_id && a?.status);
  const isRejected      = status === "rejected" || approvals.some((a) => a?.status === "rejected");

  const canEdit = isLeave
    ? (status === "pending" || status === "draft")
    : (!approvalStarted || isRejected);
  const canRetire = !isLeave && status === "approved";

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="flex items-start gap-3">
        <Avatar ini={ini} idx={0} size="w-10 h-10" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-base leading-snug">
            {r.activity || "Untitled"}
          </div>
          <div className="text-xs text-zinc-400 mt-0.5">{r.submitted_by}</div>
          <div className="text-xs text-zinc-400">
            {isLeave
              ? `${formatDate(r.start_date)} → ${formatDate(r.end_date)}`
              : formatDate(r.request_date)}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge status={r.status} />
          <TypePill type={r.type || "fund"} />
        </div>
      </div>

      {/* Fields grid */}
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">
          {isLeave ? "Leave details" : "Activity & budget"}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {fields.map(([label, val, full], i) => (
            <div
              key={i}
              className={`bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 ${full ? "col-span-2" : ""}`}
            >
              <div className="text-[10px] text-zinc-400 mb-1">{label}</div>
              <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-snug">
                {val || "—"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attachment (leave) */}
      {isLeave && r.attachment_url && (
        
         <a href={r.attachment_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          📎 {r.attachment_name || "View supporting document"}
        </a>
      )}

      {/* Fund-only items table */}
      {!isLeave && <ItemsTable items={r.items} />}

      {/* Review / approval chain */}
      {isLeave
        ? <LeaveReviewSection r={r} />
        : <ApprovalsSection approvals={r.approvals} status={status} />}

      {/* Notes (fund) */}
      {!isLeave && r.notes && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-amber-500 mb-1">Note</div>
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">{r.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex justify-between gap-2">
          <button
            onClick={canEdit ? onEdit : undefined}
            disabled={!canEdit}
            title={canEdit ? undefined : "This request can no longer be edited."}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl border transition-colors ${
              canEdit
                ? "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                : "border-zinc-100 dark:border-zinc-800 text-zinc-300 dark:text-zinc-600 cursor-not-allowed opacity-60"
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M11.5 2.5a1.5 1.5 0 0 1 2.121 2.121L5 13.243 2 14l.757-3L11.5 2.5Z"
                stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Edit
          </button>

          {/* Retire is fund-only */}
          {!isLeave && (
            <button
              onClick={canRetire ? onRetire : undefined}
              disabled={!canRetire}
              title={canRetire ? undefined : "Only approved requests can be retired."}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl border transition-colors ${
                canRetire
                  ? "border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer"
                  : "border-zinc-100 dark:border-zinc-800 text-zinc-300 dark:text-zinc-600 cursor-not-allowed opacity-60"
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M4 1.5h6l3 3v9.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11.5a1 1 0 0 1 1-1Z"
                  stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                <path d="M10 1.5v3h3M5.5 8.5h5M5.5 10.5h5M5.5 12.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              Retire
            </button>
          )}
        </div>

        {/* Contextual hint */}
        {isLeave ? (
          !canEdit && (
            <p className="text-[11px] text-zinc-400">
              This leave request has been {status} and can no longer be edited.
            </p>
          )
        ) : status === "approved" ? (
          <p className="text-[11px] text-zinc-400">
            This request has been approved and is now locked from edits — retire it by attaching a receipt for each item.
          </p>
        ) : !canEdit ? (
          <p className="text-[11px] text-zinc-400">
            This request can no longer be edited — its approval process has already started.
          </p>
        ) : null}
      </div>
    </div>
  );
}