import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Check, Loader, Trash2, ChevronDown, X, Eye, EyeOff } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Field wrapper
// ─────────────────────────────────────────────────────────────────────────────
const Field = ({ label, required, error, touched, children }) => (
  <div className="space-y-1">
    <label className="block text-xs font-bold uppercase tracking-widest text-green-600 dark:text-green-400">
      {label}
      {required && <span className="text-green-500 ml-0.5">*</span>}
    </label>
    {children}
    {touched && error && (
      <p className="text-red-500 text-xs font-medium flex items-center gap-1">
        <span>⚠</span> {error}
      </p>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic input border class
// ─────────────────────────────────────────────────────────────────────────────
const inputClass = (errors, touched, field) =>
  [
    'mt-1 block w-full px-3 py-2 text-sm rounded-lg border transition',
    'bg-white text-black placeholder-green-300',
    'focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500',
    'dark:bg-black dark:text-white dark:placeholder-green-700',
    'dark:focus:ring-green-500 dark:focus:border-green-500',
    touched[field] && errors[field]
      ? 'border-red-500 dark:border-red-500'
      : touched[field] && !errors[field]
      ? 'border-green-500 dark:border-green-500'
      : 'border-green-300 dark:border-green-700',
  ].join(' ');

// ─────────────────────────────────────────────────────────────────────────────
// Role options — keep in sync with AddStaff + the controller's VALID_ROLES
// ─────────────────────────────────────────────────────────────────────────────
const ROLES = [
  { value: 'Mentor',     label: 'Field Officer'   },
  { value: 'Supervisor', label: 'Project Lead'    },
  { value: 'HR',         label: 'Human Resource'  },
  { value: 'Manager',    label: 'Program Manager' },
  { value: 'Finance',    label: 'Finance & Admin' },
];
const VALID_ROLES = ROLES.map((r) => r.value);

// ─────────────────────────────────────────────────────────────────────────────
// Per-field sanitizers
// ─────────────────────────────────────────────────────────────────────────────
const sanitizers = {
  username:    (v) => v.replace(/[^a-zA-Z\s]/g, ''),
  email:       (v) => v.replace(/[^a-zA-Z0-9@.\-_]/g, ''),
  mobile:      (v) => v.replace(/[^0-9+]/g, '').replace(/(?!^)\+/g, ''),
  designation: (v) => v.replace(/[^a-zA-Z\s]/g, ''),
  department:  (v) => v.replace(/[^a-zA-Z\s]/g, ''),
};

const sanitize = (name, value) =>
  sanitizers[name] ? sanitizers[name](value) : value;

// ─────────────────────────────────────────────────────────────────────────────
// Per-field validators
// ─────────────────────────────────────────────────────────────────────────────
const validators = {
  username: (v) => {
    if (!v.trim())            return 'Full name is required';
    if (v.trim().length < 2)  return 'Name must be at least 2 characters';
    if (v.trim().length > 80) return 'Name must be under 80 characters';
    return '';
  },
  email: (v) => {
    if (!v.trim()) return 'Email address is required';
    if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(v))
      return 'Please enter a valid email address';
    return '';
  },
  mobile: (v) => {
    if (!v.trim()) return 'Phone number is required';
    const digits = v.replace(/^\+/, '');
    if (!/^\d+$/.test(digits)) return 'Phone number must contain only digits (+ allowed at start)';
    if (digits.length < 9)     return 'Phone number must be at least 9 digits';
    if (digits.length > 15)    return 'Phone number must be at most 15 digits';
    return '';
  },
  gender: (v) => (!v ? 'Gender is required' : ''),
  role: (v) => {
    if (!v) return 'Role is required';
    if (!VALID_ROLES.includes(v)) return `Role must be one of: ${VALID_ROLES.join(', ')}`;
    return '';
  },
  designation: (v) => (v?.trim().length > 60 ? 'Designation must be under 60 characters' : ''),
  department:  (v) => (v?.trim().length > 60 ? 'Department must be under 60 characters'  : ''),
  // Password validators — only run when a value is present
  new_password: (v) => {
    if (!v) return ''; // optional — blank means no change
    if (v.length < 8)  return 'Password must be at least 8 characters';
    if (v.length > 72) return 'Password must be under 72 characters';
    return '';
  },
  confirm_password: (v, formData) => {
    if (!formData?.new_password) return '';
    if (!v) return 'Please confirm the new password';
    if (v !== formData.new_password) return 'Passwords do not match';
    return '';
  },
};

const REQUIRED_FIELDS = ['username', 'email', 'mobile', 'gender', 'role'];

const validateField = (name, value, formData) =>
  validators[name] ? validators[name](value, formData) : '';

// ─────────────────────────────────────────────────────────────────────────────
// Build a clean initial form from a staff object
// ─────────────────────────────────────────────────────────────────────────────
const buildInitialForm = (staff = {}) => ({
  username:         staff.username    ?? '',
  email:            staff.email       ?? '',
  mobile:           staff.phone       ?? staff.mobile ?? '',
  gender:           staff.gender      ?? '',
  // Normalise legacy "Suppervisor" typo that may exist in old records
  role:             staff.role === 'Suppervisor' ? 'Supervisor' : (staff.role ?? ''),
  designation:      staff.designation ?? '',
  department:       staff.department  ?? '',
  new_password:     '',
  confirm_password: '',
});

// ─────────────────────────────────────────────────────────────────────────────
// Project helpers
// ─────────────────────────────────────────────────────────────────────────────
const parseProjects = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  }
  return [];
};

