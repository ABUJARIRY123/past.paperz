import { useState, useEffect } from "react";
import MetricCards from "./MetricCard";
import Toolbar from "./ToolBar";
import KanbanView from "./KanbanView";
import ListView from "./ListView";
import RightPanel from "./RightPanel";
import NewRequestModal from "./newrequest/NewRequestModal";

// Map a path_leave_requests row onto the shape the kanban/list/search expect.
function normalizeLeave(r) {
  return {
    ...r,
    id: r.request_no || r.id,
    type: "leave",
    activity: `${r.leave_type} Leave`,
    project: "—",                       // leave has no project
    submitted_by: r.submitted_by_name || r.submitted_by,
    request_date: r.start_date,         // give the date columns something meaningful
    status: r.status,
    created_at: r.created_at,
    _leave: r,                          // keep the raw row for the detail panel
  };
}

export default function RequestsDisplay() {
  const [requests, setRequests] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);

  const [typeFilter, setTypeFilter] = useState("all");
  const [view, setView] = useState("kanban");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Right panel state
  const [panelMode, setPanelMode] = useState(null);
  const [activeRecord, setActiveRecord] = useState(null);

  // New request modal
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchRequests = async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoadingData(true);
    setError(null);

    const base = import.meta.env.VITE_API_BASE_URL;

    try {
      const [fundRes, leaveRes] = await Promise.allSettled([
        fetch(`${base}/api/finances/fund-requests/my`, { credentials: "include" }),
        fetch(`${base}/api/leaving/myrequests`, { credentials: "include" }),
      ]);

      const merged = [];
      const failures = [];

      // ── fund requests ──
      if (fundRes.status === "fulfilled" && fundRes.value.ok) {
        const json = await fundRes.value.json();
        merged.push(...(json.requests ?? []));
      } else {
        failures.push("fund requests");
      }

      // ── leave requests ──
      if (leaveRes.status === "fulfilled" && leaveRes.value.ok) {
        const json = await leaveRes.value.json();
        if (json?.success) merged.push(...(json.requests ?? []).map(normalizeLeave));
      } else {
        failures.push("leave requests");
      }

      // newest first across both sources
      merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setRequests(merged);

      if (failures.length) setError(`Could not load ${failures.join(" and ")}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingData(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = requests.filter(r =>
    (typeFilter === "all" || r.type === typeFilter) &&
    (!search || [r.activity, r.project, r.id, r.submitted_by]
      .join(" ").toLowerCase().includes(search.toLowerCase()))
  );

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSelectCard  = (r) => { setActiveRecord(r); setPanelMode("detail"); };
  const handleEdit        = () => setPanelMode("edit");
  const handleRetire      = () => setPanelMode("retire");
  const handleClosePanel  = () => { setPanelMode(null); setActiveRecord(null); };
  const handleModalClose  = () => setPanelMode("detail");
  const handleRefresh     = () => fetchRequests(true);

  // Called on successful edit or retirement — re-fetch then close the panel.
  const handleSubmit = () => {
    fetchRequests();
    handleClosePanel();
  };

  const handleNewRequestSubmit = (data) => {
    console.log("New request submitted:", data);
    setShowNewRequestModal(false);
    fetchRequests();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex mt-20 bg-zinc-50 dark:bg-zinc-950 font-sans overflow-hidden">
      {/* ── Left column ── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Page header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                Requests portal
              </h1>
              <p className="text-sm text-zinc-400 mt-0.5">
                {loadingData ? "Loading…" : `${requests.length} requests across all categories`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                title="Refresh"
                className={`w-8 h-8 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all ${refreshing ? "animate-spin" : ""}`}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M14 8A6 6 0 1 1 8 2a6 6 0 0 1 4.243 1.757L14 2v4h-4l1.536-1.536A4 4 0 1 0 12 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                onClick={() => setShowNewRequestModal(true)}
                className="flex items-center gap-1.5 px-4 h-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                New request
              </button>
            </div>
          </div>

          {/* Metrics */}
          <MetricCards requests={requests} />

          {/* Toolbar */}
          <Toolbar
            search={search}
            onSearch={setSearch}
            typeFilter={typeFilter}
            onTypeFilter={setTypeFilter}
            view={view}
            onView={setView}
          />

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {error} — <button onClick={handleRefresh} className="underline">retry</button>
            </div>
          )}

          {!loadingData && !error && (
            <p className="text-xs text-zinc-400">
              Showing {filtered.length} of {requests.length} requests
            </p>
          )}

          {/* Skeleton */}
          {loadingData && (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              ))}
            </div>
          )}

          {/* Main content */}
          {!loadingData && !error && (
            view === "kanban" ? (
              <KanbanView records={filtered} activeId={activeRecord?.id ?? null} onSelect={handleSelectCard} />
            ) : (
              <ListView records={filtered} activeId={activeRecord?.id ?? null} onSelect={handleSelectCard} />
            )
          )}
        </div>
      </div>

      {/* ── Right panel ── */}
      {panelMode && (
        <RightPanel
          mode={panelMode}
          record={activeRecord}
          onClose={handleClosePanel}
          onEdit={handleEdit}
          onRetire={handleRetire}
          onModalClose={handleModalClose}
          onSubmit={handleSubmit}
        />
      )}

      {/* ── New Request Modal ── */}
      {showNewRequestModal && (
        <NewRequestModal
          onClose={() => setShowNewRequestModal(false)}
          onSubmit={handleNewRequestSubmit}
        />
      )}
    </div>
  );
}