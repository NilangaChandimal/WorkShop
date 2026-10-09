"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { getErrorMessage } from "@/lib/errors";
import type { Workshop, PaginatedResponse } from "@/lib/types";
import Link from "next/link";
import Badge from "@/components/Badge";
import SeatMeter from "@/components/SeatMeter";
import Spinner from "@/components/Spinner";
import EmptyState from "@/components/EmptyState";
import BookingModal from "@/components/BookingModal";
import WorkshopFormModal from "@/components/WorkshopFormModal";

const statusVariant = (s: string) =>
  s === "scheduled" ? "info" : s === "completed" ? "success" : "danger";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DashboardPage() {
  const { hasRole } = useAuth();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<Workshop>["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [hasSeats, setHasSeats] = useState(false);
  const [page, setPage] = useState(1);

  // Modals
  const [bookingTarget, setBookingTarget] = useState<Workshop | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [formTarget, setFormTarget] = useState<Workshop | null>(null);

  const fetchWorkshops = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get<PaginatedResponse<Workshop>>(
        "/workshops",
        {
          params: {
            search: search || undefined,
            status: status || undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            has_seats: hasSeats ? "1" : undefined,
            page,
            per_page: 12,
          },
        }
      );
      setWorkshops(data.data);
      setMeta(data.meta);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, status, dateFrom, dateTo, hasSeats, page]);

  useEffect(() => {
    fetchWorkshops();
  }, [fetchWorkshops]);

  // Debounce search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const hasActiveFilters = Boolean(
    searchInput || status || dateFrom || dateTo || hasSeats
  );

  const handleResetFilters = () => {
    setSearch("");
    setSearchInput("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
    setHasSeats(false);
    setPage(1);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold">Workshops</h1>
          <p className="text-sm text-muted mt-0.5">
            Browse and register attendees for upcoming workshops.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl font-medium border border-border hover:bg-surface-hover text-muted hover:text-foreground transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Reset Filters
            </button>
          )}
          {hasRole("manager") && (
            <button
              onClick={() => {
                setFormTarget(null);
                setFormMode("create");
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl font-medium bg-primary hover:bg-primary-hover text-white shadow-sm shadow-primary/20 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
              New Workshop
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface border border-border rounded-2xl p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <input
            placeholder="Search code, title, instructor…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="px-3.5 py-2 bg-background border border-border rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2 bg-background border border-border rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          >
            <option value="">All statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
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
          <label className="flex items-center gap-2 px-3 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={hasSeats}
              onChange={(e) => {
                setHasSeats(e.target.checked);
                setPage(1);
              }}
              className="rounded accent-primary"
            />
            Seats available
          </label>
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
      ) : workshops.length === 0 ? (
        <EmptyState
          title="No workshops found"
          message="Try adjusting your filters or create a new workshop."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workshops.map((ws) => (
              <div
                key={ws.id}
                className="bg-surface border border-border rounded-2xl p-5 hover:shadow-lg hover:shadow-black/5 transition-shadow flex flex-col"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    {ws.code && (
                      <span className="inline-block px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-mono text-[10px] font-semibold mb-1">
                        {ws.code}
                      </span>
                    )}
                    <Link
                      href={`/workshops/${ws.id}`}
                      className="block font-semibold text-sm leading-snug hover:text-primary transition-colors"
                    >
                      {ws.title}
                    </Link>
                  </div>
                  <Badge variant={statusVariant(ws.status)}>
                    {ws.status}
                  </Badge>
                </div>

                <div className="text-xs text-muted space-y-1 mb-4 flex-1">
                  {ws.instructor && (
                    <p className="text-foreground/90 font-medium flex items-center gap-1.5">
                      <span>👤</span>
                      <span>{ws.instructor}</span>
                    </p>
                  )}
                  <p>📅 {formatDate(ws.starts_at)}</p>
                  {ws.location && <p>📍 {ws.location}</p>}
                </div>

                <SeatMeter
                  available={ws.available_seats}
                  capacity={ws.capacity}
                />

                <div className="flex gap-2 mt-4">
                  {ws.is_open_for_booking && !ws.is_full && (
                    <button
                      onClick={() => setBookingTarget(ws)}
                      className="flex-1 px-3 py-2 text-sm rounded-xl font-medium bg-primary hover:bg-primary-hover text-white transition-colors"
                    >
                      Book Seat
                    </button>
                  )}
                  {ws.is_open_for_booking && ws.is_full && (
                    <span className="flex-1 px-3 py-2 text-sm rounded-xl font-medium text-center bg-surface-hover text-muted cursor-not-allowed">
                      Full
                    </span>
                  )}
                  <Link
                    href={`/workshops/${ws.id}`}
                    className="px-3 py-2 text-sm rounded-xl border border-border hover:bg-surface-hover text-muted hover:text-foreground text-center transition-colors"
                  >
                    Details
                  </Link>
                  {hasRole("manager") && (
                    <button
                      onClick={() => {
                        setFormTarget(ws);
                        setFormMode("edit");
                      }}
                      className="px-3 py-2 text-sm rounded-xl border border-border hover:bg-surface-hover text-muted transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-surface-hover disabled:opacity-40 transition-colors"
              >
                ← Prev
              </button>
              <span className="text-sm text-muted">
                Page {meta.current_page} of {meta.last_page}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                disabled={page === meta.last_page}
                className="px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-surface-hover disabled:opacity-40 transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      <BookingModal
        workshop={bookingTarget}
        onClose={() => setBookingTarget(null)}
        onBooked={fetchWorkshops}
      />

      <WorkshopFormModal
        workshop={formTarget}
        mode={formMode}
        onClose={() => setFormMode(null)}
        onSaved={fetchWorkshops}
      />
    </div>
  );
}
