import { useRef, useState } from "react";
import FundRequestForm from "./newrequest/FundRequestForm";

// import LeaveRequestForm   from "./newrequest/LeaveRequestForm";

const FORM_BY_TYPE = {
  fund: FundRequestForm,
  // leave:   LeaveRequestForm,
  // imprest: ImprestRequestForm,
  // travel:  TravelRequestForm,
};

// Seeds the controlled `formData` this dispatcher owns from an existing
// record, per type, when opening in edit mode. Each form keeps its own
// internal state for anything more complex (e.g. FundRequestForm's line
// items), so this only needs to cover the plain top-level fields.
function seedFormData(type, mode, record) {
  if (mode !== "edit" || !record) return {};

  switch (type) {
    case "fund":
      return {
        project: record.project || "",
        purpose: record.activity || "",
        venue:   record.venue || "",
        actDate: record.request_date ? String(record.request_date).slice(0, 10) : "",
        submittedTo: record.submitted_to
          ? {
              id:       record.submitted_to,
              username: record.submitted_to_name  || "",
              email:    record.submitted_to_email || "",
            }
          : null,
      };

    // Add a case here for every new type's fields, e.g.:
    // case "leave":
    //   return {
    //     leaveType: record.leave_type || "",
    //     startDate: record.start_date || "",
    //     endDate:   record.end_date || "",
    //     reason:    record.reason || "",
    //   };

    default:
      return {};
  }
}

/**
 * mode: "new" | "edit"
 * initialType: request type to create ("fund", "leave", ...) — used in "new" mode,
 *              or as a fallback if `record.type` isn't set.
 * record: the full request object being edited (only present when mode === "edit")
 */
export default function RequestForm({
  mode = "new",
  initialType = "fund",
  record = null,
  onSubmit,
  onCancel,
  submitLabel,
}) {
  // Fund requests today don't carry an explicit `type` field on the record
  // (they come from the fund-requests endpoint), so default to "fund".
  const type = record?.type || initialType || "fund";
  const SpecificForm = FORM_BY_TYPE[type];

  const [formData, setFormData] = useState(() => seedFormData(type, mode, record));
  const [errors, setErrors]     = useState({});
  const firstInputRef           = useRef(null);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  if (!SpecificForm) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 text-sm text-zinc-500 dark:text-zinc-400">
        No {mode === "edit" ? "edit" : "create"} form has been built yet for{" "}
        <span className="font-mono text-xs">"{type}"</span> requests. Register one in{" "}
        <code className="text-xs">FORM_BY_TYPE</code> inside <code className="text-xs">RequestForm.jsx</code>.
      </div>
    );
  }

  return (
    <SpecificForm
      mode={mode}
      initialData={record}
      formData={formData}
      errors={errors}
      onChange={handleChange}
      firstInputRef={firstInputRef}
      onCancel={onCancel}
      onSuccess={onSubmit}
      submitLabel={submitLabel}
    />
  );
}