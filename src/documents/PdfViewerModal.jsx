import { useEffect, useState } from "react";
import { ExternalLink, FileText, Loader2, X } from "lucide-react";
import { CURRICULA, DOC_TYPES, mb } from "./documentMeta";

/* Full-screen PDF preview for a source_documents row.
   <PdfViewerModal doc={row} getUrl={async () => signedUrl} onClose={() => ...} />
   The bucket is private, so the signed link is fetched when the modal opens. */

const headerBtn =
  "flex h-8 w-8 items-center justify-center rounded-lg border border-black bg-white text-black transition-colors hover:bg-green-50 disabled:opacity-40";

export default function PdfViewerModal({ doc, getUrl, onClose }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Escape closes, and the page behind does not scroll while the viewer is open.
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  // Ask the server for a short-lived signed link for this document.
  useEffect(() => {
    let live = true;
    setUrl(""); setError(""); setLoading(true);
    getUrl()
      .then((u) => { if (live) setUrl(u); })
      .catch((e) => { if (live) { setError(e.message || "Could not open this PDF."); setLoading(false); } });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.id]);

  const type = DOC_TYPES[doc.doc_type]?.label ?? doc.doc_type;
  const subtitle = [
    CURRICULA[doc.curriculum] ?? doc.curriculum,
    type,
    `Grade ${doc.grade}`,
    doc.year,
    doc.size_bytes ? mb(doc.size_bytes) : null,
  ].filter(Boolean).join(" • ");

  const openExternal = () => { if (url) window.open(url, "_blank", "noopener,noreferrer"); };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white" role="dialog" aria-modal="true" aria-label={`Preview of ${doc.title}`}>
      <div className="flex shrink-0 items-center gap-3 border-b border-black px-4 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-700 text-white">
          <FileText size={18} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-black">{doc.title}</p>
          <p className="truncate text-xs text-green-800">{subtitle}</p>
        </div>
        <button type="button" title="Open in new tab" aria-label="Open in new tab" onClick={openExternal} disabled={!url} className={headerBtn}>
          <ExternalLink size={16} />
        </button>
        <button type="button" title="Close" aria-label="Close" onClick={onClose} className={headerBtn}>
          <X size={16} />
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden bg-green-50">
        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-green-700">
            <Loader2 size={32} className="animate-spin" aria-hidden />
          </div>
        )}

        {url && !error && (
          <iframe title={doc.title} src={url} className="h-full w-full border-0" onLoad={() => setLoading(false)} />
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <FileText size={42} strokeWidth={1.5} className="text-green-700" aria-hidden />
            <p className="max-w-md text-sm text-black">{error}</p>
            <button type="button" onClick={onClose}
              className="h-9 rounded-lg bg-green-700 px-4 text-sm font-semibold text-white hover:bg-green-800">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}