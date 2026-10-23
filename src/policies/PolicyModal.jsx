import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const EMPTY_FORM = {
  type: 'policy',
  title: '',
  summary: '',
  content: '',
  status: 'Published',
  effective_date: '',
  sort_order: 0,
};

// `policy` = existing record when editing, null when creating.
// `defaultType` pre-selects the tab's type when adding a new one.
export default function PolicyModal({ policy, defaultType = 'policy', onClose, onSaved, apiBase, authHeaders }) {
  const isEditing = Boolean(policy);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (policy) {
      setForm({
        type:           policy.type ?? 'policy',
        title:          policy.title ?? '',
        summary:        policy.summary ?? '',
        content:        policy.content ?? '',
        status:         policy.status ?? 'Published',
        effective_date: policy.effective_date ?? '',
        sort_order:     policy.sort_order ?? 0,
      });
    } else {
      setForm({ ...EMPTY_FORM, type: defaultType });
    }
  }, [policy, defaultType]);

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const isFormReady = form.title.trim().length > 0 && form.content.trim().length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormReady) return;

    setSaving(true);
    setErrors({});
    setServerError('');

    try {
      const url = isEditing ? `${apiBase}/${policy.id}` : apiBase;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        setServerError(data.message || 'Something went wrong. Please try again.');
        return;
      }

      onSaved(data.policy);
    } catch (err) {
      console.error('✗ Save policy error:', err);
      setServerError('Network error — please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl dark:bg-neutral-900 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-700">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            {isEditing ? `Edit ${form.type === 'policy' ? 'Policy' : 'Term'}` : `Add ${form.type === 'policy' ? 'Policy' : 'Term'}`}
          </h2>
          <button onClick={onClose} className="rounded p-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {serverError && (
            <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Type</label>
              <select
                value={form.type}
                onChange={handleChange('type')}
                className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              >
                <option value="policy">Policy</option>
                <option value="term">Term</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Status</label>
              <select
                value={form.status}
                onChange={handleChange('status')}
                className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              >
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={handleChange('title')}
              placeholder="e.g. Refund Policy"
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Summary <span className="font-normal text-neutral-400">(optional, shown in lists)</span>
            </label>
            <input
              type="text"
              value={form.summary}
              onChange={handleChange('summary')}
              placeholder="One-line description"
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Content</label>
            <textarea
              value={form.content}
              onChange={handleChange('content')}
              rows={10}
              placeholder="Full policy or term text..."
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm font-mono dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            />
            {errors.content && <p className="mt-1 text-xs text-red-600">{errors.content}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Effective date</label>
              <input
                type="date"
                value={form.effective_date}
                onChange={handleChange('effective_date')}
                className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">Sort order</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={handleChange('sort_order')}
                className="w-full rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              />
            </div>
          </div>
        </form>

        <div className="flex justify-end gap-3 border-t border-neutral-200 px-6 py-4 dark:border-neutral-700">
          <button
            onClick={onClose}
            className="rounded px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isFormReady || saving}
            className="rounded bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}