import { useState, useEffect, useRef } from "react";

import LeaveRequestForm, { leaveFields } from "./LeaveRequestForm";
import FundRequestForm from "./FundRequestForm";

const REQUEST_TYPES = [
  { value: "leave", label: "Leave Request", icon: "🏖️" },
  { value: "fund",  label: "Fund Request",  icon: "💰" },
];

const FORM_MAP = {
  leave: { Component: LeaveRequestForm, fields: leaveFields },
  fund:  { Component: FundRequestForm },
};

export default function NewRequestModal({ onClose, onSubmit, onSessionExpired }) {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const overlayRef = useRef(null);
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (step === 2 && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [step]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setFormData({});
    setErrors({});
    setStep(2);
  };

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  // Generic validator — still used by forms that rely on FORM_MAP.fields
  // (e.g. fund). Leave self-validates and posts directly, so it has no
  // `fields` entry that this would touch.
  const validate = () => {
    const { fields } = FORM_MAP[selectedType] || {};
    if (!fields) return true;
    const newErrors = {};
    fields.forEach(({ name, label, type }) => {
      const val = formData[name];
      if (!val || (typeof val === "string" && !val.trim())) {
        if (type !== "textarea") newErrors[name] = `${label} is required`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // For forms that bubble their data up to the modal (fund).
  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit?.({ type: selectedType, ...formData });
    onClose();
  };

  // For forms that post to the API themselves and report success (leave).
  const handleSuccess = (request) => {
    onSubmit?.(request); // bubble the created request up so the list refreshes
    onClose();
  };

  const typeInfo = REQUEST_TYPES.find((t) => t.value === selectedType);
  const ActiveForm = selectedType ? FORM_MAP[selectedType].Component : null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="New Request"
        className="w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                title="Back"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {step === 1 ? "New Request" : `New ${typeInfo?.label}`}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {step === 1 ? "Select a request type to continue" : "Fill in the details below"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M1 1l11 11M12 1L1 12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Step 1 — Type picker */}
        {step === 1 && (
          <div className="p-6 grid grid-cols-2 gap-3">
            {REQUEST_TYPES.map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => handleTypeSelect(value)}
                className="group flex flex-col items-start gap-2 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left"
              >
                <span className="text-2xl">{icon}</span>
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                  {label}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Step 2 — Active form (owns its own footer) */}
        {step === 2 && ActiveForm && (
          <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
            <ActiveForm
              formData={formData}
              errors={errors}
              onChange={handleChange}
              firstInputRef={firstInputRef}
              onCancel={onClose}
              onSubmit={handleSubmit}        // fund form (bubbles up to modal)
              onSuccess={handleSuccess}      // leave form (posts to API, then closes)
              onSessionExpired={onSessionExpired} // leave form 401 handling
            />
          </div>
        )}
      </div>
    </div>
  );
}