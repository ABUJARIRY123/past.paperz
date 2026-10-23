import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, FileText, Loader2, UploadCloud, X } from "lucide-react";
import { CURRICULA, DOC_TYPES, MAX_MB, mb, needsYearAndPaper } from "./documentMeta";

/* Modal for adding a PDF to the reference library.
   <AddDocumentDialog onClose={() => ...} onSubmit={async (meta, file, onProgress) => { ... }} />
   onSubmit should throw an Error to show a message inside the dialog; the dialog closes when it resolves. */

const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: THIS_YEAR - 1999 }, (_, i) => THIS_YEAR - i);
const GRADES = Array.from({ length: 13 }, (_, i) => i + 1);
const SUBJECTS = ["Mathematics", "Science", "English"];

const labelCls = "block text-xs font-medium mb-1.5 text-neutral-500 dark:text-neutral-400";
const fieldCls = (err) =>
  "w-full h-9 px-3 text-sm rounded-lg border bg-white dark:bg-neutral-800 " +
  "text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600 " +
  "focus:outline-none focus:ring-2 focus:ring-green-400 dark:focus:ring-green-600 transition-colors " +
  (err ? "border-red-300 dark:border-red-700" : "border-neutral-200 dark:border-neutral-700");

function Field({ label, required, hint, error, className = "", children }) {
  return (
    <div className={className}>
      <label className={labelCls}>
        {label} {required && <span className="text-red-500">*</span>}
        {hint && <span className="ml-1 font-normal text-neutral-400 dark:text-neutral-600">{hint}</span>}
        {children}
      </label>
      {error && <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}

// Custom dropdown with icons and tags, closes on outside click.
function Dropdown({ value, options, onChange, error }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);
  const current = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative mt-1.5">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open}
        className={`${fieldCls(error)} flex items-center justify-between`}>
        <span className="flex items-center gap-2 truncate">
          {current?.icon && <span>{current.icon}</span>}
          <span>{current?.label ?? "Select"}</span>
        </span>
        <ChevronDown size={16} aria-hidden className={`shrink-0 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div role="listbox" className="absolute left-0 right-0 top-full z-30 mt-2 max-h-60 overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
          {options.map((o) => (
            <button key={o.value} type="button" role="option" aria-selected={o.value === value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                o.value === value
                  ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                  : "text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-700/40"}`}>
              {o.icon && <span>{o.icon}</span>}
              <span className="flex-1 truncate">{o.label}</span>
              {o.tag && <span className="shrink-0 rounded-full bg-black px-1.5 py-0.5 text-[10px] font-medium text-white dark:bg-white dark:text-black">{o.tag}</span>}
              {o.value === value && <Check size={14} aria-hidden className="shrink-0 text-green-600 dark:text-green-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const typeOptions = Object.entries(DOC_TYPES).map(([value, t]) => ({ value, ...t }));
const curriculumOptions = Object.entries(CURRICULA).map(([value, label]) => ({ value, label }));

function validateFile(f) {
  if (!f) return "Choose a PDF";
  if (f.type !== "application/pdf" && !/\.pdf$/i.test(f.name)) return "Only PDF files are supported";
  if (f.size > MAX_MB * 1048576) return `File must be under ${MAX_MB} MB`;
  return null;
}

export default function AddDocumentDialog({ onClose, onSubmit }) {
  const [file, setFile] = useState(null);
  const [m, setM] = useState({
    curriculum: "cambridge", title: "", doc_type: "exam_paper", subject: "",
    grade: 7, year: THIS_YEAR, paper_number: null, session: null,
  });
  const [errors, setErrors] = useState({});
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const inputRef = useRef(null);
  const paperLike = needsYearAndPaper(m.doc_type);
  const type = DOC_TYPES[m.doc_type];

  const update = (k, v) => { setM((p) => ({ ...p, [k]: v })); setErrors((p) => ({ ...p, [k]: null, general: null })); };

  // Escape closes (not mid-upload); page behind does not scroll while the modal is open.
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && !busy) onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [busy, onClose]);

  const handleFile = (f) => {
    const err = validateFile(f);
    if (err) return setErrors((p) => ({ ...p, file: err }));
    setFile(f);
    setErrors((p) => ({ ...p, file: null }));
    if (!m.title) update("title", f.name.replace(/\.pdf$/i, "").replace(/[_-]+/g, " "));
  };

  const validate = () => {
    const e = {};
    if (m.title.trim().length < 2) e.title = "Title is required";
    if (!m.subject.trim()) e.subject = "Subject is required";
    if (paperLike && !m.year) e.year = "Exam year is required";
    const fe = validateFile(file);
    if (fe) e.file = fe;
    return e;
  };

  const submit = async () => {
    const e = validate();
    if (Object.keys(e).length) return setErrors(e);
    setBusy(true);
    setErrors({});
    try {
      await onSubmit({
        ...m, title: m.title.trim(), subject: m.subject.trim(),
        paper_number: paperLike ? m.paper_number : null, session: paperLike ? m.session : null,
      }, file, setPct);
      onClose();
    } catch (err) {
      setErrors({ general: err.message || "Something went wrong. Please try again." });
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label="Add document"
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-base dark:bg-green-900/30">🗂️</span>
            <h2 className="text-sm font-medium text-neutral-900 dark:text-white">Add document</h2>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 disabled:opacity-40 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
          {errors.general && (
            <div role="alert" className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              {errors.general}
            </div>
          )}

          {/* Drop zone */}
          <div>
            <label className={labelCls}>PDF file <span className="text-red-500">*</span></label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
              onClick={() => inputRef.current?.click()}
              className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-5 text-center transition-all ${
                dragOver ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                : errors.file ? "border-red-300 bg-red-50/40 dark:border-red-700 dark:bg-red-900/10"
                : "border-neutral-200 bg-neutral-50 hover:border-green-400 dark:border-neutral-700 dark:bg-neutral-800/50 dark:hover:border-green-600"}`}>
              <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ""; }} />
              {file ? (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <FileText size={15} aria-hidden className="text-green-600 dark:text-green-400" />
                  <span className="max-w-[280px] truncate font-medium text-neutral-800 dark:text-neutral-200">{file.name}</span>
                  <span className="shrink-0 text-xs text-neutral-400 dark:text-neutral-500">({mb(file.size)})</span>
                  <button type="button" aria-label="Remove file" onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-neutral-400 transition-colors hover:text-red-500">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-neutral-400 dark:text-neutral-500">
                  <UploadCloud size={28} strokeWidth={1.5} aria-hidden />
                  <p className="text-sm"><span className="font-medium text-green-600 dark:text-green-400">Click to upload</span> or drag and drop</p>
                  <p className="text-xs">PDF only, max {MAX_MB} MB</p>
                </div>
              )}
            </div>
            {errors.file && <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{errors.file}</p>}
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Title" required error={errors.title} className="sm:col-span-2">
              <input type="text" value={m.title} onChange={(e) => update("title", e.target.value)}
                placeholder="e.g. Mathematics Stage 7 Paper 1" className={`${fieldCls(errors.title)} mt-1.5`} />
            </Field>

            <div>
              <label className={labelCls}>Document type <span className="text-red-500">*</span></label>
              <Dropdown value={m.doc_type} options={typeOptions} onChange={(v) => update("doc_type", v)} />
            </div>
            <div>
              <label className={labelCls}>Curriculum <span className="text-red-500">*</span></label>
              <Dropdown value={m.curriculum} options={curriculumOptions} onChange={(v) => update("curriculum", v)} />
            </div>

            <Field label="Subject" required error={errors.subject}>
              <input type="text" list="doc-subjects" value={m.subject} onChange={(e) => update("subject", e.target.value)}
                placeholder="e.g. Mathematics" className={`${fieldCls(errors.subject)} mt-1.5`} />
              <datalist id="doc-subjects">{SUBJECTS.map((s) => <option key={s} value={s} />)}</datalist>
            </Field>
            <Field label="Grade / stage" required>
              <select value={m.grade} onChange={(e) => update("grade", Number(e.target.value))} className={`${fieldCls(false)} mt-1.5`}>
                {GRADES.map((g) => <option key={g} value={g}>Grade {g}</option>)}
              </select>
            </Field>

            <Field label={paperLike ? "Exam year" : "Edition / publication year"} required={paperLike} error={errors.year}>
              <select value={m.year ?? ""} onChange={(e) => update("year", e.target.value ? Number(e.target.value) : null)} className={`${fieldCls(errors.year)} mt-1.5`}>
                {!paperLike && <option value="">Unknown</option>}
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </Field>
            {paperLike && (
              <Field label="Paper number" hint="(optional)">
                <select value={m.paper_number ?? ""} onChange={(e) => update("paper_number", e.target.value ? Number(e.target.value) : null)} className={`${fieldCls(false)} mt-1.5`}>
                  <option value="">-</option>
                  {[1, 2, 3, 4].map((n) => <option key={n} value={n}>Paper {n}</option>)}
                </select>
              </Field>
            )}
            {paperLike && (
              <Field label="Session" hint="(optional)">
                <input type="text" value={m.session ?? ""} onChange={(e) => update("session", e.target.value || null)}
                  placeholder="e.g. May/June" className={`${fieldCls(false)} mt-1.5`} />
              </Field>
            )}
          </div>

          {busy && (
            <div className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full bg-green-600 transition-all" style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-neutral-100 bg-neutral-50 px-5 py-3.5 dark:border-neutral-800 dark:bg-neutral-900/60">
          <span className="flex min-w-0 items-center gap-1.5 truncate text-xs text-neutral-400 dark:text-neutral-500">
            <span>{type.icon}</span><span>{type.label}</span>
            <span className="text-neutral-300 dark:text-neutral-600">·</span>
            <span className="truncate">{m.subject.trim() || "No subject"} · Grade {m.grade}{m.year ? ` · ${m.year}` : ""}</span>
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={onClose} disabled={busy}
              className="h-9 rounded-lg border border-neutral-200 bg-white px-4 text-sm text-neutral-500 transition-colors hover:bg-neutral-50 disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700">
              Cancel
            </button>
            <button type="button" onClick={submit} disabled={busy}
              className="flex h-9 items-center gap-2 rounded-lg bg-green-600 px-4 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50 dark:bg-green-500 dark:text-black dark:hover:bg-green-400">
              {busy ? <><Loader2 size={16} className="animate-spin" aria-hidden /> {pct >= 100 ? "Finishing…" : `Uploading ${pct}%`}</> : "Upload and process"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}