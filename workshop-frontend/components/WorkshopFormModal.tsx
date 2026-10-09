"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import Spinner from "@/components/Spinner";
import { useToast } from "@/components/Toast";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import type { Workshop } from "@/lib/types";

interface WorkshopFormModalProps {
  workshop: Workshop | null;
  mode: "create" | "edit" | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function WorkshopFormModal({
  workshop,
  mode,
  onClose,
  onSaved,
}: WorkshopFormModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [instructor, setInstructor] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [capacity, setCapacity] = useState("");

  useEffect(() => {
    if (mode === "edit" && workshop) {
      setCode(workshop.code ?? "");
      setTitle(workshop.title);
      setInstructor(workshop.instructor ?? "");
      setDescription(workshop.description ?? "");
      setLocation(workshop.location ?? "");
      setStartsAt(workshop.starts_at.slice(0, 16));
      setEndsAt(workshop.ends_at.slice(0, 16));
      setCapacity(String(workshop.capacity));
    } else if (mode === "create") {
      setCode("");
      setTitle("");
      setInstructor("");
      setDescription("");
      setLocation("");
      setStartsAt("");
      setEndsAt("");
      setCapacity("");
    }
    setError("");
  }, [mode, workshop]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = {
      code: code.trim() || null,
      title: title.trim(),
      instructor: instructor.trim() || null,
      description: description.trim() || null,
      location: location.trim() || null,
      starts_at: startsAt,
      ends_at: endsAt,
      capacity: Number(capacity),
    };

    try {
      if (mode === "edit" && workshop) {
        await api.put(`/workshops/${workshop.id}`, payload);
        toast("Workshop updated.", "success");
      } else {
        await api.post("/workshops", payload);
        toast("Workshop created.", "success");
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={mode !== null}
      onClose={onClose}
      title={mode === "edit" ? "Edit Workshop" : "Create Workshop"}
      maxWidth="max-w-xl"
    >
      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="ws-code" className="block text-xs font-medium text-muted mb-1">
              Workshop Code
            </label>
            <input
              id="ws-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3.5 py-2 bg-background border border-border rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              placeholder="e.g. WS-101"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="ws-instructor" className="block text-xs font-medium text-muted mb-1">
              Instructor / Trainer
            </label>
            <input
              id="ws-instructor"
              value={instructor}
              onChange={(e) => setInstructor(e.target.value)}
              className="w-full px-3.5 py-2 bg-background border border-border rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              placeholder="e.g. Dr. Alan Turing"
            />
          </div>
        </div>

        <div>
          <label htmlFor="ws-title" className="block text-xs font-medium text-muted mb-1">
            Workshop Title *
          </label>
          <input
            id="ws-title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2 bg-background border border-border rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            placeholder="e.g. Excel for Beginners"
          />
        </div>

        <div>
          <label htmlFor="ws-desc" className="block text-xs font-medium text-muted mb-1">
            Description <span className="font-normal">(optional)</span>
          </label>
          <textarea
            id="ws-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide an overview of the workshop curriculum..."
            className="w-full px-3.5 py-2 bg-background border border-border rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary resize-none outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="ws-loc" className="block text-xs font-medium text-muted mb-1">
              Location
            </label>
            <input
              id="ws-loc"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3.5 py-2 bg-background border border-border rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              placeholder="Room A or Online"
            />
          </div>
          <div>
            <label htmlFor="ws-cap" className="block text-xs font-medium text-muted mb-1">
              Seat Capacity *
            </label>
            <input
              id="ws-cap"
              type="number"
              min={1}
              max={1000}
              required
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-full px-3.5 py-2 bg-background border border-border rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="ws-start"
              className="block text-xs font-medium text-muted mb-1"
            >
              Starts at *
            </label>
            <input
              id="ws-start"
              type="datetime-local"
              required
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="w-full px-3.5 py-2 bg-background border border-border rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label htmlFor="ws-end" className="block text-xs font-medium text-muted mb-1">
              Ends at *
            </label>
            <input
              id="ws-end"
              type="datetime-local"
              required
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="w-full px-3.5 py-2 bg-background border border-border rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-xl border border-border hover:bg-surface-hover transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 text-sm rounded-xl font-medium bg-primary hover:bg-primary-hover text-white shadow-sm shadow-primary/20 transition-colors disabled:opacity-60"
          >
            {loading && <Spinner className="h-4 w-4" />}
            {mode === "edit" ? "Update Workshop" : "Create Workshop"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
