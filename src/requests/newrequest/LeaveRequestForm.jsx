import { useEffect, useRef, useState } from "react";

const API = import.meta.env.VITE_API_BASE_URL;

// ─── Leave types and their required attachment labels ──────────────────────
const LEAVE_TYPES = [
  { value: "Annual",       label: "Annual Leave",          attachment: null },
  { value: "Sick",         label: "Sick Leave",            attachment: "Doctor's Note" },
  { value: "Compassionate",label: "Compassionate Leave",   attachment: "Burial Permit" },
  { value: "Maternity",    label: "Maternity Leave",       attachment: "Birth Certificate / Expectancy Letter" },
  { value: "Paternity",    label: "Paternity Leave",       attachment: "Birth Certificate" },
  { value: "Study",        label: "Study Leave",           attachment: "Timetable / Enrolment Letter" },
  { value: "Emergency",    label: "Emergency Leave",       attachment: null },
  { value: "Unpaid",       label: "Unpaid Leave",          attachment: null },
];

// ─── Kenyan public holidays (YYYY-MM-DD) ───────────────────────────────────
// IMPORTANT: this list MUST match whatever the backend uses to deduct balance,
// otherwise the days shown here will diverge from the days actually subtracted.
// Ideally fetch this from the server (e.g. /api/leaving/holidays) instead of
// hardcoding, so there's a single source of truth.
// Movable holidays (Good Friday, Easter Monday, Eid al-Fitr, Eid al-Adha) are
// gazetted yearly and must be kept current.
const PUBLIC_HOLIDAYS = new Set([
  // 2026
  "2026-01-01", // New Year's Day
  "2026-04-03", // Good Friday
  "2026-04-06", // Easter Monday
  "2026-05-01", // Labour Day
  "2026-06-01", // Madaraka Day
  "2026-10-10", // Utamaduni / Huduma Day
  "2026-10-20", // Mashujaa Day
  "2026-12-12", // Jamhuri Day
  "2026-12-25", // Christmas Day
  "2026-12-26", // Boxing Day
  // Eid al-Fitr / Eid al-Adha — add gazetted dates once announced
]);

// Kept for the modal's generic validate import — leave now self-validates.
export const leaveFields = [
  { name: "leaveType",   label: "Leave Type",       type: "select" },
  { name: "startDate",   label: "Start Date",       type: "date" },
  { name: "endDate",     label: "End Date",         type: "date" },
  { name: "submittedTo", label: "Submitted To",     type: "select" },
  { name: "reason",      label: "Reason for Leave", type: "textarea" },
];

