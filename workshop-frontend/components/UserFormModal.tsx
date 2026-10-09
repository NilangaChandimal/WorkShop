"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import type { User } from "@/lib/types";
import Modal from "./Modal";
import { useToast } from "./Toast";

interface UserFormModalProps {
  user: User | null;
  mode: "create" | "edit" | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function UserFormModal({
  user,
  mode,
  onClose,
  onSaved,
}: UserFormModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "manager" | "staff">("staff");
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (mode === "edit" && user) {
      setName(user.name);
      setEmail(user.email);
      setPassword("");
      setRole(user.role);
      setIsActive(user.is_active);
      setError("");
    } else if (mode === "create") {
      setName("");
      setEmail("");
      setPassword("");
      setRole("staff");
      setIsActive(true);
      setError("");
    }
  }, [mode, user]);

  if (!mode) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "create") {
        await api.post("/users", {
          name,
          email,
          password,
          role,
          is_active: isActive,
        });
        toast("User created successfully", "success");
      } else if (user) {
        const payload: Record<string, unknown> = {
          name,
          email,
          role,
          is_active: isActive,
        };
        if (password) {
          payload.password = password;
        }
        await api.put(`/users/${user.id}`, payload);
        toast("User updated successfully", "success");
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={mode !== null}
      onClose={onClose}
      title={mode === "create" ? "Create New User" : `Edit User: ${user?.name}`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3.5 py-2.5 rounded-xl">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
            className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            {mode === "create" ? "Password * (min 8 chars)" : "New Password (leave blank to keep current)"}
          </label>
          <input
            type="password"
            required={mode === "create"}
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "create" ? "••••••••" : "Leave blank to keep"}
            className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Role *
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "admin" | "manager" | "staff")}
            className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="staff">Staff (View workshops & register attendees)</option>
            <option value="manager">Manager (Create/manage workshops & bookings)</option>
            <option value="admin">Admin (User & role administration)</option>
          </select>
        </div>

        <div className="pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
            />
            <span>Active Account (can log in)</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-sm rounded-xl font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 transition-colors disabled:opacity-50"
          >
            {loading ? "Saving…" : mode === "create" ? "Create User" : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
