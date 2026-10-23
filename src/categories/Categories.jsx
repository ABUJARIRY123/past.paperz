import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  X,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Check,
  Tag,
  RefreshCw,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

/**
 * Admin page for managing stock categories and the types held in each
 * category's `types` array (e.g. category "Laptop" -> types ["Lenovo",
 * "HP", "Dell"]). Types have no id of their own -- they're addressed by
 * name, URL-encoded, against the category they live on.
 *
 * GET    /api/categories/categories                        -> { items: [{ id, name, types:[...] }] }
 * POST   /api/categories/categories                         body: { name, types? } (types: comma-separated)
 * PATCH  /api/categories/categories/:id                      body: { name }
 * DELETE /api/categories/categories/:id
 * POST   /api/categories/categories/:id/types                body: { types }  (comma-separated, appends)
 * PATCH  /api/categories/categories/:id/types/:name           body: { name }  (:name = current name, encoded)
 * DELETE /api/categories/categories/:id/types/:name
 */
export default function CategoryManagementPage() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [expanded, setExpanded] = useState(() => new Set());

  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryTypes, setNewCategoryTypes] = useState("");
  const [addCategoryError, setAddCategoryError] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // ── Load categories. `silent` skips the full-page loading state and
  // uses the small refresh spinner instead (used by the Refresh button). ──
  const fetchCategories = useCallback(async (silent = false) => {
    if (silent) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/categories/categories`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data?.message || "Failed to load categories");
      setCategories(data.items ?? []);
      setLoadError("");
    } catch (err) {
      if (!silent) setCategories([]);
      setLoadError(err.message || "Could not reach the server.");
    } finally {
      if (silent) setIsRefreshing(false);
      else setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleRefresh = () => {
    if (isLoading || isRefreshing) return;
    fetchCategories(true);
  };

  const toggleExpanded = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const replaceCategory = (item) => {
    setCategories((prev) => prev.map((c) => (c.id === item.id ? item : c)));
  };

  // ── Add category (optionally seeded with comma-separated types) ────────
  const handleAddCategory = async (e) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) {
      setAddCategoryError("Category name is required.");
      return;
    }

    setIsAddingCategory(true);
    setAddCategoryError("");
    try {
      const res = await fetch(`${API_BASE}/api/categories/categories`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, types: newCategoryTypes }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data?.message || "Could not add category.");

      setCategories((prev) => [...prev, data.item].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCategoryName("");
      setNewCategoryTypes("");
      setIsAddCategoryOpen(false);
    } catch (err) {
      setAddCategoryError(err.message || "Something went wrong. Try again.");
    } finally {
      setIsAddingCategory(false);
    }
  };

  // ── Delete category ───────────────────────────────────────────────────
  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Delete this category and all its types?")) return;
    const previous = categories;
    setCategories((prev) => prev.filter((c) => c.id !== id));
    try {
      const res = await fetch(`${API_BASE}/api/categories/categories/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data?.message || "Could not delete category.");
    } catch (err) {
      setCategories(previous);
      setLoadError(err.message || "Could not delete category.");
    }
  };

  // ── Rename category ──────────────────────────────────────────────────
  const handleRenameCategory = async (id, name) => {
    const previous = categories;
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
    try {
      const res = await fetch(`${API_BASE}/api/categories/categories/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data?.message || "Could not rename category.");
      replaceCategory(data.item);
    } catch (err) {
      setCategories(previous);
      setLoadError(err.message || "Could not rename category.");
    }
  };

  // ── Add type(s) to a category (comma-separated string accepted) ────────
  const handleAddType = async (categoryId, rawInput) => {
    const res = await fetch(`${API_BASE}/api/categories/categories/${categoryId}/types`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ types: rawInput }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data?.message || "Could not add type.");
    replaceCategory(data.item);
  };

  // ── Rename a type (identified by its current name) ──────────────────────
  const handleRenameType = async (categoryId, oldName, newName) => {
    const previous = categories;
    setCategories((prev) =>
      prev.map((c) =>
        c.id === categoryId
          ? { ...c, types: c.types.map((t) => (t === oldName ? newName : t)) }
          : c
      )
    );
    try {
      const res = await fetch(
        `${API_BASE}/api/categories/categories/${categoryId}/types/${encodeURIComponent(oldName)}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data?.message || "Could not rename type.");
      replaceCategory(data.item);
    } catch (err) {
      setCategories(previous);
      setLoadError(err.message || "Could not rename type.");
    }
  };

  // ── Delete a type (identified by its current name) ──────────────────────
  const handleDeleteType = async (categoryId, name) => {
    const previous = categories;
    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, types: c.types.filter((t) => t !== name) } : c))
    );
    try {
      const res = await fetch(
        `${API_BASE}/api/categories/categories/${categoryId}/types/${encodeURIComponent(name)}`,
        { method: "DELETE", credentials: "include" }
      );
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data?.message || "Could not delete type.");
      replaceCategory(data.item);
    } catch (err) {
      setCategories(previous);
      setLoadError(err.message || "Could not delete type.");
    }
  };

  return (
    <div className="min-h-screen mt-12 bg-[#F6F7F5] dark:bg-black text-[#0E1A2B] dark:text-white transition-colors">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-end justify-between flex-wrap gap-3 mb-8">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-700 mt-1">Categories</h1>
            <p className="text-xs text-[#0E1A2B]/50 dark:text-white/50 mt-1">
              A category groups products (e.g. "Laptop"); types are the variants under it (e.g. "Lenovo", "HP").
            </p>
            {loadError && (
              <p className="text-[11px] text-rose-600 dark:text-red-500 mt-1">{loadError}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium bg-[#0E1A2B]/5 hover:bg-[#0E1A2B]/10 text-[#0E1A2B] disabled:opacity-60 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white transition-colors"
              aria-label="Refresh categories"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => setIsAddCategoryOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium bg-[#0E1A2B] text-white hover:bg-[#0E1A2B]/90 dark:bg-red-600 dark:hover:bg-red-500 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add category
            </button>
          </div>
        </div>

        {/* List */}
        <div className="bg-white dark:bg-black border border-[#0E1A2B]/10 dark:border-white/10 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="px-5 py-12 text-center text-sm text-[#0E1A2B]/50 dark:text-white/50">
              Loading categories…
            </div>
          ) : categories.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-[#0E1A2B]/50 dark:text-white/50">
              No categories yet. Add your first one above.
            </div>
          ) : (
            categories.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                isExpanded={expanded.has(category.id)}
                onToggle={() => toggleExpanded(category.id)}
                onRename={(name) => handleRenameCategory(category.id, name)}
                onDelete={() => handleDeleteCategory(category.id)}
                onAddType={(rawInput) => handleAddType(category.id, rawInput)}
                onRenameType={(oldName, newName) => handleRenameType(category.id, oldName, newName)}
                onDeleteType={(name) => handleDeleteType(category.id, name)}
              />
            ))
          )}
        </div>
      </div>

      {/* Add category modal */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !isAddingCategory && setIsAddCategoryOpen(false)}
          />
          <form
            onSubmit={handleAddCategory}
            className="relative w-full max-w-sm bg-white dark:bg-black border border-[#0E1A2B]/10 dark:border-white/15 rounded-2xl p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-700">Add category</h2>
              <button
                type="button"
                onClick={() => !isAddingCategory && setIsAddCategoryOpen(false)}
                className="cursor-pointer w-7 h-7 flex items-center justify-center rounded-full bg-[#0E1A2B]/5 hover:bg-[#0E1A2B]/10 text-[#0E1A2B] dark:bg-white/10 dark:hover:bg-white/20 dark:text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="block text-[11px] font-medium text-[#0E1A2B]/50 dark:text-white/50 mb-1">
                  Category name
                </span>
                <input
                  type="text"
                  autoFocus
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Laptop"
                  className="input"
                />
              </label>

              <label className="block">
                <span className="block text-[11px] font-medium text-[#0E1A2B]/50 dark:text-white/50 mb-1">
                  Types (optional, comma-separated)
                </span>
                <input
                  type="text"
                  value={newCategoryTypes}
                  onChange={(e) => setNewCategoryTypes(e.target.value)}
                  placeholder="e.g. Lenovo, HP, Dell"
                  className="input"
                />
              </label>
            </div>

            {addCategoryError && (
              <p className="mt-2 text-xs text-rose-600 dark:text-red-500">{addCategoryError}</p>
            )}

            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => !isAddingCategory && setIsAddCategoryOpen(false)}
                className="px-4 py-2 rounded-full text-xs font-medium text-[#0E1A2B]/60 hover:bg-[#0E1A2B]/5 dark:text-white/60 dark:hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAddingCategory}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium bg-[#0E1A2B] text-white hover:bg-[#0E1A2B]/90 disabled:opacity-60 dark:bg-red-600 dark:hover:bg-red-500 transition-colors"
              >
                {isAddingCategory && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isAddingCategory ? "Adding…" : "Add category"}
              </button>
            </div>
          </form>
        </div>
      )}

      <style>{`
        .input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid rgba(14,26,43,0.1);
          background: white;
          font-size: 0.8125rem;
        }
        .dark .input {
          border-color: rgba(255,255,255,0.15);
          background: black;
          color: white;
        }
      `}</style>
    </div>
  );
}

