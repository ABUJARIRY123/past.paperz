import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, Loader2, Plus, RefreshCw, RotateCw, Trash2, X } from "lucide-react";
import { getAccessToken } from "../utils/api";
import AddDocuments from "./AddDocuments";
import PdfViewerModal from "./PdfViewerModal";
import { CURRICULA, DOC_TYPES, mb } from "./documentMeta";

const TYPES = Object.fromEntries(Object.entries(DOC_TYPES).map(([k, v]) => [k, v.label]));

// Brand palette only: black, green, white.
const STATUS = {
  pending_upload: ["Uploading", "bg-white text-black border border-black"],
  uploaded: ["Queued", "bg-green-100 text-green-900"],
  processing: ["Processing", "bg-black text-white"],
  ready: ["Ready", "bg-green-700 text-white"],
  failed: ["Failed", "bg-white text-red-700 border border-red-700"],
};
const BUSY = ["pending_upload", "uploaded", "processing"];

const d = (o) => ({
  id: crypto.randomUUID(), title: "", doc_type: "exam_paper", subject: "Mathematics", grade: 7, year: 2024,
  paper_number: null, session: null, file_name: "file.pdf", size_bytes: 2_400_000, pages: 12, chunk_count: 48,
  status: "ready", error: null, created_at: new Date().toISOString(), curriculum: "cambridge", ...o,
});
const SAMPLE = [
  d({ title: "Mathematics Stage 7 Paper 1", paper_number: 1, session: "May/June", file_name: "maths-s7-p1-2024.pdf" }),
  d({ title: "Lower Secondary Mathematics syllabus", doc_type: "syllabus", year: 2025, pages: 64, chunk_count: 212, file_name: "maths-syllabus.pdf", size_bytes: 4_100_000 }),
  d({ title: "Mathematics Workbook 7", doc_type: "workbook", year: 2022, pages: null, chunk_count: 0, status: "failed", error: "No readable text found. This looks like a scanned PDF and needs OCR.", file_name: "maths-wb7.pdf", size_bytes: 18_000_000 }),
];

// ---------------------------------------------------------------------------
// Toasts: bottom right, stacked, closable. Success fades after 4s, errors after 10s.
// ---------------------------------------------------------------------------
function Toast({ toast, onClose }) {
  const isError = toast.type === "error";

  useEffect(() => {
    const t = setTimeout(() => onClose(toast.id), isError ? 10000 : 4000);
    return () => clearTimeout(t);
  }, [toast.id, isError, onClose]);

  return (
    <div
      role={isError ? "alert" : "status"}
      className={`pointer-events-auto flex w-full items-start gap-3 rounded-xl p-4 shadow-lg ${
        isError ? "border border-red-700 bg-white text-red-700" : "bg-green-700 text-white"
      }`}
    >
      {isError ? <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden />}
      <p className="min-w-0 flex-1 break-words text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        aria-label="Dismiss notification"
        className={`-m-1 shrink-0 rounded p-1 ${isError ? "hover:bg-red-50" : "hover:bg-green-800"}`}
      >
        <X size={16} />
      </button>
    </div>
  );
}

