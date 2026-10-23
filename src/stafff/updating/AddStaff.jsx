import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Check, Loader, ChevronDown, X, FolderOpen } from 'lucide-react';

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
const ROLES = [
  { value: 'Mentor',     label: 'Field Officer'       },
  { value: 'Supervisor', label: 'Project Lead'  },
  { value: 'HR',         label: 'Human Resource'      },
  { value: 'Manager',    label: 'Program Manager'       },
  { value: 'Finance',    label: 'Finance & Admin'       },
];

const VALID_ROLES = ROLES.map(r => r.value);
const validators = {
  username: (v) => {
    if (!v.trim())             return 'Full name is required';
    if (v.trim().length < 2)   return 'Name must be at least 2 characters';
    if (v.trim().length > 80)  return 'Name must be under 80 characters';
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
    if (!/^\d+$/.test(digits))  return 'Phone number must contain only digits (+ allowed at start)';
    if (digits.length < 9)      return 'Phone number must be at least 9 digits';
    if (digits.length > 15)     return 'Phone number must be at most 15 digits';
    return '';
  },
  gender: (v) => (!v ? 'Gender is required' : ''),
  role:   (v) => {
    if (!v) return 'Role is required';
    if (!VALID_ROLES.includes(v)) return `Role must be one of: ${VALID_ROLES.join(', ')}`;
    return '';
  },
  designation: (v) => (v?.trim().length > 60 ? 'Designation must be under 60 characters' : ''),
  department:  (v) => (v?.trim().length > 60 ? 'Department must be under 60 characters'  : ''),
};

const REQUIRED_FIELDS = ['username', 'email', 'mobile', 'gender', 'role'];

const validateField = (name, value) =>
  validators[name] ? validators[name](value) : '';

// ─────────────────────────────────────────────────────────────────────────────
// Multi-select project dropdown
// ─────────────────────────────────────────────────────────────────────────────
const ProjectsDropdown = ({ projects, selected, onChange, loading }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = projects.filter(p =>
    p?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id) => {
    onChange(
      selected.includes(id)
        ? selected.filter(s => s !== id)
        : [...selected, id]
    );
  };

  const removeTag = (id) => onChange(selected.filter(s => s !== id));

  const selectedProjects = projects.filter(p => selected.includes(p.id));

  return (
    <div ref={ref} className="relative mt-1">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
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
              selectedProjects.map(p => (
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
          <ChevronDown className={`w-4 h-4 flex-shrink-0 text-green-500 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-green-200 bg-white shadow-lg dark:bg-[#0a0a0a] dark:border-green-800 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-green-100 dark:border-green-900">
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search projects…"
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-green-200 bg-white text-black placeholder-green-400 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-black dark:border-green-800 dark:text-white dark:placeholder-green-700"
            />
          </div>

          {/* List */}
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
              filtered.map(p => {
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
                      {/* Checkbox */}
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

          {/* Footer count */}
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
// Component
// ─────────────────────────────────────────────────────────────────────────────
const AddStaff = ({ staff = {}, onClose, onSave, isLoading = false }) => {
  const [formData, setFormData] = useState({
    username:    staff?.username    || '',
    email:       staff?.email       || '',
    mobile:      staff?.mobile      || '',
    gender:      staff?.gender      || '',
    department:  staff?.department  || '',
    designation: staff?.designation || '',
    role:        staff?.role        || '',
  });

  const [errors,  setErrors]  = useState({});
  const [touched, setTouched] = useState({});

  // Projects state
  const [projects,         setProjects]         = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [projectsLoading,  setProjectsLoading]  = useState(false);

  // Fetch project titles on mount
  useEffect(() => {
    const fetchProjects = async () => {
      setProjectsLoading(true);
      try {
        const res  = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/projects/titles`, { credentials: 'include' });
        const data = await res.json();
        if (res.ok) setProjects((data.projects || []).filter(p => p?.name));
      } catch { /* silently fail — projects field is optional */ }
      finally { setProjectsLoading(false); }
    };
    fetchProjects();
  }, []);

  // ── Derive whether the Save button should be enabled ─────────────────────
  const isFormReady = useMemo(() => {
    return REQUIRED_FIELDS.every((field) => {
      const value = formData[field];
      const hasValue = typeof value === 'string' ? value.trim() !== '' : Boolean(value);
      const error    = validateField(field, value);
      return hasValue && !error;
    });
  }, [formData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const safe = sanitize(name, value);
    setFormData((prev)  => ({ ...prev,  [name]: safe }));
    setTouched((prev)   => ({ ...prev,  [name]: true }));
    setErrors((prev)    => ({ ...prev,  [name]: validateField(name, safe) }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev)  => ({ ...prev, [name]: validateField(name, value) }));
  };

  const validateAll = () => {
    const allTouched = Object.keys(formData).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    const allErrors  = Object.keys(formData).reduce((acc, k) => ({ ...acc, [k]: validateField(k, formData[k]) }), {});
    setTouched(allTouched);
    setErrors(allErrors);
    return Object.values(allErrors).every((e) => !e);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormReady) return;
    if (validateAll()) {
      onSave({
        ...formData,
        // Send selected project IDs as an array (and the titles for display convenience)
        project_ids: selectedProjects,
        projects: projects.filter(p => selectedProjects.includes(p.id)).map(p => p.name),
      });
    }
  };

  const fieldProps = (name) => ({
    name,
    value:    formData[name],
    onChange: handleInputChange,
    onBlur:   handleBlur,
    className: inputClass(errors, touched, name),
  });

  const saveDisabled = isLoading || !isFormReady;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="p-4 space-y-5 bg-white dark:bg-black rounded-xl border border-green-200 dark:border-green-800"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Full Name */}
        <Field label="Full Name" required error={errors.username} touched={touched.username}>
          <input type="text" placeholder="Enter full name" autoComplete="name" {...fieldProps('username')} />
        </Field>

     {/* Projects multi-select */}
        <Field label="Assigned Projects">
          <ProjectsDropdown
            projects={projects}
            selected={selectedProjects}
            onChange={setSelectedProjects}
            loading={projectsLoading}
          />
        </Field>

        {/* Gender */}
        <Field label="Gender" required error={errors.gender} touched={touched.gender}>
          <select {...fieldProps('gender')}>
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </Field>

        {/* Role */}
