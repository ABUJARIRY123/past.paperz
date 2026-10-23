import { useEffect, useMemo, useState } from "react";
import {
  Wrench,
  Home,
  Store,
  Phone,
  MapPin,
  CalendarClock,
  Search,
  X,
  Loader2,
  ChevronDown,
  RefreshCw,
} from "lucide-react";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api/bookings`;
const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900/40",
  confirmed: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-white/15 dark:text-white dark:border-white/10",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-white/15 dark:text-white dark:border-white/10",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-white/5 dark:text-white/40 dark:border-white/10",
};

const STATUS_LABEL = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

const NEXT_STATUS = {
  pending: "confirmed",
  confirmed: "completed",
  completed: null,
  cancelled: null,
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(timeStr) {
  if (!timeStr) return "—";
  const [h, m] = timeStr.split(":");
  const hour = Number(h);
  const suffix = hour >= 12 ? "pm" : "am";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${m}${suffix}`;
}

function formatDateTime(isoStr) {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return "—";
  const datePart = d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
  const timePart = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${datePart}, ${timePart}`;
}

const RESOLVED_STATUSES = new Set(["completed", "cancelled"]);

// Prefer an explicit resolution timestamp if the API ever starts sending one
// (resolvedAt / updatedAt / completedAt / cancelledAt). Until then, a
// resolved booking's age keeps climbing instead of freezing at the moment
// it was closed — flagging this here so it's easy to wire up later.
function getResolvedAt(booking) {
  return (
    booking.resolvedAt ||
    booking.resolved_at ||
    booking.updatedAt ||
    booking.updated_at ||
    booking.completedAt ||
    booking.completed_at ||
    booking.cancelledAt ||
    booking.cancelled_at ||
    null
  );
}

function formatDuration(ms) {
  if (ms == null || Number.isNaN(ms) || ms < 0) return "—";
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "just now";
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function getAge(booking, now) {
  const start = new Date(booking.created_at).getTime();
  const resolvedAt = RESOLVED_STATUSES.has(booking.status) ? getResolvedAt(booking) : null;
  const end = resolvedAt ? new Date(resolvedAt).getTime() : now;
  return {
    ms: end - start,
    isResolved: RESOLVED_STATUSES.has(booking.status) && Boolean(resolvedAt),
  };
}

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

function StatusPill({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
        STATUS_STYLES[status] || "bg-stone-50 text-stone-600 border-stone-200 dark:bg-white/5 dark:text-white/50 dark:border-white/10"
      }`}
    >
      {STATUS_LABEL[status] || status}
    </span>
  );
}

function VisitTypeTag({ type }) {
  const Icon = type === "home" ? Home : Store;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-stone-500 dark:text-white/40">
      <Icon size={13} strokeWidth={2} />
      {type === "home" ? "Home visit" : "In-shop"}
    </span>
  );
}

function AgeBadge({ booking, now }) {
  const { ms, isResolved } = getAge(booking, now);
  const isStale = !isResolved && booking.status !== "cancelled" && ms > 24 * 60 * 60 * 1000;

  return (
    <div className="flex flex-col">
      <span
        className={`text-xs ${
          isStale
            ? "font-medium text-amber-600 dark:text-red-400"
            : "text-stone-500 dark:text-white/40"
        }`}
        title={isResolved ? "Time from creation to resolution" : "Time since created"}
      >
        {formatDuration(ms)}
        {isResolved ? "" : " open"}
      </span>
      <span className="text-[11px] text-stone-400 dark:text-white/30">
        {formatDateTime(booking.created_at)}
      </span>
    </div>
  );
}

