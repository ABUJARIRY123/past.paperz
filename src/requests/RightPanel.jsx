import { useEffect } from "react";
import { CloseButton } from "./Primitives";
import DetailPanel from "./DetailPanel";
import RequestForm from "./RequestForm";
import FundRetirementForm from "./newrequest/ExpenseRetirementForm";
import LeaveRequestForm from "./newrequest/LeaveRequestForm";

// Leave: edit allowed while pending/draft; never retired.
// Fund:  edit gating is derived from approvals, not status (see below).
const FUND_RETIRE_ENABLED_STATUSES = ["approved"];
const LEAVE_EDITABLE_STATUSES      = ["pending", "draft"];

const MODAL_SIZES = {
  sm:  "max-w-sm",
  md:  "max-w-md",
  lg:  "max-w-lg",
  xl:  "max-w-2xl",
  "2xl": "max-w-2xl",
};

function Modal({ title, size = "xl", onClose, children }) {
  useEffect(() => {
    const onKeyDown = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${MODAL_SIZES[size] || MODAL_SIZES.xl} max-h-[85vh] flex flex-col bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden`}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
          <CloseButton onClick={onClose} />
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function RightPanel({ mode, record, onClose, onEdit, onRetire, onModalClose, onSubmit }) {
  const isEmpty    = !mode;
  const isEditing  = mode === "edit";
  const isRetiring = mode === "retire";
  const isLeave    = record?.type === "leave";
  const status     = (record?.status || "").toLowerCase();

  // Fund edit gating derives from the approvals chain, mirroring the backend:
  // locked once the first decision lands UNLESS the request was rejected
  // (maker fixes & resubmits).
  const approvals       = Array.isArray(record?.approvals) ? record.approvals : [];
  const approvalStarted = approvals.some((a) => a?.user_id && a?.status);
  const fundRejected    = status === "rejected" || approvals.some((a) => a?.status === "rejected");

  const isEditLocked = !record
    ? false
    : isLeave
      ? !LEAVE_EDITABLE_STATUSES.includes(status)
      : (approvalStarted && !fundRejected);

  // Retire only ever applies to fund requests.
  const isRetireEnabled =
    !!record && !isLeave && FUND_RETIRE_ENABLED_STATUSES.includes(status);

  const showEditModal   = isEditing  && record && !isEditLocked;
  const showRetireModal = isRetiring && record && isRetireEnabled;

  const closeModal = onModalClose || onClose;

  const titles = { detail: "Request detail", new: "New request" };
  const headerTitle = isEmpty ? "Details" : (titles[mode] || titles.detail);

  return (
    <>
      <aside
        className={`flex flex-col border-l border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-all duration-200 ${
          isEmpty ? "w-64" : "w-[360px]"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{headerTitle}</h2>
          {!isEmpty && <CloseButton onClick={onClose} />}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {isEmpty && <EmptyState />}

          {(mode === "detail" || isEditing || isRetiring) && record && (
            <DetailPanel r={record} onEdit={onEdit} onRetire={onRetire} />
          )}

          {mode === "new" && (
            <RequestForm
              mode="new"
              onSubmit={onSubmit}
              onCancel={onClose}
              submitLabel="Submit request"
            />
          )}
        </div>
      </aside>

      {/* Edit modal — leave vs fund use different forms */}
      {showEditModal && (
        <Modal title={isLeave ? "Edit leave request" : "Edit request"} size="xl" onClose={closeModal}>
          {isLeave ? (
            <LeaveRequestForm
              mode="edit"
              record={record}
              onSuccess={onSubmit}
              onCancel={closeModal}
            />
          ) : (
            <RequestForm
              mode="edit"
              initialType={record.type}
              record={record}
              onSubmit={onSubmit}
              onCancel={closeModal}
              submitLabel="Save changes"
            />
          )}
        </Modal>
      )}

      {/* Retire modal — fund only (never reachable for leave) */}
      {showRetireModal && (
        <Modal title="Retire request" size="xl" onClose={closeModal}>
          <FundRetirementForm
            record={record}
            onSuccess={onSubmit}
            onCancel={closeModal}
          />
        </Modal>
      )}
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-16 px-6 gap-3">
      <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-zinc-400">
          <rect x="1" y="1" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.4" />
          <path d="M5 9h8M5 6h5M5 12h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-sm text-zinc-400 leading-relaxed">
        Select a request to view details, or click <strong className="text-zinc-600 dark:text-zinc-300">New request</strong> to create one.
      </p>
    </div>
  );
}