<Field label="Role" required error={errors.role} touched={touched.role}>
  <select {...fieldProps('role')}>
    <option value="">Select a role</option>
    {ROLES.map(({ value, label }) => (
      <option key={value} value={value}>{label}</option>
    ))}
  </select>
</Field>

        {/* Designation (optional) */}
        <Field label="Designation" error={errors.designation} touched={touched.designation}>
          <input type="text" placeholder="e.g. Lead Mentor" {...fieldProps('designation')} />
        </Field>

        {/* Department (optional) */}
        <Field label="Department" error={errors.department} touched={touched.department}>
          <input type="text" placeholder="e.g. Sciences" {...fieldProps('department')} />
        </Field>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Email */}
        <Field label="Email" required error={errors.email} touched={touched.email}>
          <input type="email" placeholder="Enter email address" autoComplete="email" {...fieldProps('email')} />
        </Field>
     {/* Phone */}
        <Field label="Phone Number" required error={errors.mobile} touched={touched.mobile}>
          <input type="tel" placeholder="e.g. +254712345678" autoComplete="tel" {...fieldProps('mobile')} />
        </Field>
      
      </div>

      <div className="border-t border-green-200 dark:border-green-800" />

      <div className="flex justify-between items-center">

        {/* Cancel */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className={[
            'px-4 py-2 text-sm font-semibold rounded-lg border transition',
            'border-green-400 bg-white text-black',
            'hover:bg-green-50 hover:border-green-600',
            'active:bg-green-100',
            'dark:bg-black dark:border-green-600 dark:text-white',
            'dark:hover:bg-green-950 dark:hover:border-green-400',
            'disabled:opacity-40',
          ].join(' ')}
        >
          Cancel
        </button>

        {/* Save */}
        <button
          type="submit"
          disabled={saveDisabled}
          title={!isFormReady ? 'Please fill in all required fields' : undefined}
          className={[
            'flex items-center gap-1.5 px-5 py-2 text-sm font-bold rounded-lg transition shadow-sm',
            'bg-green-600 text-white',
            'hover:bg-green-700 active:bg-green-800',
            'dark:bg-green-500 dark:text-black',
            'dark:hover:bg-green-400 dark:active:bg-green-600',
            saveDisabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
          ].join(' ')}
        >
          {isLoading ? (
            <><Loader className="animate-spin w-4 h-4" /> Saving…</>
          ) : (
            <><Check className="w-4 h-4" /> Save Staff</>
          )}
        </button>

      </div>
    </form>
  );
};

export default AddStaff;