// ── One category row: name, expand/collapse, rename, delete, nested types ──
function CategoryRow({
  category,
  isExpanded,
  onToggle,
  onRename,
  onDelete,
  onAddType,
  onRenameType,
  onDeleteType,
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(category.name);

  const [newTypeInput, setNewTypeInput] = useState("");
  const [addTypeError, setAddTypeError] = useState("");
  const [isAddingType, setIsAddingType] = useState(false);

  const commitNameEdit = () => {
    const trimmed = nameDraft.trim();
    setIsEditingName(false);
    if (trimmed && trimmed !== category.name) onRename(trimmed);
    else setNameDraft(category.name);
  };

  const handleAddTypeSubmit = async (e) => {
    e.preventDefault();
    const value = newTypeInput.trim();
    if (!value) {
      setAddTypeError("Type name is required.");
      return;
    }
    setIsAddingType(true);
    setAddTypeError("");
    try {
      await onAddType(value);
      setNewTypeInput("");
    } catch (err) {
      setAddTypeError(err.message || "Could not add type.");
    } finally {
      setIsAddingType(false);
    }
  };

  return (
    <div className="border-b border-[#0E1A2B]/8 dark:border-white/10 last:border-b-0">
      <div className="flex items-center gap-3 px-5 py-4">
        <button
          type="button"
          onClick={onToggle}
          className="w-6 h-6 flex items-center justify-center rounded-full text-[#0E1A2B]/50 hover:bg-[#0E1A2B]/5 dark:text-white/50 dark:hover:bg-white/10 transition-colors shrink-0"
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        <Tag className="w-3.5 h-3.5 text-[#0E1A2B]/35 dark:text-red-500/70 shrink-0" />

        {isEditingName ? (
          <input
            type="text"
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={commitNameEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitNameEdit();
              if (e.key === "Escape") {
                setNameDraft(category.name);
                setIsEditingName(false);
              }
            }}
            className="input flex-1"
          />
        ) : (
          <button
            type="button"
            onClick={onToggle}
            className="flex-1 text-left text-sm font-medium truncate"
          >
            {category.name}
          </button>
        )}

        <span className="text-[11px] font-mono text-[#0E1A2B]/40 dark:text-white/40 shrink-0">
          {category.types.length} type{category.types.length === 1 ? "" : "s"}
        </span>

        <button
          type="button"
          onClick={() => setIsEditingName(true)}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-[#0E1A2B]/5 hover:bg-[#0E1A2B]/10 text-[#0E1A2B] dark:bg-white/10 dark:hover:bg-white/20 dark:text-white transition-colors shrink-0"
          aria-label={`Rename ${category.name}`}
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-red-950 dark:hover:bg-red-900 dark:text-red-500 transition-colors shrink-0"
          aria-label={`Delete ${category.name}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {isExpanded && (
        <div className="px-5 pb-4 pl-14 space-y-2">
          {category.types.length === 0 && (
            <p className="text-xs text-[#0E1A2B]/40 dark:text-white/40">No types yet.</p>
          )}

          <div className="flex flex-wrap gap-2">
            {category.types.map((typeName) => (
              <TypeChip
                key={typeName}
                name={typeName}
                onRename={(newName) => onRenameType(typeName, newName)}
                onDelete={() => onDeleteType(typeName)}
              />
            ))}
          </div>

          <form onSubmit={handleAddTypeSubmit} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newTypeInput}
              onChange={(e) => setNewTypeInput(e.target.value)}
              placeholder="e.g. Lenovo, HP"
              className="input flex-1 !py-1.5"
            />
            <button
              type="submit"
              disabled={isAddingType}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium bg-[#0E1A2B]/5 hover:bg-[#0E1A2B]/10 text-[#0E1A2B] disabled:opacity-60 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white transition-colors shrink-0"
            >
              {isAddingType ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              Add type
            </button>
          </form>
          {addTypeError && (
            <p className="text-[11px] text-rose-600 dark:text-red-500">{addTypeError}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── One type chip: name, rename, delete ─────────────────────────────────────
function TypeChip({ name, onRename, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  const commit = () => {
    const trimmed = draft.trim();
    setIsEditing(false);
    if (trimmed && trimmed !== name) onRename(trimmed);
    else setDraft(name);
  };

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0E1A2B]/5 dark:bg-white/5">
      {isEditing ? (
        <input
          type="text"
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setDraft(name);
              setIsEditing(false);
            }
          }}
          className="input !w-24 !py-0.5"
        />
      ) : (
        <span className="text-xs">{name}</span>
      )}

      <button
        type="button"
        onClick={() => (isEditing ? commit() : setIsEditing(true))}
        className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-[#0E1A2B]/10 text-[#0E1A2B]/60 dark:hover:bg-white/15 dark:text-white/60 transition-colors shrink-0"
        aria-label={isEditing ? `Save ${name}` : `Rename ${name}`}
      >
        {isEditing ? <Check className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-rose-100 text-rose-500 dark:hover:bg-red-900 dark:text-red-500 transition-colors shrink-0"
        aria-label={`Delete ${name}`}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}