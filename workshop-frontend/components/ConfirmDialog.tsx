"use client";

import Modal from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  variant = "danger",
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-md">
      <p className="text-slate-600 text-sm mb-6 leading-relaxed">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 text-sm rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`px-4 py-2 text-sm rounded-xl font-medium text-white transition-colors disabled:opacity-50 shadow-sm ${
            variant === "danger"
              ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
              : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20"
          }`}
        >
          {loading ? "Please wait…" : confirmText}
        </button>
      </div>
    </Modal>
  );
}
