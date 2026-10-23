import { useState, useEffect, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const CATEGORY_OPTIONS = [
  "Staff Incidentals", "Participant Transport", "Accommodation",
  "Meals/Refreshments", "Facilitation Fees", "Venue Hire",
  "Airtime/Data", "Printing/Stationery", "Fuel", "Admin Costs", "Others",
];

const EMPTY_LINE = { category: "", requested: "", payeePhone: "" };

// Turn the API's `items` shape (amount/category/payee_phone) into the shape
// this form edits (category/requested/payeePhone).
function itemsToLineItems(items) {
  if (!items?.length) return [{ ...EMPTY_LINE }];
  return items.map(item => ({
    category:   item.category || "",
    requested:  item.amount != null ? String(item.amount) : "",
    payeePhone: item.payee_phone || "",
  }));
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toast, onDismiss }) {
  if (!toast) return null;

  const styles = {
    error:     "bg-red-600 text-white",
    duplicate: "bg-amber-500 text-white",
    success:   "bg-emerald-600 text-white",
  };

  const icons = {
    error:     "✕",
    duplicate: "⚠",
    success:   "✓",
  };

  return (
    <div
      className={`fixed bottom-5 right-5 z-[9999] flex items-start gap-3 max-w-sm w-full px-4 py-3 rounded-xl shadow-xl transition-all duration-300 ${styles[toast.type] ?? styles.error}`}
      role="alert"
    >
      <span className="mt-0.5 text-base leading-none font-bold shrink-0">{icons[toast.type]}</span>
      <div className="flex-1 min-w-0">
        {toast.title && <p className="text-sm font-semibold leading-snug">{toast.title}</p>}
        <p className="text-xs leading-snug opacity-90 mt-0.5">{toast.message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 opacity-70 hover:opacity-100 text-white text-lg leading-none mt-0.5"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

// ─── Line item row ────────────────────────────────────────────────────────────
function LineItemRow({ item, index, onChange, onRemove, showRemove }) {
  return (
    <div className="grid gap-3 items-end" style={{ gridTemplateColumns: "1fr 1fr 1fr auto" }}>
      <div className="space-y-1">
        {index === 0 && (
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
            Category
          </label>
        )}
        <select
          value={item.category}
          onChange={e => onChange(index, "category", e.target.value)}
          className="w-full h-9 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          <option value="">— select —</option>
          {CATEGORY_OPTIONS.map(o => <option key={o}>{o}</option>)}
        </select>
      </div>

      <div className="space-y-1">
        {index === 0 && (
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
            Requested (KES)
          </label>
        )}
        <input
          type="number"
          value={item.requested}
          onChange={e => onChange(index, "requested", e.target.value)}
          placeholder="0"
          className="w-full h-9 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        />
      </div>

      <div className="space-y-1">
        {index === 0 && (
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
            Payee phone number
          </label>
        )}
        <input
          type="tel"
          value={item.payeePhone}
          onChange={e => onChange(index, "payeePhone", e.target.value)}
          placeholder="0712345…"
          className="w-full h-9 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        />
      </div>

      <div className={index === 0 ? "pt-5" : ""}>
        {showRemove ? (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="h-9 w-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193v-.443A2.75 2.75 0 0011.25 1h-2.5zm0 1.5h2.5c.69 0 1.25.56 1.25 1.25v.33a43.52 43.52 0 00-5 0v-.33c0-.69.56-1.25 1.25-1.25zM6.5 7.28l.739 9.225a1.25 1.25 0 001.247 1.145h3.027a1.25 1.25 0 001.247-1.145L13.5 7.28a41.33 41.33 0 00-7 0z" clipRule="evenodd" />
            </svg>
          </button>
        ) : (
          <div className="h-9 w-9" />
        )}
      </div>
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────
// mode: "new" (default) | "edit"
// initialData: the full request record, only present when mode === "edit"
export default function FundRequestForm({
  formData,
  errors: extErrors,
  onChange,
  firstInputRef,
  onCancel,
  onSuccess,
  mode = "new",
  initialData = null,
  submitLabel,
}) {
  const isEdit = mode === "edit" && !!initialData;

  const [lineItems, setLineItems]       = useState(() => itemsToLineItems(initialData?.items));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors]   = useState({});
  const [projects, setProjects]         = useState([]);
  const [recipients, setRecipients]     = useState([]);   // people the request can be sent to
  const [toast, setToast]               = useState(null);
  const toastTimer                      = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/projects/titles`, { credentials: "include" })
      .then(r => r.json())
      .then(data => { if (data.success) setProjects(data.projects); })
      .catch(() => {});
  }, []);

  // Recipients the request can be submitted to.
  // API: GET /api/reporting/reportsreceivers → { success, mentors: [{ id, username, email }] }
  useEffect(() => {
    fetch(`${API_BASE}/api/reporting/requestsreceivers`, { credentials: "include" })
      .then(r => r.json())
      .then(data => { if (data.success) setRecipients(data.mentors || []); })
      .catch(() => {});
  }, []);

  // Auto-dismiss toast after 6 s
  const showToast = (type, title, message) => {
    clearTimeout(toastTimer.current);
    setToast({ type, title, message });
    toastTimer.current = setTimeout(() => setToast(null), 6000);
  };

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const handleLineChange = (index, field, value) => {
    const updated = lineItems.map((item, i) => i === index ? { ...item, [field]: value } : item);
    setLineItems(updated);
    onChange("lineItems", updated);
  };

  const addLine    = () => setLineItems(prev => [...prev, { ...EMPTY_LINE }]);
  const removeLine = (index) => {
    const updated = lineItems.filter((_, i) => i !== index);
    setLineItems(updated);
    onChange("lineItems", updated);
  };

  const total  = lineItems.reduce((sum, item) => sum + (parseFloat(item.requested) || 0), 0);
  const errors = { ...extErrors, ...fieldErrors };

  const validate = () => {
    const errs = {};
    if (!formData.purpose?.trim()) errs.purpose = "Activity is required.";
    if (!formData.submittedTo?.id) errs.submittedTo = "Select who to submit to.";
    if (total <= 0) errs.lineItems = "Add at least one line item with an amount.";
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setFieldErrors({});

    const payload = {
      project:            formData.project || null,
      purpose:            formData.purpose,
      venue:              formData.venue || null,
      request_date:       formData.actDate || null,
      requested_amount:   total,
      // Recipient — send id, username and email so the backend can notify them
      // and seed them as the first entry in the approvals chain.
      submitted_to:       formData.submittedTo?.id || null,
      submitted_to_name:  formData.submittedTo?.username || null,
      submitted_to_email: formData.submittedTo?.email || null,
      items: lineItems.map(item => ({
        category:    item.category,
        amount:      parseFloat(item.requested) || 0,
        payee_phone: item.payeePhone || null,
      })),
    };

    // New requests POST to the collection; edits PATCH the specific record.
    // Confirm the exact verb/route your API expects for updates — adjust
    // here if it differs (e.g. PUT, or a /update suffix).
    const endpoint = isEdit
      ? `${API_BASE}/api/finances/fundrequests/${initialData.id}`
      : `${API_BASE}/api/finances/fundrequests`;
    const method = isEdit ? "PATCH" : "POST";

    try {
      setIsSubmitting(true);
      const res  = await fetch(endpoint, {
        method,
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.duplicate) {
          showToast(
            "duplicate",
            "Duplicate request detected",
            data.message,
          );
        } else {
          showToast("error", "Submission failed", data.message || "Please try again.");
        }
        return;
      }

      onSuccess?.(data.request);
    } catch {
      showToast("error", "Network error", "Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls = (name) =>
    `w-full h-9 px-3 rounded-lg border text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
      errors[name] ? "border-red-400 dark:border-red-500" : "border-zinc-200 dark:border-zinc-700"
    }`;

  const idleLabel = submitLabel || (isEdit ? "Save changes" : "Submit request");

  return (
    <>
      {/* Bottom-right toast — rendered outside the modal flow */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      <div className="flex flex-col">
        <div className="px-1">

          {/* Row 1: Project + Submitted to + Activity */}
          <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: "1fr 1fr 1.3fr" }}>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Project name
              </label>
              <select
                ref={firstInputRef}
                value={formData.project || ""}
                onChange={e => onChange("project", e.target.value)}
                className={inputCls("project")}
              >
                <option value="">— select project —</option>
                {projects.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
              {errors.project && <p className="text-xs text-red-500">{errors.project}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Submitted to
              </label>
              <select
                value={formData.submittedTo?.id || ""}
                onChange={e => {
                  const m = recipients.find(x => x.id === e.target.value) || null;
                  onChange("submittedTo", m && { id: m.id, username: m.username, email: m.email });
                  if (fieldErrors.submittedTo) setFieldErrors(p => ({ ...p, submittedTo: undefined }));
                }}
                className={inputCls("submittedTo")}
              >
                <option value="">— select recipient —</option>
                {recipients.map(m => (
                  <option key={m.id} value={m.id}>{m.username}</option>
                ))}
              </select>
              {errors.submittedTo && <p className="text-xs text-red-500">{errors.submittedTo}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Activity
              </label>
              <input
                type="text"
                value={formData.purpose || ""}
                onChange={e => {
                  onChange("purpose", e.target.value);
                  if (fieldErrors.purpose) setFieldErrors(p => ({ ...p, purpose: undefined }));
                }}
                placeholder="Activity to be carried out."
                className={inputCls("purpose")}
              />
              {errors.purpose && <p className="text-xs text-red-500">{errors.purpose}</p>}
            </div>
          </div>

          {/* Row 2: Activity date + Venue */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Activity date
              </label>
              <input
                type="date"
                value={formData.actDate || ""}
                onChange={e => onChange("actDate", e.target.value)}
                className={inputCls("actDate")}
              />
              {errors.actDate && <p className="text-xs text-red-500">{errors.actDate}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Venue
              </label>
              <input
                type="text"
                value={formData.venue || ""}
                onChange={e => onChange("venue", e.target.value)}
                placeholder="City, venue name"
                className={inputCls("venue")}
              />
              {errors.venue && <p className="text-xs text-red-500">{errors.venue}</p>}
            </div>
          </div>

          {/* Line items */}
          <div className="mt-1 space-y-2">
            {lineItems.map((item, i) => (
              <LineItemRow
                key={i}
                index={i}
                item={item}
                onChange={handleLineChange}
                onRemove={removeLine}
                showRemove={lineItems.length > 1}
              />
            ))}
          </div>
          {errors.lineItems && <p className="mt-1 text-xs text-red-500">{errors.lineItems}</p>}

          <button
            type="button"
            onClick={addLine}
            className="mt-2 flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-600 font-medium transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" />
            </svg>
            Add line item
          </button>
        </div>

        {/* Footer */}
        <div className="mt-5 -mx-1 px-1 pt-3 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Total requested</span>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              KES {total.toLocaleString("en-KE", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="h-9 px-4 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || total === 0}
              className="h-9 px-4 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting…" : idleLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}