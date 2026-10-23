import { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { signoutSuccess } from "../../../redux/user/userSlice";

// ── Icons ──────────────────────────────────────────────────────────────────────
const SaveIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);
const CloseIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const ChevronDownIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const TrashIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" />
  </svg>
);
const ImageIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);
const SpinnerIcon = () => (
  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
  </svg>
);

// ── Shared ─────────────────────────────────────────────────────────────────────
const FieldLabel = ({ children }) => (
  <label className="text-[11px] font-semibold text-green-700 dark:text-green-400 uppercase tracking-widest mb-1.5 block">
    {children}
  </label>
);

const base =
  "w-full border border-green-200 dark:border-green-800 rounded-xl px-3 py-2.5 text-sm text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-150 placeholder:text-zinc-300 dark:placeholder:text-zinc-600";

const errBase = (hasErr) =>
  hasErr
    ? base.replace("border-green-200", "border-red-400").replace("dark:border-green-800", "dark:border-red-500")
    : base;

const SectionDivider = ({ label }) => (
  <div className="flex items-center gap-3 pt-2">
    <div className="flex-1 h-px bg-green-100 dark:bg-green-900/40" />
    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-green-600/60 dark:text-green-400/50">
      {label}
    </span>
    <div className="flex-1 h-px bg-green-100 dark:bg-green-900/40" />
  </div>
);

// ── Emoji picker ───────────────────────────────────────────────────────────────
const EMOJIS = ["🎒","📖","🌱","🚀","🏕️","🧠","🌿","⚖️","🏛️","🎙️","💡","🤝","🎓","🌍","🏆","✏️","🔬","🎨","💼","🌟"];

function EmojiPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${base} flex items-center justify-between`}
      >
        <span className="flex items-center gap-2">
          {value ? <span className="text-xl">{value}</span> : <span className="text-zinc-300 dark:text-zinc-600 text-sm">Pick icon…</span>}
        </span>
        <span className={`text-zinc-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}><ChevronDownIcon /></span>
      </button>
      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-white dark:bg-zinc-900 border border-green-200 dark:border-green-800 rounded-xl shadow-xl p-3 grid grid-cols-10 gap-1">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => { onChange(e); setOpen(false); }}
              className={`text-xl p-1 rounded-lg transition-colors ${value === e ? "bg-green-100 dark:bg-green-900/50" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Highlights editor ──────────────────────────────────────────────────────────
function HighlightsEditor({ value, onChange }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onChange([...value, trimmed]);
    setDraft("");
  };
  const remove = (i) => onChange(value.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="Type a highlight and press Enter or Add…"
          className={`${base} flex-1`}
        />
        <button
          type="button"
          onClick={add}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-green-700 hover:bg-green-800 text-white transition-colors flex-shrink-0"
        >
          Add
        </button>
      </div>
      {value.length > 0 && (
        <ul className="space-y-1.5">
          {value.map((h, i) => (
            <li key={i} className="flex items-start gap-2 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/40 rounded-lg px-3 py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
              <span className="flex-1 text-sm text-zinc-700 dark:text-zinc-300 leading-snug">{h}</span>
              <button type="button" onClick={() => remove(i)} className="text-zinc-300 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5">
                <TrashIcon />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Existing image strip (already-saved images) ────────────────────────────────
function ExistingImageStrip({ images, onRemove, coverIndex, label }) {
  if (!images?.length) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">{label}</p>
      <div className="grid grid-cols-4 gap-2">
        {images.map((url, i) => (
          <div key={i} className="relative group rounded-xl overflow-hidden border border-green-100 dark:border-green-900/40" style={{ aspectRatio: "4/3" }}>
            <img src={url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <CloseIcon />
            </button>
            {i === coverIndex && (
              <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold bg-green-400 text-black px-1.5 py-0.5 rounded">Cover</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── New image drop zone ────────────────────────────────────────────────────────
function ImageDropZone({ label, files, onChange, multiple = false, hint }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  const handleFiles = (incoming) => {
    const imgs = Array.from(incoming).filter((f) => f.type.startsWith("image/"));
    if (!imgs.length) return;
    onChange(multiple ? [...files, ...imgs] : [imgs[0]]);
  };

  const removeFile = (i) => onChange(files.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-2 py-6 px-4
          ${drag
            ? "border-green-400 bg-green-50 dark:bg-green-900/20"
            : "border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 hover:bg-green-50/50 dark:hover:bg-green-900/10"
          }`}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple={multiple} className="hidden"
          onChange={(e) => handleFiles(e.target.files)} />
        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
          <ImageIcon />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-green-700 dark:text-green-400">{label}</p>
          {hint && <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{hint}</p>}
          <p className="text-xs text-zinc-300 dark:text-zinc-600 mt-1">Drag & drop or click — max 10 MB each</p>
        </div>
      </div>

      {files.length > 0 && (
        <div className={`grid gap-2 ${multiple ? "grid-cols-4" : "grid-cols-2"}`}>
          {files.map((f, i) => (
            <div key={i} className="relative group rounded-xl overflow-hidden border border-green-100 dark:border-green-900/40" style={{ aspectRatio: "4/3" }}>
              <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <CloseIcon />
              </button>
              {i === 0 && !multiple && (
                <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold bg-green-400 text-black px-1.5 py-0.5 rounded">New Cover</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Parent program selector ────────────────────────────────────────────────────
function ParentProgramSelect({ value, onChange }) {
  const [open, setOpen]         = useState(false);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading]   = useState(false);
  const ref                     = useRef(null);
  const navigate                = useNavigate();
  const dispatch                = useDispatch();

  useEffect(() => {
    if (!open || programs.length) return;
    setLoading(true);
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/programs/list?parent_only=true`, { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (j.logout) { dispatch(signoutSuccess()); navigate("/sign-in"); return; }
        setPrograms(j.programs ?? j.data ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const selected = programs.find((p) => p.id === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${base} flex items-center justify-between`}
      >
        <span className={selected ? "text-zinc-700 dark:text-zinc-200 text-sm" : "text-zinc-300 dark:text-zinc-600 text-sm"}>
          {selected ? `${selected.icon ?? ""} ${selected.title}` : "None (top-level program)"}
        </span>
        <span className={`text-zinc-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}><ChevronDownIcon /></span>
      </button>
      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-white dark:bg-zinc-900 border border-green-200 dark:border-green-800 rounded-xl shadow-xl overflow-hidden">
          <ul className="max-h-52 overflow-y-auto py-1">
            <li>
              <button
                type="button"
                onClick={() => { onChange(null); setOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-sm text-zinc-500 dark:text-zinc-400 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors italic"
              >
                None (top-level program)
              </button>
            </li>
            {loading && <li className="px-4 py-3 text-sm text-zinc-400 text-center">Loading…</li>}
            {!loading && programs.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => { onChange(p.id); setOpen(false); }}
                  className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
                >
                  {p.icon && <span className="text-base">{p.icon}</span>}
                  <span className="flex-1 min-w-0">
                    <span className="block font-medium truncate">{p.title}</span>
                    <span className="block text-[11px] text-zinc-400">{p.program_no}</span>
                  </span>
                  {value === p.id && <span className="text-green-500 text-xs">✓</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Main Edit Modal ────────────────────────────────────────────────────────────
/**
 * Props:
 *   program   — the full program object to edit (from your API / parent state)
 *   onClose   — () => void
 *   onUpdated — (updatedProgram) => void
 */
export default function EditProgramModal({ program, onClose, onUpdated }) {
  const [form, setForm] = useState({
    parent_id:    program.parent_id    ?? null,
    num:          program.program_no   ?? "",
    icon:         program.icon         ?? "",
    title:        program.title        ?? "",
    badge:        program.badge        ?? "",
    desc:         program.desc         ?? "",
    full_desc:    program.full_desc    ?? "",
    impact:       program.impact       ?? "",
    impact_label: program.impact_label ?? "",
    status:       program.status       ?? "Active",
    highlights:   program.highlights   ?? [],
    // Existing saved image URLs
    existingCover:   program.cover_image_url ? [program.cover_image_url] : [],
    existingGallery: program.gallery_urls    ?? [],
    // New files being uploaded this session
    newCoverFiles:   [],
    newGalleryFiles: [],
    // Track which existing images were removed
    removedCoverUrls:   [],
    removedGalleryUrls: [],
  });

  const [errors, setErrors]         = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError]     = useState(null);
  const navigate                    = useNavigate();
  const dispatch                    = useDispatch();

  const set = (field) => (e) => {
    const val = typeof e === "string" || Array.isArray(e) ? e : e.target.value;
    setForm((f) => ({ ...f, [field]: val }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
    if (apiError) setApiError(null);
  };

  const removeExistingCover = (i) => {
    const url = form.existingCover[i];
    setForm((f) => ({
      ...f,
      existingCover:    f.existingCover.filter((_, idx) => idx !== i),
      removedCoverUrls: [...f.removedCoverUrls, url],
    }));
  };

  const removeExistingGallery = (i) => {
    const url = form.existingGallery[i];
    setForm((f) => ({
      ...f,
      existingGallery:    f.existingGallery.filter((_, idx) => idx !== i),
      removedGalleryUrls: [...f.removedGalleryUrls, url],
    }));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = "Program title is required";
    if (!form.desc.trim())  errs.desc  = "Short description is required";
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    setApiError(null);

    try {
      const fd = new FormData();

      // Core fields
      fd.append("id",    program.id);
      if (form.parent_id)    fd.append("parent_id",    form.parent_id);
      if (form.num)          fd.append("num",           form.num.trim());
      if (form.icon)         fd.append("icon",          form.icon);
      fd.append("title",        form.title.trim());
      if (form.badge)        fd.append("badge",         form.badge.trim());
      fd.append("desc",         form.desc.trim());
      if (form.full_desc)    fd.append("full_desc",     form.full_desc.trim());
      if (form.impact)       fd.append("impact",        form.impact.trim());
      if (form.impact_label) fd.append("impact_label",  form.impact_label.trim());
      fd.append("status",       form.status);
      fd.append("highlights",   JSON.stringify(form.highlights));

      // Removed existing images
      if (form.removedCoverUrls.length)   fd.append("removed_cover",   JSON.stringify(form.removedCoverUrls));
      if (form.removedGalleryUrls.length) fd.append("removed_gallery", JSON.stringify(form.removedGalleryUrls));

      // New images
      if (form.newCoverFiles[0])   fd.append("cover_image", form.newCoverFiles[0]);
      for (const f of form.newGalleryFiles) fd.append("gallery", f);

      const res  = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/projects/programs/update`, {
        method:      "PUT",
        credentials: "include",
        body:        fd,
      });

      const json = await res.json();

      if (json.logout) { dispatch(signoutSuccess()); navigate("/sign-in"); return; }
      if (!res.ok && json.errors) { setErrors(json.errors); setApiError(json.message ?? "Please correct the highlighted fields."); return; }
      if (!res.ok) throw new Error(json.message ?? "Failed to update program");

      onUpdated(json.program);
      onClose();

    } catch (err) {
      setApiError(err.message ?? "An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-950 border border-green-100 dark:border-green-900/60 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="sticky top-0 bg-white dark:bg-zinc-950 z-10 flex items-start justify-between px-6 pt-6 pb-4 border-b border-green-50 dark:border-green-900/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-700 flex items-center justify-center text-white flex-shrink-0">
              <SaveIcon />
            </div>
            <div>
              <h2 className="text-sm font-bold text-green-950 dark:text-green-50">Edit Program</h2>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 truncate max-w-[280px]">
                {program.icon && `${program.icon} `}{program.title}
              </p>
            </div>
          </div>
          <button onClick={onClose} disabled={submitting}
            className="cursor-pointer text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40">
            <CloseIcon />
          </button>
        </div>

        {/* ── API error banner ── */}
        {apiError && (
          <div className="mx-6 mt-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
            {apiError}
          </div>
        )}

        {/* ── Body ── */}
        <div className="px-6 py-5 space-y-5">

          <SectionDivider label="Identity" />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Parent program</FieldLabel>
              <ParentProgramSelect value={form.parent_id} onChange={set("parent_id")} />
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">Leave empty for a top-level program.</p>
            </div>
            <div>
              <FieldLabel>Status</FieldLabel>
              <select value={form.status} onChange={set("status")} className={base} disabled={submitting}>
                {["Active", "Draft", "Archived"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <FieldLabel>Icon</FieldLabel>
              <EmojiPicker value={form.icon} onChange={set("icon")} />
            </div>
            <div>
              <FieldLabel>Program no.</FieldLabel>
              <input value={form.num} onChange={set("num")} placeholder="e.g. 01" className={base} disabled={submitting} />
            </div>
            <div>
              <FieldLabel>Badge label</FieldLabel>
              <input value={form.badge} onChange={set("badge")} placeholder="e.g. Flagship" className={base} disabled={submitting} />
            </div>
          </div>

          <div>
            <FieldLabel>Program title <span className="text-red-400">*</span></FieldLabel>
            <input value={form.title} onChange={set("title")} placeholder="e.g. Provision of Learners' Education Kits"
              className={errBase(errors.title)} disabled={submitting} />
            {errors.title && <p className="text-[11px] text-red-500 mt-1">{errors.title}</p>}
          </div>

          <SectionDivider label="Content" />

          <div>
            <FieldLabel>Short description <span className="text-red-400">*</span></FieldLabel>
            <textarea value={form.desc} onChange={set("desc")} rows={3}
              placeholder="Shown on the program card — one or two punchy sentences."
              className={`${errBase(errors.desc)} resize-none`} disabled={submitting} />
            {errors.desc && <p className="text-[11px] text-red-500 mt-1">{errors.desc}</p>}
          </div>

          <div>
            <FieldLabel>
              Full description{" "}
              <span className="normal-case font-normal text-zinc-400">(separate paragraphs with a blank line)</span>
            </FieldLabel>
            <textarea value={form.full_desc} onChange={set("full_desc")} rows={7}
              placeholder={"First paragraph…\n\nSecond paragraph…\n\nThird paragraph…"}
              className={`${base} resize-none`} disabled={submitting} />
          </div>

          <SectionDivider label="Impact stat" />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Impact value</FieldLabel>
              <input value={form.impact} onChange={set("impact")} placeholder="e.g. 500+ or 3,500+" className={base} disabled={submitting} />
            </div>
            <div>
              <FieldLabel>Impact label</FieldLabel>
              <input value={form.impact_label} onChange={set("impact_label")} placeholder="e.g. Kits Distributed" className={base} disabled={submitting} />
            </div>
          </div>

          <SectionDivider label="Key highlights" />

          <div>
            <FieldLabel>Highlights</FieldLabel>
            <HighlightsEditor value={form.highlights} onChange={set("highlights")} />
          </div>

          <SectionDivider label="Media" />

          {/* Cover */}
          <div className="space-y-3">
            <FieldLabel>Cover image</FieldLabel>
            <ExistingImageStrip
              images={form.existingCover}
              onRemove={removeExistingCover}
              coverIndex={0}
              label="Current cover — click × to remove"
            />
            <ImageDropZone
              label={form.existingCover.length ? "Replace cover image" : "Upload cover image"}
              hint="Used on the program card and as the first gallery image"
              files={form.newCoverFiles}
              onChange={set("newCoverFiles")}
              multiple={false}
            />
          </div>

          {/* Gallery */}
          <div className="space-y-3">
            <FieldLabel>Gallery images</FieldLabel>
            <ExistingImageStrip
              images={form.existingGallery}
              onRemove={removeExistingGallery}
              label="Current gallery — click × to remove individual images"
            />
            <ImageDropZone
              label="Add more gallery images"
              hint="Up to 8 images shown in the detail page carousel"
              files={form.newGalleryFiles}
              onChange={set("newGalleryFiles")}
              multiple={true}
            />
          </div>

          <p className="text-[11px] text-zinc-400 dark:text-zinc-600">
            <span className="text-red-400">*</span> Required fields
          </p>
        </div>

        {/* ── Footer ── */}
        <div className="sticky bottom-0 bg-white dark:bg-zinc-950 px-6 pb-6 pt-3 border-t border-green-50 dark:border-green-900/40 flex gap-2.5">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-700 hover:bg-green-800 dark:bg-green-600 dark:hover:bg-green-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <><SpinnerIcon /> Saving…</>
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}