// ─── Small reusable field wrapper ──────────────────────────────────────────
function Field({ label, required, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

const inputCls = (err) =>
  `w-full h-9 px-3 rounded-lg border text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
    err ? "border-red-400 dark:border-red-500" : "border-zinc-200 dark:border-zinc-700"
  }`;

// ─── Helpers ───────────────────────────────────────────────────────────────

// Parse a YYYY-MM-DD string into a LOCAL date (avoids the UTC off-by-one that
// `new Date("2026-01-01")` introduces, which would shift getDay()).
function toLocalDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// Count working days in an inclusive range, skipping weekends and holidays.
// Returns "" for an invalid (reversed) range, otherwise a number (which may be 0
// if the whole range falls on weekends/holidays).
function calcWorkingDays(start, end) {
  if (!start || !end) return "";
  const s = toLocalDate(start);
  const e = toLocalDate(end);
  if (e < s) return "";

  let count = 0;
  for (const d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    const day = d.getDay(); // 0 = Sun, 6 = Sat
    if (day === 0 || day === 6) continue;
    if (PUBLIC_HOLIDAYS.has(toISO(d))) continue;
    count++;
  }
  return count;
}

// ─── Main component ────────────────────────────────────────────────────────
export default function LeaveRequestForm({
  firstInputRef,
  onCancel,
  onSuccess,        // (createdRequest) => void  — called on a successful submit
  onSessionExpired, // optional () => void — wire to your Redux signoutSuccess
  onBalanceChange,  // optional (balance:number|null) => void — lift balance to modal header
}) {
  const fileRef = useRef(null);

  // This form owns its own state + submission.
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const onChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  // Two distinct staff lists, each from its own endpoint:
  //   • acting (replacement) staff  → /api/reporting/reportsreceivers
  //   • supervisor (submitted-to)   → /api/reporting/requestsreceivers
  const [actingStaffList, setActingStaffList] = useState([]);
  const [supervisorList, setSupervisorList]   = useState([]);
  const [loadingStaff, setLoadingStaff]       = useState(true);

  // Current user's annual leave balance
  const [balance, setBalance] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(true);

  // Fetch both lists in parallel; flip loadingStaff off once both settle.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [actingRes, supervisorRes] = await Promise.allSettled([
          fetch(`${API}/api/reporting/reportsreceivers`, { credentials: "include" }),
          fetch(`${API}/api/reporting/requestsreceivers`, { credentials: "include" }),
        ]);

        // ── acting / replacement staff ──
        if (actingRes.status === "fulfilled" && actingRes.value.ok) {
          const json = await actingRes.value.json();
          if (active && json?.success) setActingStaffList(json.mentors || []);
        }

        // ── supervisor / submitted-to ──
        if (supervisorRes.status === "fulfilled" && supervisorRes.value.ok) {
          const json = await supervisorRes.value.json();
          if (active && json?.success) setSupervisorList(json.mentors || []);
        }
      } catch {
        // non-fatal — dropdowns simply stay empty
      } finally {
        if (active) setLoadingStaff(false);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`${API}/api/leaving/leavebalance`, {
          credentials: "include",
        });
        if (res.status === 401) { onSessionExpired?.(); return; }
        const json = await res.json();
        if (active && json?.success) {
          const b = Number(json.balance ?? 0);
          setBalance(b);
          onBalanceChange?.(b);
        }
      } catch {
        // non-fatal — balance just won't render
      } finally {
        if (active) setLoadingBalance(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const selectedType = LEAVE_TYPES.find((t) => t.value === formData.leaveType);
  const attachmentLabel = selectedType?.attachment ?? null;
  const days = calcWorkingDays(formData.startDate, formData.endDate);
  const noWorkingDays = days === 0; // valid range but all weekend/holiday

  const isAnnual = formData.leaveType === "Annual";
  const overAnnual =
    isAnnual && days !== "" && balance !== null && Number(days) > Number(balance);

  const handleFile = (e) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > 5 * 1024 * 1024) {
      setErrors((p) => ({ ...p, attachment: "File must be 5 MB or smaller." }));
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    onChange("attachment", file);
  };

  // Mutually exclude the two pickers so the same person isn't both, even though
  // the options now come from two different endpoints.
  const supervisorOptions  = supervisorList.filter((s) => s.id !== formData.actingStaff);
  const actingStaffOptions = actingStaffList.filter((s) => s.id !== formData.submittedTo);

  // ── client-side guard (only for an actual submit, not a draft) ──
  function validateClient(status) {
    if (status === "draft") return {};
    const e = {};
    if (!formData.leaveType) e.leaveType = "Select a valid leave type.";
    if (!formData.startDate) e.startDate = "Start date is required.";
    if (!formData.endDate) e.endDate = "End date is required.";
    if (!formData.reason?.trim()) e.reason = "Reason is required.";
    if (!formData.submittedTo) e.submittedTo = "Select a supervisor.";
    if (formData.startDate && formData.endDate && days === "")
      e.endDate = "End date cannot be before start date.";
    if (formData.startDate && formData.endDate && days === 0)
      e.endDate = "The selected range has no working days.";
    if (attachmentLabel && !formData.attachment)
      e.attachment = `${attachmentLabel} is required.`;
    if (isAnnual && days !== "" && balance !== null && Number(days) > Number(balance))
      e.endDate = `You only have ${balance} annual leave day${balance !== 1 ? "s" : ""} remaining.`;
    return e;
  }

  // ── POST to /api/leaving/requestleave (multipart) ──
  async function submit(status) {
    if (submitting) return;

    const clientErrors = validateClient(status);
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      return;
    }

    const fd = new FormData();
    fd.append("leaveType", formData.leaveType || "");
    fd.append("startDate", formData.startDate || "");
    fd.append("endDate", formData.endDate || "");
    fd.append("reason", formData.reason || "");
    fd.append("handoverNotes", formData.handoverNotes || "");
    fd.append("submittedTo", formData.submittedTo || "");
    if (formData.actingStaff) fd.append("actingStaff", formData.actingStaff);
    fd.append("status", status);
    if (formData.attachment) fd.append("attachment", formData.attachment);

    setSubmitting(true);
    setErrors({});
    try {
      const res = await fetch(`${API}/api/leaving/requestleave`, {
        method: "POST",
        credentials: "include",
        body: fd, // don't set Content-Type — browser sets the multipart boundary
      });

      if (res.status === 401) {
        onSessionExpired?.();
        return;
      }

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        if (json.errors) setErrors(json.errors);
        else setErrors({ _form: json.message || "Could not submit leave request." });
        return;
      }

      // reflect the new balance returned by the server
      if (typeof json.balance === "number") {
        setBalance(json.balance);
        onBalanceChange?.(json.balance);
      }

      onSuccess?.(json.request);
    } catch {
      setErrors({ _form: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* ── Leave balance header band ── */}
      <div className="flex items-center justify-between mb-5 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Annual Leave Balance
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Remaining days available to you
          </p>
        </div>
        <div className="text-right">
          {loadingBalance ? (
            <span className="text-sm text-zinc-400">Loading…</span>
          ) : (
            <span className={`text-2xl font-semibold ${overAnnual ? "text-red-500" : "text-zinc-900 dark:text-zinc-100"}`}>
              {balance ?? "—"}
              <span className="ml-1 text-xs font-normal text-zinc-400">
                day{balance !== 1 ? "s" : ""}
              </span>
            </span>
          )}
        </div>
      </div>

      {errors._form && (
        <div className="mb-4 px-3 py-2 rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400">
          {errors._form}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-5">
        <Field label="Leave Type" required error={errors.leaveType}>
          <select
            ref={firstInputRef}
            value={formData.leaveType || ""}
            onChange={(e) => onChange("leaveType", e.target.value)}
            className={inputCls(errors.leaveType)}
          >
            <option value="">Select type…</option>
            {LEAVE_TYPES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Field>

        <Field label="Start Date" required error={errors.startDate}>
          <input
            type="date"
            value={formData.startDate || ""}
            onChange={(e) => onChange("startDate", e.target.value)}
            className={inputCls(errors.startDate)}
          />
        </Field>

        <Field label="End Date" required error={errors.endDate}>
          <input
            type="date"
            value={formData.endDate || ""}
            min={formData.startDate || undefined}
            onChange={(e) => onChange("endDate", e.target.value)}
            className={inputCls(errors.endDate)}
          />
        </Field>

        <Field label="Number of Working Days Requested">
          <input
            type="text"
            readOnly
            value={days !== "" ? `${days} day${days !== 1 ? "s" : ""}` : ""}
            placeholder="Auto-calculated"
            className={`${inputCls(false)} bg-zinc-50 dark:bg-zinc-900 text-zinc-500 cursor-default`}
          />
          {noWorkingDays && (
            <p className="text-[11px] text-amber-500 mt-1">
              The selected range falls entirely on weekends or public holidays.
            </p>
          )}
          {isAnnual && overAnnual && (
            <p className="text-[11px] text-red-500 mt-1">
              Exceeds your balance of {balance} day{balance !== 1 ? "s" : ""}.
            </p>
          )}
          {/* {days !== "" && !noWorkingDays && (
            <p className="text-[11px] text-zinc-400 mt-1">
              Weekends and public holidays are excluded.
            </p>
          )} */}
        </Field>
      </div>

      {/* ── Section: Reason ── */}
      <div className="mb-5">
        <Field label="Reason for Leave" required error={errors.reason}>
          <textarea
            rows={3}
            value={formData.reason || ""}
            onChange={(e) => onChange("reason", e.target.value)}
            placeholder="Briefly describe the reason for this leave request…"
            className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none ${
              errors.reason ? "border-red-400 dark:border-red-500" : "border-zinc-200 dark:border-zinc-700"
            }`}
          />
        </Field>
      </div>

      {/* ── Section: Supporting Document (conditional) ── */}
      {attachmentLabel && (
        <div className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3">
            Supporting Document
          </p>
          <Field label={`${attachmentLabel} (required)`} required error={errors.attachment}>
            <div
              onClick={() => fileRef.current?.click()}
              className={`flex items-center gap-3 h-10 px-3 rounded-lg border cursor-pointer transition-colors ${
                formData.attachment
                  ? "border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/20"
                  : errors.attachment
                  ? "border-red-400 dark:border-red-500 bg-white dark:bg-zinc-800"
                  : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-blue-400 dark:hover:border-blue-500"
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 text-zinc-400">
                <path d="M4 10V4a4 4 0 0 1 8 0v7a2.5 2.5 0 0 1-5 0V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-sm text-zinc-500 dark:text-zinc-400 truncate flex-1">
                {formData.attachment ? formData.attachment.name : `Upload ${attachmentLabel}…`}
              </span>
              {formData.attachment && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onChange("attachment", null); if (fileRef.current) fileRef.current.value = ""; }}
                  className="text-zinc-400 hover:text-red-500 transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden" onChange={handleFile} />
            <p className="text-[11px] text-zinc-400 mt-1">PDF, JPG, PNG, or Word — max 5 MB</p>
          </Field>
        </div>
      )}

      {/* ── Section: Handover & Submission ── */}
      <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3">
        Handover &amp; Submission
      </p>

      <div className="mb-5">
        <Field label="Pending Work / Handover Notes" error={errors.handoverNotes}>
          <textarea
            rows={3}
            value={formData.handoverNotes || ""}
            onChange={(e) => onChange("handoverNotes", e.target.value)}
            placeholder="Describe any pending tasks or responsibilities to be handed over…"
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none"
          />
        </Field>
      </div>

      {/* Acting Staff + Submitted To on the same line */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Field label="Acting Staff During Absence" error={errors.actingStaff}>
          <select
            value={formData.actingStaff || ""}
            onChange={(e) => onChange("actingStaff", e.target.value)}
            className={inputCls(errors.actingStaff)}
          >
            <option value="">
              {loadingStaff ? "Loading staff…" : "Select colleague covering your duties…"}
            </option>
            {actingStaffOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.username}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Submitted To (Supervisor)" required error={errors.submittedTo}>
          <select
            value={formData.submittedTo || ""}
            onChange={(e) => onChange("submittedTo", e.target.value)}
            className={inputCls(errors.submittedTo)}
          >
            <option value="">
              {loadingStaff ? "Loading staff…" : "Select supervisor…"}
            </option>
            {supervisorOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.username}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-4 h-9 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
     
        <button
          type="button"
          onClick={() => submit("pending")}
          disabled={submitting || overAnnual || noWorkingDays}
          className="px-5 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit Request"}
        </button>
      </div>
    </>
  );
}