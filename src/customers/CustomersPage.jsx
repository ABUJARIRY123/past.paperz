import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Phone,
  MapPin,
  Store,
  ShieldCheck,
  Users,
  Loader2,
  ChevronDown,
  RefreshCw,
} from "lucide-react";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api/customers`;

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || "Request failed");
  return body;
}

function formatDateTime(isoStr) {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return "—";
  const datePart = d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  const timePart = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${datePart}, ${timePart}`;
}

function initials(customer) {
  const source =
    customer.fullName ||
    [customer.firstName, customer.lastName].filter(Boolean).join(" ") ||
    "?";
  return source
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function displayName(customer) {
  return (
    customer.fullName ||
    [customer.firstName, customer.lastName].filter(Boolean).join(" ") ||
    "Unnamed customer"
  );
}

function RoleBadge({ role }) {
  if (!role) {
    return (
      <span className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-500 dark:border-white/10 dark:bg-white/5 dark:text-white/50">
        Customer
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-red-900/40 dark:bg-red-950 dark:text-red-400">
      <ShieldCheck size={12} strokeWidth={2} />
      {role}
    </span>
  );
}

function CustomerCard({ customer }) {
  const hasShop = Boolean(customer.shopName || customer.shopNumber);

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 dark:border-white/10 dark:bg-black">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-100 text-sm font-semibold text-stone-600 dark:bg-white/10 dark:text-white">
            {initials(customer)}
          </div>
          <div>
            <p className="font-medium text-stone-900 dark:text-white">{displayName(customer)}</p>
            <p className="text-xs text-stone-400 dark:text-white/40">
              Updated {formatDateTime(customer.updatedAt)}
            </p>
          </div>
        </div>
        <RoleBadge role={customer.role} />
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center gap-2.5 text-stone-700 dark:text-white/70">
          <Phone size={14} className="shrink-0 text-stone-400 dark:text-white/40" />
          <span>{customer.phone || "—"}</span>
        </div>
        <div className="flex items-center gap-2.5 text-stone-700 dark:text-white/70">
          <MapPin size={14} className="shrink-0 text-stone-400 dark:text-white/40" />
          <span>{customer.address || "—"}</span>
        </div>
        {hasShop && (
          <div className="flex items-center gap-2.5 text-stone-700 dark:text-white/70">
            <Store size={14} className="shrink-0 text-stone-400 dark:text-white/40" />
            <span>
              {customer.shopName || "—"}
              {customer.shopNumber ? (
                <span className="text-stone-400 dark:text-white/30"> · {customer.shopNumber}</span>
              ) : null}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  const loadCustomers = async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const params = roleFilter !== "all" ? `?role=${roleFilter}` : "";
      const { items } = await apiFetch(params);
      setCustomers(items);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]);

  const filtered = useMemo(() => {
    if (!query.trim()) return customers;
    const q = query.toLowerCase();
    return customers.filter((c) => {
      const name = displayName(c).toLowerCase();
      return (
        name.includes(q) ||
        (c.phone || "").includes(q) ||
        (c.address || "").toLowerCase().includes(q) ||
        (c.shopName || "").toLowerCase().includes(q)
      );
    });
  }, [customers, query]);

  return (
    <div className="min-h-screen mt-12 bg-stone-50 dark:bg-black">
      <div className="mx-auto max-w-full px-6 py-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-600 dark:bg-white/10 dark:text-white">
            <Users size={18} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-stone-900 dark:text-white">Customers</h1>
            <p className="mt-0.5 text-sm text-stone-500 dark:text-white/50">
              {customers.length} {customers.length === 1 ? "profile" : "profiles"} on record
            </p>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-white/40"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, phone, address, shop…"
              className="w-full rounded-lg border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm text-stone-700 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400 dark:border-white/20 dark:bg-black dark:text-white dark:placeholder:text-white/30 dark:focus:border-red-600/50 dark:focus:ring-red-600/40"
            />
          </div>
       
          <button
            onClick={() => loadCustomers({ silent: true })}
            disabled={loading || refreshing}
            title="Refresh customers"
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 disabled:opacity-40 dark:border-white/20 dark:bg-black dark:text-white/70 dark:hover:bg-white/5"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center rounded-xl border border-stone-200 bg-white py-16 text-stone-400 dark:border-white/10 dark:bg-black dark:text-white/40">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-stone-200 bg-white px-5 py-10 text-center text-sm text-rose-600 dark:border-white/10 dark:bg-black dark:text-red-500">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-stone-200 bg-white px-5 py-16 text-center text-sm text-stone-400 dark:border-white/10 dark:bg-black dark:text-white/40">
            No customers match this view.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filtered.map((c) => (
              <CustomerCard key={c.id} customer={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}