const deriveInitialProjectIds = (staff) => {
  const fromProjects = parseProjects(staff?.projects)
    .map((p) => p.project_id)
    .filter(Boolean);
  if (fromProjects.length) return fromProjects;
  return Array.isArray(staff?.project_ids) ? staff.project_ids : [];
};

const sameIds = (a, b) => {
  if (a.length !== b.length) return false;
  const x = [...a].sort();
  const y = [...b].sort();
  return x.every((id, i) => id === y[i]);
};

// ─────────────────────────────────────────────────────────────────────────────
// Multi-select project dropdown
// ─────────────────────────────────────────────────────────────────────────────
const ProjectsDropdown = ({ projects, selected, onChange, loading }) => {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = projects.filter((p) =>
    p?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const toggle    = (id) =>
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  const removeTag = (id) => onChange(selected.filter((s) => s !== id));

  const selectedProjects = projects.filter((p) => selected.includes(p.id));

  return (
    <div ref={ref} className="relative mt-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={[
          'w-full min-h-[38px] px-3 py-2 text-sm rounded-lg border transition text-left',
          'bg-white text-black dark:bg-black dark:text-white',
          'focus:outline-none focus:ring-2 focus:ring-green-500',
          open
            ? 'border-green-500 ring-2 ring-green-500 dark:border-green-500'
            : 'border-green-300 dark:border-green-700',
        ].join(' ')}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1 flex-1">
            {selectedProjects.length === 0 ? (
              <span className="text-green-300 dark:text-green-700">
                {loading ? 'Loading projects…' : 'Select projects'}
              </span>
            ) : (
              selectedProjects.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/40 dark:text-green-400 dark:border-green-800"
                >
                  {p.name}
                  <span
                    role="button"
                    tabIndex={0}
                    onMouseDown={(e) => { e.stopPropagation(); removeTag(p.id); }}
                    onKeyDown={(e) => e.key === 'Enter' && removeTag(p.id)}
                    className="hover:text-red-500 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </span>
                </span>
              ))
            )}
          </div>
          <ChevronDown
            className={`w-4 h-4 flex-shrink-0 text-green-500 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-green-200 bg-white shadow-lg dark:bg-[#0a0a0a] dark:border-green-800 overflow-hidden">
          <div className="p-2 border-b border-green-100 dark:border-green-900">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects…"
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-green-200 bg-white text-black placeholder-green-400 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-black dark:border-green-800 dark:text-white dark:placeholder-green-700"
            />
          </div>

          <ul className="max-h-52 overflow-y-auto py-1">
            {loading ? (
              <li className="flex items-center justify-center gap-2 py-6 text-xs text-green-500">
                <Loader className="w-4 h-4 animate-spin" /> Loading…
              </li>
            ) : filtered.length === 0 ? (
              <li className="py-6 text-center text-xs text-black/40 dark:text-green-700">
                {projects.length === 0 ? 'No projects found' : 'No matches'}
              </li>
            ) : (
              filtered.map((p) => {
                const checked = selected.includes(p.id);
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => toggle(p.id)}
                      className={[
                        'w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition',
                        checked
                          ? 'bg-green-50 dark:bg-green-950/40'
                          : 'hover:bg-green-50 dark:hover:bg-green-950/20',
                      ].join(' ')}
                    >
                      <span className={[
                        'flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition',
                        checked
                          ? 'bg-green-600 border-green-600 dark:bg-green-500 dark:border-green-500'
                          : 'border-green-300 dark:border-green-700',
                      ].join(' ')}>
                        {checked && <Check className="w-2.5 h-2.5 text-white dark:text-black" strokeWidth={3} />}
                      </span>
                      <span className={`flex-1 text-sm ${checked ? 'font-semibold text-green-700 dark:text-green-400' : 'text-black dark:text-white'}`}>
                        {p.name}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          {selected.length > 0 && (
            <div className="px-3 py-2 border-t border-green-100 dark:border-green-900 flex items-center justify-between">
              <span className="text-xs text-black/40 dark:text-green-700">
                {selected.length} selected
              </span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-red-500 hover:text-red-700 font-medium transition"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Password field with show/hide toggle
// ─────────────────────────────────────────────────────────────────────────────
const PasswordField = ({ name, value, onChange, onBlur, className, placeholder }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative mt-1">
      <input
        type={show ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={name === 'new_password' ? 'new-password' : 'new-password'}
        className={`${className} pr-10`}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 hover:text-green-700 dark:hover:text-green-300 transition"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
const UpdateStaffForm = ({ staff = {}, onClose, onSave, onDelete, isLoading = false }) => {
  // ── FIX: derive initial state lazily from the staff prop so late-arriving
  //    props (async fetch) still populate correctly. useRef is NOT used here
  //    for the form values because it captures the value at mount time only.
  const [formData, setFormData] = useState(() => buildInitialForm(staff));
  const [errors,   setErrors]   = useState({});
  const [touched,  setTouched]  = useState({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Track the "original" snapshot for dirty checking (update when staff prop changes)
  const [initialSnapshot, setInitialSnapshot] = useState(() => buildInitialForm(staff));
  const initialProjectIds = useRef(deriveInitialProjectIds(staff));

  const [projects,         setProjects]         = useState([]);
  const [selectedProjects, setSelectedProjects] = useState(() => deriveInitialProjectIds(staff));
  const [projectsLoading,  setProjectsLoading]  = useState(false);

  // Re-initialise form if the staff prop identity changes (e.g. parent re-fetches)
  useEffect(() => {
    const fresh = buildInitialForm(staff);
    setFormData(fresh);
    setInitialSnapshot(fresh);
    const ids = deriveInitialProjectIds(staff);
    initialProjectIds.current = ids;
    setSelectedProjects(ids);
    setErrors({});
    setTouched({});
  }, [staff?.id]); // re-run only when a different staff member is loaded

  useEffect(() => {
    const fetchProjects = async () => {
      setProjectsLoading(true);
      try {
        const res  = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/projects/titles`, { credentials: 'include' });
        const data = await res.json();
        if (res.ok) setProjects((data.projects || []).filter((p) => p?.name));
      } catch { /* non-fatal */ }
      finally { setProjectsLoading(false); }
    };
    fetchProjects();
  }, []);

  // ── Are all required fields valid? ─────────────────────────────────────────
  const isFormReady = useMemo(() => {
    const coreOk = REQUIRED_FIELDS.every((field) => {
      const value    = formData[field];
      const hasValue = typeof value === 'string' ? value.trim() !== '' : Boolean(value);
      const error    = validateField(field, value, formData);
      return hasValue && !error;
    });
    // Password section: if new_password is set, confirm must also be valid
    const pwOk = !formData.new_password ||
      (!validateField('new_password', formData.new_password, formData) &&
       !validateField('confirm_password', formData.confirm_password, formData));
    return coreOk && pwOk;
  }, [formData]);

  // ── Has anything changed? (fields OR project selection) ────────────────────
  const isDirty = useMemo(() => {
    const coreFields = ['username', 'email', 'mobile', 'gender', 'role', 'designation', 'department'];
    const fieldsChanged = coreFields.some((k) => formData[k] !== initialSnapshot[k]);
    const projectsChanged = !sameIds(selectedProjects, initialProjectIds.current);
    const passwordSet = Boolean(formData.new_password);
    return fieldsChanged || projectsChanged || passwordSet;
  }, [formData, selectedProjects, initialSnapshot]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const safe = sanitize(name, value);
    setFormData((prev) => {
      const next = { ...prev, [name]: safe };
      // Re-validate confirm_password live when new_password changes
      if (name === 'new_password') {
        setErrors((errs) => ({
          ...errs,
          new_password:     validateField('new_password', safe, next),
          confirm_password: validateField('confirm_password', next.confirm_password, next),
        }));
      } else {
        setErrors((errs) => ({ ...errs, [name]: validateField(name, safe, next) }));
      }
      return next;
    });
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev)  => ({ ...prev, [name]: validateField(name, value, formData) }));
  };

  const validateAll = () => {
    const allTouched = Object.keys(formData).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    const allErrors  = Object.keys(formData).reduce((acc, k) => ({ ...acc, [k]: validateField(k, formData[k], formData) }), {});
    setTouched(allTouched);
    setErrors(allErrors);
    return Object.values(allErrors).every((e) => !e);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormReady || !isDirty) return;
    if (validateAll()) {
      const payload = {
        username:    formData.username,
        email:       formData.email,
        mobile:      formData.mobile,
        gender:      formData.gender,
        role:        formData.role,
        designation: formData.designation,
        department:  formData.department,
        project_ids: selectedProjects,
        projects:    projects.filter((p) => selectedProjects.includes(p.id)).map((p) => p.name),
      };
      // Only include password fields if the user actually typed one
      if (formData.new_password) {
        payload.new_password = formData.new_password;
      }
      onSave(payload);
    }
  };

  const handleDeleteClick = () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    onDelete(staff.id);
  };

  const fieldProps = (name) => ({
    name,
    value:     formData[name],
    onChange:  handleInputChange,
    onBlur:    handleBlur,
    className: inputClass(errors, touched, name),
  });

  const pwFieldProps = (name, placeholder) => ({
    name,
    value:       formData[name],
    onChange:    handleInputChange,
    onBlur:      handleBlur,
    className:   inputClass(errors, touched, name),
    placeholder,
  });

  const saveDisabled = isLoading || !isFormReady || !isDirty;
  const saveTitle =
    !isFormReady ? 'Please fill in all required fields'
    : !isDirty   ? 'No changes to save'
    : undefined;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="p-4 space-y-5 bg-white dark:bg-black rounded-xl border border-green-200 dark:border-green-800"
    >
      {/* Staff number — read-only */}
      {staff?.staff_no && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-green-600 dark:text-green-400">
            Staff No:
          </span>
          <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400">
            {staff.staff_no}
          </span>
        </div>
      )}

      {/* Row 1 — Name + Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Full Name" required error={errors.username} touched={touched.username}>
          <input type="text" placeholder="Enter full name" autoComplete="name" {...fieldProps('username')} />
        </Field>

        <Field label="Assigned Projects">
          <ProjectsDropdown
            projects={projects}
            selected={selectedProjects}
            onChange={setSelectedProjects}
            loading={projectsLoading}
          />
        </Field>
      </div>

      {/* Row 2 — Role + Gender + Designation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Role" required error={errors.role} touched={touched.role}>
          <select {...fieldProps('role')}>
            <option value="">Select a role</option>
            {ROLES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Field>

        <Field label="Gender" required error={errors.gender} touched={touched.gender}>
          <select {...fieldProps('gender')}>
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </Field>

        <Field label="Designation" error={errors.designation} touched={touched.designation}>
          <input type="text" placeholder="e.g. Lead Mentor" {...fieldProps('designation')} />
        </Field>
      </div>

      {/* Row 3 — Department + Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Department" error={errors.department} touched={touched.department}>
          <input type="text" placeholder="e.g. Sciences" {...fieldProps('department')} />
        </Field>

        <Field label="Email Address" required error={errors.email} touched={touched.email}>
          <input type="email" placeholder="Enter email address" autoComplete="email" {...fieldProps('email')} />
        </Field>
      </div>

      {/* Row 4 — Phone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Phone Number" required error={errors.mobile} touched={touched.mobile}>
          <input type="tel" placeholder="e.g. +254712345678" autoComplete="tel" {...fieldProps('mobile')} />
        </Field>
      </div>

      {/* ── Password Update Section ────────────────────────────────────────── */}
      <div className="border-t border-green-200 dark:border-green-800 pt-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-green-600 dark:text-green-400">
          Change Password
          <span className="ml-2 font-normal normal-case text-black/40 dark:text-white/30">
            — leave blank to keep current password
          </span>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="New Password" error={errors.new_password} touched={touched.new_password}>
            <PasswordField {...pwFieldProps('new_password', 'Enter new password')} />
          </Field>

          <Field label="Confirm New Password" error={errors.confirm_password} touched={touched.confirm_password}>
            <PasswordField {...pwFieldProps('confirm_password', 'Repeat new password')} />
          </Field>
        </div>

        {formData.new_password && !errors.new_password && !errors.confirm_password && formData.confirm_password && (
          <p className="text-green-600 dark:text-green-400 text-xs font-medium flex items-center gap-1">
            <Check className="w-3 h-3" /> Passwords match
          </p>
        )}
      </div>

      <div className="border-t border-green-200 dark:border-green-800" />

      {/* Actions */}
      <div className="flex justify-between items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className={[
            'px-4 py-2 text-sm font-semibold rounded-lg border transition',
            'border-green-400 bg-white text-black',
            'hover:bg-green-50 hover:border-green-600 active:bg-green-100',
            'dark:bg-black dark:border-green-600 dark:text-white',
            'dark:hover:bg-green-950 dark:hover:border-green-400',
            'disabled:opacity-40',
          ].join(' ')}
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saveDisabled}
          title={saveTitle}
          className={[
            'flex items-center gap-1.5 px-5 py-2 text-sm font-bold rounded-lg transition shadow-sm',
            'bg-green-600 text-white hover:bg-green-700 active:bg-green-800',
            'dark:bg-green-500 dark:text-black dark:hover:bg-green-400 dark:active:bg-green-600',
            saveDisabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
          ].join(' ')}
        >
          {isLoading ? (
            <><Loader className="animate-spin w-4 h-4" /> Saving…</>
          ) : (
            <><Check className="w-4 h-4" /> Save Changes</>
          )}
        </button>

        <button
          type="button"
          onClick={handleDeleteClick}
          disabled={isLoading}
          onBlur={() => setConfirmDelete(false)}
          className={[
            'flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg border transition',
            confirmDelete
              ? 'bg-red-600 border-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:border-red-500 dark:text-black dark:hover:bg-red-400'
              : 'border-red-400 bg-white text-red-600 hover:bg-red-50 hover:border-red-600 dark:bg-black dark:border-red-600 dark:text-red-400 dark:hover:bg-red-950',
            'disabled:opacity-40',
          ].join(' ')}
        >
          <Trash2 className="w-4 h-4" />
          {confirmDelete ? 'Confirm Delete' : 'Delete'}
        </button>
      </div>
    </form>
  );
};

export default UpdateStaffForm;