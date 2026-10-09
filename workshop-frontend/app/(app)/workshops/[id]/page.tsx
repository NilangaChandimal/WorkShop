"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { getErrorMessage } from "@/lib/errors";
import type { Workshop, Registration, PaginatedResponse } from "@/lib/types";
import Badge from "@/components/Badge";
import SeatMeter from "@/components/SeatMeter";
import Spinner from "@/components/Spinner";
import EmptyState from "@/components/EmptyState";
import BookingModal from "@/components/BookingModal";
import WorkshopFormModal from "@/components/WorkshopFormModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";

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

export default function WorkshopDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { hasRole } = useAuth();
  const { toast } = useToast();

  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters for attendees
  const [attendeeSearch, setAttendeeSearch] = useState("");
  const [attendeeStatus, setAttendeeStatus] = useState("");

  // Modals
  const [bookingOpen, setBookingOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);

  // Cancellation state
  const [cancelTarget, setCancelTarget] = useState<Registration | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchWorkshop = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await api.get<{ data: Workshop }>(`/workshops/${id}`);
      setWorkshop(data.data ?? data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [id]);

  const fetchAttendees = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await api.get<PaginatedResponse<Registration>>(
        "/registrations",
        {
          params: {
            workshop_id: id,
            search: attendeeSearch || undefined,
            status: attendeeStatus || undefined,
            per_page: 50,
          },
        }
      );
      setRegistrations(data.data);
    } catch {
      // Handled in parent
    }
  }, [id, attendeeSearch, attendeeStatus]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError("");
    await Promise.all([fetchWorkshop(), fetchAttendees()]);
    setLoading(false);
  }, [fetchWorkshop, fetchAttendees]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const handleCancelRegistration = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await api.patch(`/registrations/${cancelTarget.id}/cancel`);
      toast("Registration cancelled successfully. Seat freed.", "success");
      setCancelTarget(null);
      refreshAll();
    } catch (err) {
      toast(getErrorMessage(err), "error");
    } finally {
      setCancelling(false);
    }
  };

  if (loading && !workshop) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error || !workshop) {
    return (
      <div>
        <div className="mb-4">
          <Link
            href="/dashboard"
            className="text-sm text-primary hover:underline flex items-center gap-1.5"
          >
            ← Back to workshops
          </Link>
        </div>
        <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm px-4 py-3 rounded-xl">
          {error || "Workshop not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/dashboard"
          className="text-sm text-muted hover:text-foreground flex items-center gap-1.5 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Workshops
        </Link>
      </div>

      {/* Workshop Header Card */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              {workshop.code && (
                <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary font-mono text-xs font-semibold">
                  {workshop.code}
                </span>
              )}
              <h1 className="text-2xl font-bold">{workshop.title}</h1>
              <Badge variant={statusVariant(workshop.status)}>
                {workshop.status}
              </Badge>
            </div>

            {workshop.description && (
              <p className="text-sm text-muted leading-relaxed whitespace-pre-line max-w-3xl">
                {workshop.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted pt-1">
              {workshop.instructor && (
                <span className="font-medium text-foreground flex items-center gap-1.5">
                  <span>👤</span>
                  <span>Instructor: {workshop.instructor}</span>
                </span>
              )}
              <span>📅 {formatDate(workshop.starts_at)} – {formatDate(workshop.ends_at)}</span>
              {workshop.location && <span>📍 {workshop.location}</span>}
            </div>
          </div>

          <div className="w-full md:w-72 bg-background border border-border rounded-xl p-4 space-y-4">
            <SeatMeter
              available={workshop.available_seats}
              capacity={workshop.capacity}
            />

            <div className="flex flex-col gap-2 pt-1">
              {workshop.is_open_for_booking && !workshop.is_full && (
                <button
                  onClick={() => setBookingOpen(true)}
                  className="w-full px-4 py-2 text-sm rounded-xl font-medium bg-primary hover:bg-primary-hover text-white shadow-sm shadow-primary/20 transition-colors"
                >
                  Book Seat
                </button>
              )}

              {workshop.is_open_for_booking && workshop.is_full && (
                <div className="w-full py-2 text-center text-xs font-semibold uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl">
                  Workshop Full (0 seats available)
                </div>
              )}

              {!workshop.is_open_for_booking && (
                <div className="w-full py-2 text-center text-xs text-muted bg-surface-hover rounded-xl">
                  Booking Closed ({workshop.status})
                </div>
              )}

              {hasRole("manager") && (
                <button
                  onClick={() => setFormMode("edit")}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-border hover:bg-surface-hover text-muted hover:text-foreground transition-colors"
                >
                  Edit Workshop
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Attendees Section */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold">Attendees</h2>
            <p className="text-xs text-muted">
              {workshop.active_registrations_count} active attendee{workshop.active_registrations_count === 1 ? "" : "s"} of {workshop.capacity} maximum seats
            </p>
          </div>

          {/* Attendee search/filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              placeholder="Search attendee…"
              value={attendeeSearch}
              onChange={(e) => setAttendeeSearch(e.target.value)}
              className="px-3 py-1.5 bg-background border border-border rounded-xl text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
            <select
              value={attendeeStatus}
              onChange={(e) => setAttendeeStatus(e.target.value)}
              className="px-3 py-1.5 bg-background border border-border rounded-xl text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="cancelled">Cancelled</option>
            </select>
            {(attendeeSearch || attendeeStatus) && (
              <button
                type="button"
                onClick={() => {
                  setAttendeeSearch("");
                  setAttendeeStatus("");
                }}
                className="px-2.5 py-1.5 rounded-xl border border-border hover:bg-surface-hover text-xs text-muted hover:text-foreground transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {registrations.length === 0 ? (
          <EmptyState
            title="No attendees registered"
            message="No attendees match your search or have signed up for this workshop yet."
          />
        ) : (
          <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-hover/50 border-b border-border text-xs uppercase text-muted tracking-wider">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Attendee</th>
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
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <BookingModal
        workshop={bookingOpen ? workshop : null}
        onClose={() => setBookingOpen(false)}
        onBooked={refreshAll}
      />

      {/* Workshop Edit Modal */}
      <WorkshopFormModal
        workshop={workshop}
        mode={formMode}
        onClose={() => setFormMode(null)}
        onSaved={refreshAll}
      />

      {/* Cancel Confirmation */}
      <ConfirmDialog
        open={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelRegistration}
        loading={cancelling}
        title="Cancel Registration"
        message={`Are you sure you want to cancel the registration for "${cancelTarget?.attendee_name}"? This will immediately free up 1 seat.`}
        confirmText="Yes, Cancel Booking"
        variant="danger"
      />
    </div>
  );
}
