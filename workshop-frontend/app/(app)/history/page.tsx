"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { getErrorMessage } from "@/lib/errors";
import type { Registration, PaginatedResponse, Workshop } from "@/lib/types";
import Badge from "@/components/Badge";
import Spinner from "@/components/Spinner";
import EmptyState from "@/components/EmptyState";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RegistrationHistoryPage() {
  const { hasRole } = useAuth();
  const { toast } = useToast();

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<Registration>["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState("");
  const [workshopId, setWorkshopId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  // Workshop options for filter dropdown
  const [workshops, setWorkshops] = useState<Workshop[]>([]);

  // Cancel action state
  const [cancelTarget, setCancelTarget] = useState<Registration | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Fetch workshop list for dropdown
  useEffect(() => {
    api
      .get<PaginatedResponse<Workshop>>("/workshops", { params: { per_page: 100 } })
      .then((res) => setWorkshops(res.data.data))
      .catch(() => {});
  }, []);

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get<PaginatedResponse<Registration>>(
        "/registrations",
        {
          params: {
            search: search || undefined,
            status: status || undefined,
            workshop_id: workshopId || undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            page,
            per_page: 20,
          },
        }
      );
      setRegistrations(data.data);
      setMeta(data.meta);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, status, workshopId, dateFrom, dateTo, page]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const hasActiveFilters = Boolean(
    searchInput || status || workshopId || dateFrom || dateTo
  );

  const handleResetFilters = () => {
    setSearch("");
    setSearchInput("");
    setStatus("");
    setWorkshopId("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await api.patch(`/registrations/${cancelTarget.id}/cancel`);
      toast("Registration cancelled successfully. Seat freed.", "success");
      setCancelTarget(null);
      fetchRegistrations();
    } catch (err) {
      toast(getErrorMessage(err), "error");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold">Registration History</h1>
          <p className="text-sm text-muted mt-0.5">
            Audit and manage all active and cancelled attendee bookings.
          </p>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-border hover:bg-surface-hover text-muted hover:text-foreground transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Reset Filters
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-surface border border-border rounded-2xl p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <input
            placeholder="Search attendee…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="px-3.5 py-2 bg-background border border-border rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
          <select
            value={workshopId}
            onChange={(e) => {
              setWorkshopId(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2 bg-background border border-border rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          >
            <option value="">All Workshops</option>
            {workshops.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.code ? `[${ws.code}] ` : ""}{ws.title}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2 bg-background border border-border rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2 bg-background border border-border rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2 bg-background border border-border rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
          <button
            type="button"
            onClick={handleResetFilters}
            disabled={!hasActiveFilters}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm border border-border hover:bg-surface-hover text-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Reset
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      ) : registrations.length === 0 ? (
        <EmptyState
          title="No registrations found"
          message="No registration records match your filters."
        />
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-hover/50 border-b border-border text-xs uppercase text-muted tracking-wider">
                <tr>
                  <th className="px-5 py-3 font-semibold">Attendee</th>
                  <th className="px-5 py-3 font-semibold">Workshop</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Registered</th>
                  <th className="px-5 py-3 font-semibold">Audit</th>
                  <th className="px-5 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {registrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-surface-hover/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-foreground">{reg.attendee_name}</div>
                      <div className="text-xs text-muted">{reg.attendee_email}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {reg.workshop?.code && (
                          <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-mono font-medium">
                            {reg.workshop.code}
                          </span>
                        )}
                        <span className="font-medium text-foreground">
                          {reg.workshop?.title ?? `#${reg.workshop_id}`}
                        </span>
                      </div>
                      <div className="text-xs text-muted mt-0.5 space-y-0.5">
                        {reg.workshop?.instructor && (
                          <p>Instructor: {reg.workshop.instructor}</p>
                        )}
                        {reg.workshop?.starts_at && (
                          <p>📅 {formatDate(reg.workshop.starts_at)}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={reg.status === "active" ? "success" : "danger"}>
                        {reg.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted">
                      <div>{formatDate(reg.created_at)}</div>
                      {reg.registered_by && (
                        <div className="text-[11px] text-muted/80">
                          by {reg.registered_by.name}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted">
                      {reg.status === "cancelled" ? (
                        <div>
                          <div>Cancelled: {reg.cancelled_at ? formatDate(reg.cancelled_at) : "Yes"}</div>
                          {reg.cancelled_by && (
                            <div className="text-[11px] text-muted/80">
                              by {reg.cancelled_by.name}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted/60">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {reg.status === "active" && hasRole("manager", "staff") && (
                        <button
                          onClick={() => setCancelTarget(reg)}
                          className="px-2.5 py-1 text-xs rounded-lg border border-danger/30 text-danger hover:bg-danger/10 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border">
              <span className="text-xs text-muted">
                Showing {meta.from ?? 0} to {meta.to ?? 0} of {meta.total} records
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-2.5 py-1 text-xs rounded-lg border border-border hover:bg-surface-hover disabled:opacity-40 transition-colors"
                >
                  ← Prev
                </button>
                <span className="text-xs text-muted">
                  {meta.current_page} / {meta.last_page}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                  disabled={page === meta.last_page}
                  className="px-2.5 py-1 text-xs rounded-lg border border-border hover:bg-surface-hover disabled:opacity-40 transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleConfirmCancel}
        loading={cancelling}
        title="Cancel Registration"
        message={`Are you sure you want to cancel the registration for "${cancelTarget?.attendee_name}"? This will immediately free up 1 seat for the workshop.`}
        confirmText="Yes, Cancel Booking"
        variant="danger"
      />
    </div>
  );
}