function Toasts({ toasts, onClose }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
    >
      {toasts.map((t) => <Toast key={t.id} toast={t} onClose={onClose} />)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete confirmation dialog (replaces window.confirm).
// ---------------------------------------------------------------------------
function DeleteDialog({ state, onCancel, onConfirm }) {
  const { doc, force, busy } = state;

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && !busy) onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="del-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-700 bg-white text-red-700">
            {force ? <AlertCircle size={20} aria-hidden /> : <Trash2 size={20} aria-hidden />}
          </span>
          <div className="min-w-0">
            <h2 id="del-title" className="text-lg font-bold text-black">
              {force ? "Storage file not found" : "Delete document?"}
            </h2>
            {force ? (
              <p className="mt-1 text-sm text-black">
                The file could not be removed from storage. Delete the database record for{" "}
                <span className="font-semibold break-words">"{doc.title}"</span> anyway?
              </p>
            ) : (
              <p className="mt-1 text-sm text-black">
                <span className="font-semibold break-words">"{doc.title}"</span> and its{" "}
                <span className="font-semibold">{doc.chunk_count}</span> chunks will be permanently removed. This cannot be undone.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={busy}
            autoFocus
            className="rounded-lg border border-black bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-green-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg border border-red-700 bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
          >
            {busy && <Loader2 size={14} className="animate-spin" aria-hidden />}
            {force ? "Delete anyway" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// The `getToken` prop is no longer used. The token always comes from the live Supabase
// session, so a parent passing a stale or empty value cannot break the requests.
export default function DocumentLibrary({ apiBase = "", demo = false }) {
  const [docs, setDocs] = useState(demo ? SAMPLE : []);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null); // { doc, force, busy }
  const [toasts, setToasts] = useState([]);
  const [f, setF] = useState({ q: "", doc_type: "", subject: "", grade: "", year: "", status: "" });
  const lastPollError = useRef("");

  // The prop wins, then the Vite env variable, then the local backend.
  // Restart `npm run dev` after editing .env, because Vite only reads it at startup.
  const base = (apiBase || import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

  const closeToast = useCallback((id) => setToasts((p) => p.filter((t) => t.id !== id)), []);
  const notify = useCallback((type, message) => {
    setToasts((p) => {
      // Do not stack identical messages.
      if (p.some((t) => t.type === type && t.message === message)) return p;
      return [...p.slice(-3), { id: crypto.randomUUID(), type, message }];
    });
  }, []);

  const call = useCallback(async (path, init = {}) => {
    const method = init.method || "GET";
    const url = `${base}/api/admin/documents${path}`;

    // getAccessToken reads the current session and refreshes it when expired.
    const token = await getAccessToken();
    if (!token) {
      throw new Error("You are signed out. Sign in again.");
    }

    // Only JSON bodies get a Content-Type. For FormData the browser must set it (with the boundary).
    const isForm = typeof FormData !== "undefined" && init.body instanceof FormData;

    let res;
    try {
      res = await fetch(url, {
        ...init,
        headers: {
          ...(isForm ? {} : { "Content-Type": "application/json" }),
          ...(init.headers || {}),
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // fetch only throws when the request never completed: server down, wrong URL, or a CORS block.
      throw new Error(`Could not reach the server at ${base}. Check that the backend is running and that CORS allows this origin and the Authorization header.`);
    }

    // A 404 from the server's catch-all can be an HTML page, so the body may not be JSON.
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = (body && (body.error || body.message)) || res.statusText || "Request failed";
      throw new Error(`${method} ${url} returned ${res.status}: ${msg}`);
    }
    if (body === null) throw new Error(`The server did not return JSON from ${url}. Check the API base URL and that /api/admin/documents is mounted.`);
    return body;
  }, [base]);

  // Single-step upload: metadata and PDF go to our server as one multipart request,
  // and the server stores the file in R2. XMLHttpRequest is used because fetch cannot report upload progress.
  const uploadToServer = useCallback(async (meta, file, onProgress) => {
    const token = await getAccessToken();
    if (!token) throw new Error("You are signed out. Sign in again.");

    const fd = new FormData();
    Object.entries(meta).forEach(([k, v]) => fd.append(k, v ?? ""));
    fd.append("file", file); // append the file last, and do not set Content-Type yourself

    const url = `${base}/api/admin/documents`;
    return new Promise((resolve, reject) => {
      const x = new XMLHttpRequest();
      x.open("POST", url);
      x.setRequestHeader("Authorization", `Bearer ${token}`);
      x.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
      x.onload = () => {
        let body = null;
        try { body = JSON.parse(x.responseText); } catch { /* not JSON */ }
        if (x.status >= 200 && x.status < 300) return resolve(body);
        reject(new Error((body && (body.error || body.message)) || `Upload failed (${x.status})`));
      };
      x.onerror = () => reject(new Error(`Could not reach the server at ${base}. Check that the backend is running and that CORS allows this origin.`));
      x.send(fd);
    });
  }, [base]);

  // `silent` is used by the background poll so the spinner does not flash.
  // A failing poll only toasts once per distinct message, not every 5 seconds.
  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      if (demo) {
        await new Promise((r) => setTimeout(r, 500));
      } else {
        const data = await call("");
        if (!Array.isArray(data)) throw new Error("Unexpected response from /api/admin/documents (expected a list).");
        setDocs(data);
        lastPollError.current = "";
      }
    } catch (e) {
      if (!silent || lastPollError.current !== e.message) notify("error", e.message);
      if (silent) lastPollError.current = e.message;
    } finally {
      if (!silent) setLoading(false);
    }
  }, [call, demo, notify]);

  useEffect(() => { if (!demo) refresh(); }, [demo, refresh]);

  // While anything is queued or processing, keep the table fresh.
  // Processing runs on the server after the request returns, so polling is the only way the row can change.
  const anyBusy = docs.some((x) => BUSY.includes(x.status));
  useEffect(() => {
    if (demo || !anyBusy) return;
    const t = setInterval(() => refresh(true), 5000);
    return () => clearInterval(t);
  }, [anyBusy, demo, refresh]);

  const simulate = (id) => {
    setDocs((p) => p.map((x) => (x.id === id ? { ...x, status: "processing", error: null } : x)));
    setTimeout(() => setDocs((p) => p.map((x) => (x.id === id ? { ...x, status: "ready", pages: 20, chunk_count: 64 } : x))), 2500);
  };

  const reprocess = async (id) => {
    try {
      if (demo) simulate(id);
      else { await call(`/${id}/reprocess`, { method: "POST" }); refresh(); }
      notify("success", "Re-processing started.");
    } catch (e) { notify("error", e.message); }
  };

  // Delete flow: the dialog asks first. Rows whose file never reached the bucket (left over from
  // failed uploads) cannot be removed from R2, so a 502 switches the dialog to a force-delete prompt.
  const requestDelete = (x) => setDeleting({ doc: x, force: false, busy: false });
  const cancelDelete = useCallback(() => setDeleting(null), []);

  const confirmDelete = async () => {
    if (!deleting) return;
    const { doc, force } = deleting;
    setDeleting({ doc, force, busy: true });
    try {
      if (demo) {
        setDocs((p) => p.filter((y) => y.id !== doc.id));
      } else {
        await call(`/${doc.id}${force ? "?force=1" : ""}`, { method: "DELETE" });
        refresh();
      }
      setDeleting(null);
      notify("success", `Deleted "${doc.title}".`);
    } catch (e) {
      if (!force && /returned 502/.test(e.message)) {
        setDeleting({ doc, force: true, busy: false });
        return;
      }
      setDeleting(null);
      notify("error", e.message);
    }
  };

  // The viewer asks for a fresh signed link each time it opens.
  const getViewUrl = useCallback(async () => {
    if (!viewing) return "";
    return (await call(`/${viewing.id}/download`)).url;
  }, [call, viewing]);

  const submit = async (meta, file, progress) => {
    if (demo) {
      const x = d({ ...meta, id: crypto.randomUUID(), file_name: file.name, size_bytes: file.size, status: "processing", pages: null, chunk_count: 0 });
      setDocs((p) => [x, ...p]);
      simulate(x.id);
      notify("success", "Document uploaded. Processing started.");
      return;
    }
    // One request: the server stores the PDF in R2, saves file_url, then starts processing in the background.
    await uploadToServer(meta, file, progress);
    refresh();
    notify("success", "Document uploaded. Processing started.");
  };

  const opts = useMemo(() => ({
    subject: [...new Set(docs.map((x) => x.subject))].sort(),
    grade: [...new Set(docs.map((x) => x.grade))].sort((a, b) => a - b),
    year: [...new Set(docs.map((x) => x.year).filter(Boolean))].sort((a, b) => b - a),
  }), [docs]);

  const shown = docs.filter((x) =>
    (!f.q || x.title.toLowerCase().includes(f.q.toLowerCase())) &&
    (!f.doc_type || x.doc_type === f.doc_type) &&
    (!f.subject || x.subject === f.subject) &&
    (!f.grade || x.grade === Number(f.grade)) &&
    (!f.year || x.year === Number(f.year)) &&
    (!f.status || x.status === f.status));

  const count = (fn) => docs.filter(fn).length;
  const sel = "rounded-lg border border-black bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-green-600";

  return (
    <div className="mx-auto mt-20 w-full p-4 text-black sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-black">Reference library</h1>
          <p className="mt-1 text-sm text-green-800">PDFs the generator learns from: syllabi, curriculum maps, books and exam papers.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refresh()} disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-black bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-green-50 disabled:opacity-60">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} aria-hidden /> Refresh
          </button>
          <button onClick={() => setAdding(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800">
            <Plus size={16} aria-hidden /> Add document
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[["Documents", docs.length], ["Ready", count((x) => x.status === "ready")], ["In progress", count((x) => BUSY.includes(x.status))], ["Failed", count((x) => x.status === "failed")]].map(([l, n]) => (
          <div key={l} className="rounded-xl border border-green-200 bg-white p-4">
            <p className="text-xs text-green-800">{l}</p>
            <p className="text-2xl font-bold text-black">{n}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <input value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} placeholder="Search title" aria-label="Search title" className={`${sel} min-w-48 flex-1`} />
        <select aria-label="Type" className={sel} value={f.doc_type} onChange={(e) => setF({ ...f, doc_type: e.target.value })}>
          <option value="">All types</option>{Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select aria-label="Subject" className={sel} value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })}>
          <option value="">All subjects</option>{opts.subject.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select aria-label="Grade" className={sel} value={f.grade} onChange={(e) => setF({ ...f, grade: e.target.value })}>
          <option value="">All grades</option>{opts.grade.map((g) => <option key={g} value={g}>Grade {g}</option>)}
        </select>
        <select aria-label="Year" className={sel} value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })}>
          <option value="">All years</option>{opts.year.map((y) => <option key={y}>{y}</option>)}
        </select>
        <select aria-label="Status" className={sel} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
          <option value="">Any status</option>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v[0]}</option>)}
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-green-200 bg-white">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-black text-xs uppercase tracking-wide text-white">
            <tr>{["Document", "Type", "Subject", "Grade", "Year", "Content", "Status", ""].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-green-100">
            {shown.map((x) => (
              <tr key={x.id} className="align-top">
                <td className="px-4 py-3">
                  <p className="font-semibold text-black">{x.title}</p>
                  <p className="text-xs text-green-800">{CURRICULA[x.curriculum] ?? x.curriculum} • {x.file_name} • {mb(x.size_bytes)}</p>
                </td>
                <td className="px-4 py-3"><span className="rounded-md border border-green-200 bg-green-50 px-2 py-1 text-xs font-medium text-green-900">{TYPES[x.doc_type]}</span></td>
                <td className="px-4 py-3">{x.subject}</td>
                <td className="px-4 py-3">{x.grade}</td>
                <td className="px-4 py-3">
                  {x.year ?? "-"}
                  {x.paper_number ? <span className="text-xs text-green-800"> • P{x.paper_number}</span> : null}
                  {x.session ? <p className="text-xs text-green-800">{x.session}</p> : null}
                </td>
                <td className="px-4 py-3">{x.pages ? `${x.pages} pages` : "-"}<p className="text-xs text-green-800">{x.chunk_count} chunks</p></td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS[x.status]?.[1]}`}>
                    {BUSY.includes(x.status) && <Loader2 size={12} className="animate-spin" aria-hidden />}{STATUS[x.status]?.[0] ?? x.status}
                  </span>
                  {x.error && <p className="mt-1 max-w-56 text-xs text-red-700">{x.error}</p>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {!demo && <button onClick={() => setViewing(x)} aria-label="View PDF" title="View PDF" className="rounded p-2 text-black hover:bg-green-50"><Eye size={16} /></button>}
                    <button onClick={() => reprocess(x.id)} disabled={x.status === "processing"} aria-label="Re-process" title="Re-process: rebuild chunks from the stored PDF" className="rounded p-2 text-black hover:bg-green-50 disabled:opacity-40"><RotateCw size={16} /></button>
                    <button onClick={() => requestDelete(x)} aria-label="Delete" title="Delete" className="rounded p-2 text-red-700 hover:bg-red-50"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!shown.length && (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-green-800">{loading ? "Loading..." : "No documents match. Add one to get started."}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {adding && <AddDocuments onClose={() => setAdding(false)} onSubmit={submit} />}
      {viewing && <PdfViewerModal doc={viewing} getUrl={getViewUrl} onClose={() => setViewing(null)} />}
      {deleting && <DeleteDialog state={deleting} onCancel={cancelDelete} onConfirm={confirmDelete} />}
      <Toasts toasts={toasts} onClose={closeToast} />
    </div>
  );
}