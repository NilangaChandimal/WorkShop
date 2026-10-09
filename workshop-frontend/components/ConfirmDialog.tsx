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
      <p className="text-muted text-sm mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 text-sm rounded-xl border border-border hover:bg-surface-hover transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`px-4 py-2 text-sm rounded-xl font-medium text-white transition-colors disabled:opacity-50 ${
            variant === "danger"
              ? "bg-danger hover:bg-danger-hover"
              : "bg-primary hover:bg-primary-hover"
          }`}
        >
          {loading ? "Please wait…" : confirmText}
        </button>
      </div>
    </Modal>
  );
}
