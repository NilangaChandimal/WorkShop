"use client";

import { useRouter } from "next/navigation";
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
  const { user, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role === "admin") {
      router.replace("/403");
    }
  }, [user, router]);

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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Workshops</h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse and register attendees for upcoming workshops.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl font-medium border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
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
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 transition-colors"
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
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <input
            placeholder="Search code, title, instructor…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
          />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
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
            className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
          />
          <label className="flex items-center gap-2 px-3 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={hasSeats}
              onChange={(e) => {
                setHasSeats(e.target.checked);
                setPage(1);
              }}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
            />
            Seats available
          </label>
          <button
            type="button"
            onClick={handleResetFilters}
            disabled={!hasActiveFilters}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
        <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8 text-indigo-600" />
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
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      {ws.code && (
                        <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono text-[11px] font-semibold mb-1">
                          {ws.code}
                        </span>
                      )}
                      <Link
                        href={`/workshops/${ws.id}`}
                        className="block font-semibold text-sm leading-snug text-slate-900 hover:text-indigo-600 transition-colors"
                      >
                        {ws.title}
                      </Link>
                    </div>
                    <Badge variant={statusVariant(ws.status)}>
                      {ws.status}
                    </Badge>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1 mb-4">
                    {ws.instructor && (
                      <p className="text-slate-700 font-medium flex items-center gap-1.5">
                        <span>👤</span>
                        <span>{ws.instructor}</span>
                      </p>
                    )}
                    <p>📅 {formatDate(ws.starts_at)}</p>
                    {ws.location && <p>📍 {ws.location}</p>}
                  </div>
                </div>

                <div>
                  <SeatMeter
                    available={ws.available_seats}
                    capacity={ws.capacity}
                  />

                  <div className="flex gap-2 mt-4 pt-2 border-t border-slate-100">
                    {ws.is_open_for_booking && !ws.is_full && (
                      <button
                        onClick={() => setBookingTarget(ws)}
                        className="flex-1 px-3 py-2 text-sm rounded-xl font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
                      >
                        Book Seat
                      </button>
                    )}
                    {ws.is_open_for_booking && ws.is_full && (
                      <span className="flex-1 px-3 py-2 text-sm rounded-xl font-medium text-center bg-slate-100 text-slate-400 cursor-not-allowed">
                        Full
                      </span>
                    )}
                    <Link
                      href={`/workshops/${ws.id}`}
                      className="px-3 py-2 text-sm rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-center transition-colors"
                    >
                      Details
                    </Link>
                    {hasRole("manager") && (
                      <button
                        onClick={() => {
                          setFormTarget(ws);
                          setFormMode("edit");
                        }}
                        className="px-3 py-2 text-sm rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
                      >
                        Edit
                      </button>
                    )}
                  </div>
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
                className="px-3.5 py-1.5 text-sm rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 transition-colors shadow-xs"
              >
                ← Prev
              </button>
              <span className="text-sm text-slate-500 font-medium px-2">
                Page {meta.current_page} of {meta.last_page}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                disabled={page === meta.last_page}
                className="px-3.5 py-1.5 text-sm rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 transition-colors shadow-xs"
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
        onBooked={() => {
          setBookingTarget(null);
          fetchWorkshops();
        }}
      />

      <WorkshopFormModal
        mode={formMode}
        workshop={formTarget}
        onClose={() => {
          setFormMode(null);
          setFormTarget(null);
        }}
        onSaved={() => {
          setFormMode(null);
          setFormTarget(null);
          fetchWorkshops();
        }}
      />
    </div>
  );
}
