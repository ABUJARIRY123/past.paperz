import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, FileText, Scale, RefreshCw, X, AlertTriangle } from 'lucide-react';
import PolicyModal from './PolicyModal.jsx';

// Adjust to match how the rest of the app builds its API base / auth headers.
const RAW_BASE = import.meta.env.VITE_API_BASE_URL;
if (!RAW_BASE) {
  console.error('✗ VITE_API_BASE is not set — check your .env file and restart the dev server.');
}
const API_BASE = `${RAW_BASE ?? ''}/api/policies`;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const TABS = [
  { key: 'policy', label: 'Policies', icon: FileText },
  { key: 'term',   label: 'Terms',    icon: Scale },
];

const STATUS_STYLES = {
  Published: 'bg-green-100 text-green-800',
  Draft:     'bg-amber-100 text-amber-800',
  Archived:  'bg-neutral-200 text-neutral-600',
};

export default function PoliciesPage() {
  const [activeTab, setActiveTab] = useState('policy');
  const [allPolicies, setAllPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [viewingPolicy, setViewingPolicy] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Fetch everything once — the backend returns all types when no `type`
  // filter is passed. We split into policies/terms on the client instead
  // of re-hitting the API on every tab switch.
  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(API_BASE, {
        headers: authHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load');
      setAllPolicies(data.policies);
    } catch (err) {
      console.error('✗ Fetch policies error:', err);
      setError('Could not load policies. Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const policies = useMemo(
    () => allPolicies.filter((p) => p.type === activeTab),
    [allPolicies, activeTab]
  );

  const openAddModal = () => {
    setEditingPolicy(null);
    setModalOpen(true);
  };

  const openEditModal = (policy) => {
    setViewingPolicy(null);
    setEditingPolicy(policy);
    setModalOpen(true);
  };

  const handleSaved = () => {
    setModalOpen(false);
    setEditingPolicy(null);
    fetchPolicies();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const policy = deleteTarget;
    setDeleteTarget(null);
    setDeletingId(policy.id);
    try {
      const res = await fetch(`${API_BASE}/${policy.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      setAllPolicies((prev) => prev.filter((p) => p.id !== policy.id));
      if (viewingPolicy?.id === policy.id) setViewingPolicy(null);
    } catch (err) {
      console.error('✗ Delete policy error:', err);
      setError('Could not delete this item. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-full mt-20 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">Shop Policies</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Manage the policies and terms shown to customers on the storefront.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchPolicies}
            disabled={loading}
            className="flex items-center gap-2 rounded border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            aria-label="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
          >
            <Plus size={16} />
            Add {activeTab === 'policy' ? 'policy' : 'term'}
          </button>
        </div>
      </div>

      <div className="mb-4 flex gap-1 border-b border-neutral-200 dark:border-neutral-700">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === key
                ? 'border-green-700 text-green-700'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800" />
          ))}
        </div>
      ) : policies.length === 0 ? (
        <div className="rounded border border-dashed border-neutral-300 py-12 text-center text-sm text-neutral-500 dark:border-neutral-700">
          No {activeTab === 'policy' ? 'policies' : 'terms'} yet. Add one to get started.
        </div>
      ) : (
        <ul className="space-y-3">
          {policies.map((policy) => (
            <li
              key={policy.id}
              onClick={() => setViewingPolicy(policy)}
              className="flex cursor-pointer items-start justify-between rounded border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800/60"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-medium text-neutral-900 dark:text-white">{policy.title}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[policy.status]}`}>
                    {policy.status}
                  </span>
                </div>
                {policy.summary && (
                  <p className="mt-1 truncate text-sm text-neutral-500 dark:text-neutral-400">{policy.summary}</p>
                )}
                {policy.effective_date && (
                  <p className="mt-1 text-xs text-neutral-400">
                    Effective {new Date(policy.effective_date).toLocaleDateString('en-KE')}
                  </p>
                )}
              </div>
              <div className="ml-4 flex shrink-0 gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); openEditModal(policy); }}
                  className="rounded p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  aria-label="Edit"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(policy); }}
                  disabled={deletingId === policy.id}
                  className="rounded p-2 text-red-500 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950"
                  aria-label="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {modalOpen && (
        <PolicyModal
          policy={editingPolicy}
          defaultType={activeTab}
          apiBase={API_BASE}
          authHeaders={authHeaders()}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}

      <PolicyDetailsDrawer
        policy={viewingPolicy}
        onClose={() => setViewingPolicy(null)}
        onEdit={openEditModal}
        onDelete={(policy) => setDeleteTarget(policy)}
      />

      <DeleteConfirmModal
        policy={deleteTarget}
        isDeleting={deletingId === deleteTarget?.id}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

// ── Right-side slide-over for reading a policy ──────────────────────────────
function PolicyDetailsDrawer({ policy, onClose, onEdit, onDelete }) {
  const [mounted, setMounted] = useState(false);
  const open = !!policy;

  useEffect(() => {
    if (open) {
      const raf = requestAnimationFrame(() => setMounted(true));
      return () => cancelAnimationFrame(raf);
    }
    setMounted(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        className={`relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-neutral-900 ${
          mounted ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-neutral-200 px-6 py-5 dark:border-neutral-700">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[policy.status]}`}>
                {policy.status}
              </span>
              {policy.effective_date && (
                <span className="text-xs text-neutral-400">
                  Effective {new Date(policy.effective_date).toLocaleDateString('en-KE')}
                </span>
              )}
            </div>
            <h2 className="truncate text-lg font-semibold text-neutral-900 dark:text-white">{policy.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {policy.summary && (
            <p className="mb-4 text-sm italic text-neutral-500 dark:text-neutral-400">{policy.summary}</p>
          )}
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
            {policy.content}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-neutral-200 px-6 py-4 dark:border-neutral-700">
          <button
            onClick={() => onDelete(policy)}
            className="flex items-center gap-2 rounded px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
          >
            <Trash2 size={16} />
            Delete
          </button>
          <button
            onClick={() => onEdit(policy)}
            className="flex items-center gap-2 rounded bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
          >
            <Pencil size={16} />
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete confirmation modal ────────────────────────────────────────────────
function DeleteConfirmModal({ policy, isDeleting, onCancel, onConfirm }) {
  if (!policy) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div onClick={onCancel} className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl dark:bg-neutral-900">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
            <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
            Delete {policy.type === 'policy' ? 'policy' : 'term'}?
          </h3>
        </div>
        <p className="mb-6 text-sm text-neutral-600 dark:text-neutral-400">
          Are you sure you want to delete <span className="font-medium text-neutral-900 dark:text-white">“{policy.title}”</span>?
          This can't be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting && <RefreshCw size={14} className="animate-spin" />}
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}