function BookingRow({ booking, onOpen, now }) {
  return (
    <tr
      onClick={() => onOpen(booking)}
      className="cursor-pointer border-b border-stone-100 last:border-0 hover:bg-stone-50 dark:border-white/10 dark:hover:bg-white/5"
    >
      <td className="py-3 pl-5 pr-3">
        <div className="font-medium text-stone-900 dark:text-white">{booking.customer.name}</div>
        <div className="text-xs text-stone-500 dark:text-white/40">{booking.ticket}</div>
      </td>
      <td className="px-3 py-3 text-sm text-stone-700 dark:text-white/70">{booking.serviceType}</td>
      <td className="px-3 py-3">
        <VisitTypeTag type={booking.visitType} />
      </td>
      <td className="px-3 py-3 text-sm text-stone-700 dark:text-white/70">
        {formatDate(booking.schedule.date)}
        <span className="text-stone-400 dark:text-white/30"> · </span>
        {formatTime(booking.schedule.time)}
      </td>
      <td className="px-3 py-3">
        <AgeBadge booking={booking} now={now} />
      </td>
      <td className="py-3 pl-3 pr-5 text-right">
        <StatusPill status={booking.status} />
      </td>
    </tr>
  );
}

function BookingDetail({ booking, onClose, onStatusChange, onSaveNotes, busy, now }) {
  const [notes, setNotes] = useState(booking.notes || "");
  const nextStatus = NEXT_STATUS[booking.status];
  const { ms: ageMs, isResolved } = getAge(booking, now);

  return (
    <div className="fixed  inset-0 z-50 flex items-stretch justify-end bg-stone-900/30 dark:bg-black/60">
      <div className="flex w-full max-w-md flex-col bg-white shadow-xl dark:bg-black dark:border-l dark:border-white/10">
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4 dark:border-white/10">
          <div>
            <p className="text-xs uppercase tracking-wide text-stone-400 dark:text-white/40">
              {booking.ticket}
            </p>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-white">
              {booking.customer.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <div>
            <div className="flex items-center gap-2">
              <StatusPill status={booking.status} />
              <span className="text-xs text-stone-400 dark:text-white/40">
                {isResolved
                  ? `Resolved in ${formatDuration(ageMs)}`
                  : `Open for ${formatDuration(ageMs)}`}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-stone-400 dark:text-white/30">
              Created {formatDateTime(booking.created_at)}
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2.5 text-stone-700 dark:text-white/70">
              <Wrench size={16} className="mt-0.5 shrink-0 text-stone-400 dark:text-white/40" />
              <span>{booking.serviceType}</span>
            </div>
            <div className="flex items-start gap-2.5 text-stone-700 dark:text-white/70">
              <Phone size={16} className="mt-0.5 shrink-0 text-stone-400 dark:text-white/40" />
              <span>{booking.customer.phone}</span>
            </div>
            <div className="flex items-start gap-2.5 text-stone-700 dark:text-white/70">
              <MapPin size={16} className="mt-0.5 shrink-0 text-stone-400 dark:text-white/40" />
              <span>
                {booking.address}
                <span className="text-stone-400 dark:text-white/30"> · </span>
                {booking.visitType === "home" ? "Home visit" : "In-shop visit"}
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-stone-700 dark:text-white/70">
              <CalendarClock size={16} className="mt-0.5 shrink-0 text-stone-400 dark:text-white/40" />
              <span>
                {formatDate(booking.schedule.date)} at {formatTime(booking.schedule.time)}
              </span>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-500 dark:text-white/40">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Add a note for this booking…"
              className="w-full resize-none rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-800 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400 dark:border-white/20 dark:bg-black dark:text-white dark:placeholder:text-white/30 dark:focus:border-red-600/50 dark:focus:ring-red-600/40"
            />
            <button
              onClick={() => onSaveNotes(booking.id, notes)}
              disabled={busy || notes === (booking.notes || "")}
              className="mt-2 rounded-md border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50 disabled:opacity-40 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/5"
            >
              Save note
            </button>
          </div>
        </div>

        <div className="flex gap-2 border-t border-stone-100 px-5 py-4 dark:border-white/10">
          {booking.status !== "cancelled" && booking.status !== "completed" && (
            <button
              onClick={() => onStatusChange(booking.id, "cancelled")}
              disabled={busy}
              className="flex-1 rounded-lg border border-stone-200 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50 disabled:opacity-40 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/5"
            >
              Cancel booking
            </button>
          )}
          {nextStatus && (
            <button
              onClick={() => onStatusChange(booking.id, nextStatus)}
              disabled={busy}
              className="flex-1 rounded-lg bg-stone-900 py-2.5 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-40 dark:bg-white dark:text-black dark:hover:bg-white/85"
            >
              {busy ? (
                <Loader2 size={16} className="mx-auto animate-spin" />
              ) : (
                `Mark as ${STATUS_LABEL[nextStatus]}`
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BriskBookingsDashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const loadBookings = async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      const { items } = await apiFetch(params);
      setBookings(items);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filtered = useMemo(() => {
    if (!query.trim()) return bookings;
    const q = query.toLowerCase();
    return bookings.filter(
      (b) =>
        b.customer.name.toLowerCase().includes(q) ||
        b.ticket.toLowerCase().includes(q) ||
        b.customer.phone.includes(q)
    );
  }, [bookings, query]);

  const counts = useMemo(() => {
    const base = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    bookings.forEach((b) => {
      if (base[b.status] !== undefined) base[b.status] += 1;
    });
    return base;
  }, [bookings]);

  const handleStatusChange = async (id, status) => {
    setBusy(true);
    try {
      const { item } = await apiFetch(`/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setBookings((prev) => prev.map((b) => (b.id === id ? item : b)));
      setSelected(item);
      if (status === "completed" || status === "cancelled") {
        setTimeout(() => setSelected(null), 400);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleSaveNotes = async (id, notes) => {
    setBusy(true);
    try {
      const { item } = await apiFetch(`/${id}/notes`, {
        method: "PATCH",
        body: JSON.stringify({ notes }),
      });
      setBookings((prev) => prev.map((b) => (b.id === id ? item : b)));
      setSelected(item);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen mt-12 bg-stone-50 dark:bg-black">
      <div className="mx-auto max-w-full px-6 py-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-stone-900 dark:text-white">Visit bookings</h1>
            <p className="mt-1 text-sm text-stone-500 dark:text-white/50">
              Repair and service visit requests.
            </p>
          </div>
          <div className="flex gap-4 text-sm text-stone-500 dark:text-white/50">
            <span>
              <span className="font-medium text-amber-600 dark:text-red-400">{counts.pending}</span> pending
            </span>
            <span>
              <span className="font-medium text-sky-600 dark:text-white">{counts.confirmed}</span> confirmed
            </span>
            <span>
              <span className="font-medium text-emerald-600 dark:text-white">{counts.completed}</span>{" "}
              completed
            </span>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-white/40"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, ticket, phone..."
              className="w-full rounded-lg border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm text-stone-700 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400 dark:border-white/20 dark:bg-black dark:text-white dark:placeholder:text-white/30 dark:focus:border-red-600/50 dark:focus:ring-red-600/40"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none rounded-lg border border-stone-200 bg-white py-2 pl-3 pr-8 text-sm text-stone-700 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400 dark:border-white/20 dark:bg-black dark:text-white dark:focus:border-red-600/50 dark:focus:ring-red-600/40"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-white/40"
            />
          </div>
          <button
            onClick={() => loadBookings({ silent: true })}
            disabled={loading || refreshing}
            title="Refresh bookings"
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 disabled:opacity-40 dark:border-white/20 dark:bg-black dark:text-white/70 dark:hover:bg-white/5"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-white/10 dark:bg-black">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-stone-400 dark:text-white/40">
              <Loader2 size={20} className="animate-spin" />
            </div>
          ) : error ? (
            <div className="px-5 py-10 text-center text-sm text-rose-600 dark:text-red-500">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-16 text-center text-sm text-stone-400 dark:text-white/40">
              No bookings match this view.
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400 dark:border-white/10 dark:text-white/40">
                  <th className="py-3 pl-5 pr-3 font-medium">Customer</th>
                  <th className="px-3 py-3 font-medium">Service</th>
                  <th className="px-3 py-3 font-medium">Visit</th>
                  <th className="px-3 py-3 font-medium">Scheduled</th>
                  <th className="px-3 py-3 font-medium">Age</th>
                  <th className="py-3 pl-3 pr-5 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <BookingRow key={b.id} booking={b} onOpen={setSelected} now={now} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selected && (
        <BookingDetail
          booking={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
          onSaveNotes={handleSaveNotes}
          busy={busy}
          now={now}
        />
      )}
    </div>
  );
}