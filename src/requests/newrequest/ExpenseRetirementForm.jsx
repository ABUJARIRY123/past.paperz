import { useState, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function formatAmount(n) {
  if (n == null || n === "") return "—";
  return `KES ${Number(n).toLocaleString()}`;
}

// ─── File preview ─────────────────────────────────────────────────────────────
function FilePreview({ file, onRemove }) {
  const isImage = file.type.startsWith("image/");
  const url = URL.createObjectURL(file);

  return (
    <div className="relative group rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
      {isImage ? (
        <a href={url} target="_blank" rel="noopener noreferrer">
          <img src={url} alt={file.name} className="w-full h-24 object-cover" />
        </a>
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center gap-1.5 h-24 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 4a2 2 0 0 1 2-2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4Z"
              stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
            />
            <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path
              d="M8 13h2a1.5 1.5 0 0 1 0 3H8v-3Zm0 0v5m4-5h1.5a1.5 1.5 0 0 1 0 3H12m4-3v5"
              stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
          <span className="text-[10px] font-medium truncate max-w-[90%] px-2">{file.name}</span>
        </a>
      )}

      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-zinc-900/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
        title="Remove receipt"
      >
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
          <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>

      {isImage && (
        <div className="px-2 py-1 text-[10px] text-zinc-500 dark:text-zinc-400 truncate border-t border-zinc-100 dark:border-zinc-700">
          {file.name}
        </div>
      )}
    </div>
  );
}

// ─── One row per budget line item ─────────────────────────────────────────────
function ReceiptRow({ item, index, value, onFieldChange, onFilesAdd, onFileRemove, error }) {
  const fileInputRef = useRef(null);
  const receipts = value.receipts || [];

  const handleFilePick = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) onFilesAdd(index, files);
    e.target.value = "";
  };

  return (
    <div
      className={`rounded-xl border p-3 space-y-3 ${
        error
          ? "border-red-300 dark:border-red-700"
          : "border-zinc-200 dark:border-zinc-700"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            {item.category || "Uncategorized"}
          </div>
          <div className="text-xs text-zinc-400">Requested {formatAmount(item.amount)}</div>
        </div>
        {receipts.length > 0 && (
          <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full flex-shrink-0">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
              <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {receipts.length} attached
          </span>
        )}
      </div>

      {/* Actual amount */}
      <div className="space-y-1">
        <label className="block text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          Actual spent (KES)
        </label>
        <input
          type="number"
          value={value.actualAmount}
          onChange={(e) => onFieldChange(index, "actualAmount", e.target.value)}
          className="w-full h-9 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
        />
      </div>

      {/* Receipts */}
      <div className="space-y-2">
        <label className="block text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          Receipts
        </label>

        {receipts.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {receipts.map((file, fIdx) => (
              <FilePreview
                key={`${file.name}-${file.lastModified}-${fIdx}`}
                file={file}
                onRemove={() => onFileRemove(index, fIdx)}
              />
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-16 rounded-lg border-2 border-dashed border-zinc-200 dark:border-zinc-700 flex flex-col items-center justify-center gap-1 text-zinc-400 hover:border-emerald-400 hover:text-emerald-500 dark:hover:border-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="text-[11px] font-medium">
            {receipts.length ? "Add another receipt" : "Click to attach receipt(s)"}
          </span>
          <span className="text-[10px]">Image or PDF · multiple allowed</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          multiple
          className="hidden"
          onChange={handleFilePick}
        />
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <label className="block text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          Notes (optional)
        </label>
        <input
          type="text"
          value={value.notes}
          onChange={(e) => onFieldChange(index, "notes", e.target.value)}
          placeholder="e.g. paid in cash, partial refund"
          className="w-full h-9 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────
export default function FundRetirementForm({ record, onCancel, onSuccess }) {
  const items = record?.items?.length
    ? record.items
    : [{ category: "General", amount: record?.requested_amount || 0 }];

  // `sourceIndex` pins each row to its exact position in `items` (and, by
  // extension, in the `request.items` JSON column on the backend). This is
  // sent alongside `category` so the backend can match deterministically
  // instead of relying on category strings alone.
  const [lines, setLines] = useState(
    items.map((item, idx) => ({
      sourceIndex:  idx,
      category:     item.category,
      actualAmount: item.amount != null ? String(item.amount) : "",
      receipts:     [], // now an array — one or more File objects per line
      notes:        "",
    }))
  );
  const [lineErrors, setLineErrors]   = useState({});
  const [formError, setFormError]     = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearRowError = (index) => {
    if (lineErrors[index]) setLineErrors((prev) => ({ ...prev, [index]: undefined }));
    if (formError) setFormError(null);
  };

  const handleFieldChange = (index, field, value) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
    clearRowError(index);
  };

  const handleFilesAdd = (index, newFiles) => {
    setLines((prev) =>
      prev.map((l, i) => (i === index ? { ...l, receipts: [...l.receipts, ...newFiles] } : l))
    );
    clearRowError(index);
  };

  const handleFileRemove = (index, fileIdx) => {
    setLines((prev) =>
      prev.map((l, i) =>
        i === index ? { ...l, receipts: l.receipts.filter((_, fi) => fi !== fileIdx) } : l
      )
    );
  };

  const totalRequested = items.reduce((s, i) => s + Number(i.amount || 0), 0);
  const totalActual    = lines.reduce((s, l) => s + (parseFloat(l.actualAmount) || 0), 0);
  const variance       = totalActual - totalRequested;

  const validate = () => {
    const errs = {};
    lines.forEach((line, i) => {
      if (!line.receipts.length) errs[i] = "At least one receipt is required to retire this item.";
    });
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) {
      setLineErrors(errs);
      setFormError(`Attach at least one receipt for every line item (${Object.keys(errs).length} missing).`);
      return;
    }
    setLineErrors({});
    setFormError(null);

    // Build multipart FormData
    // Field naming: items[i][category], items[i][actual_amount], items[i][notes], items[i][line_index]
    // File naming:  items[i][receipts][j] — one entry per receipt attached to line i
    const body = new FormData();
    lines.forEach((line, i) => {
      body.append(`items[${i}][category]`,      line.category     || "");
      body.append(`items[${i}][actual_amount]`, line.actualAmount || "0");
      body.append(`items[${i}][notes]`,         line.notes        || "");
      body.append(`items[${i}][line_index]`,    String(line.sourceIndex));
      line.receipts.forEach((file, j) => {
        body.append(`items[${i}][receipts][${j}]`, file); // File object
      });
    });

    try {
      setIsSubmitting(true);
      const res = await fetch(
        `${API_BASE}/api/finances/retire/${record.id}`,
        {
          method:      "PATCH",
          credentials: "include",
          body,                    // no Content-Type header — browser sets multipart boundary
        }
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        setFormError(data.message || "Retirement failed. Please try again.");
        return;
      }

      onSuccess?.(data.request);
    } catch {
      setFormError("Network error — check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col">
      <p className="text-xs text-zinc-400 mb-3">
        Record what was actually spent against each budget line and attach the matching receipt(s).
      </p>

      <div className="space-y-3">
        {lines.map((line, i) => (
          <ReceiptRow
            key={i}
            item={items[i]}
            index={i}
            value={line}
            onFieldChange={handleFieldChange}
            onFilesAdd={handleFilesAdd}
            onFileRemove={handleFileRemove}
            error={lineErrors[i]}
          />
        ))}
      </div>

      {formError && <p className="mt-3 text-xs text-red-500">{formError}</p>}

      {/* Footer */}
      <div className="mt-5 pt-3 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-between gap-3">
        <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-0.5">
          <div>
            Requested:{" "}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {formatAmount(totalRequested)}
            </span>
          </div>
          <div>
            Actual:{" "}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {formatAmount(totalActual)}
            </span>
            {variance !== 0 && (
              <span className={variance > 0 ? "text-amber-500" : "text-emerald-500"}>
                {" "}({variance > 0 ? "+" : ""}
                {formatAmount(variance)})
              </span>
            )}
          </div>
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
            disabled={isSubmitting}
            className="h-9 px-4 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting…" : "Submit retirement"}
          </button>
        </div>
      </div>
    </div>
  );
}