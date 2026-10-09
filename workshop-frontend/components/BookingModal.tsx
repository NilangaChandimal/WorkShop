"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import Spinner from "@/components/Spinner";
import { useToast } from "@/components/Toast";
import api from "@/lib/api";
import { getErrorMessage, getErrorCode } from "@/lib/errors";
import type { Workshop } from "@/lib/types";

interface BookingModalProps {
  workshop: Workshop | null;
  onClose: () => void;
  onBooked: () => void;
}

export default function BookingModal({
  workshop,
  onClose,
  onBooked,
}: BookingModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function reset() {
    setName("");
    setEmail("");
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!workshop) return;
    setError("");
    setLoading(true);

    try {
      await api.post(`/workshops/${workshop.id}/registrations`, {
        attendee_name: name.trim(),
        attendee_email: email.trim(),
      });
      toast("Registration successful!", "success");
      reset();
      onBooked();
      onClose();
    } catch (err) {
      const code = getErrorCode(err);
      if (code === "capacity_exceeded") {
        setError(
          "Sorry, this workshop just filled up. The last seat was taken by someone else."
        );
      } else if (code === "duplicate_registration") {
        setError("This attendee is already registered for this workshop.");
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={!!workshop}
      onClose={() => {
        reset();
        onClose();
      }}
      title={`Book a Seat — ${workshop?.title ?? ""}`}
    >
      {error && (
        <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="bk-name" className="block text-sm font-medium text-slate-700 mb-1">
            Attendee Name
          </label>
          <input
            id="bk-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
            placeholder="John Smith"
          />
        </div>
        <div>
          <label htmlFor="bk-email" className="block text-sm font-medium text-slate-700 mb-1">
            Attendee Email
          </label>
          <input
            id="bk-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
            placeholder="john@example.com"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
            className="px-4 py-2 text-sm rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 text-sm rounded-xl font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 transition-colors disabled:opacity-60"
          >
            {loading && <Spinner className="h-4 w-4 text-white" />}
            {loading ? "Booking…" : "Book Seat"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
