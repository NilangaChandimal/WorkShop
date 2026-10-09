"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import type { User, PaginatedResponse } from "@/lib/types";
import Badge from "@/components/Badge";
import Spinner from "@/components/Spinner";
import EmptyState from "@/components/EmptyState";
import UserFormModal from "@/components/UserFormModal";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const roleBadgeVariant = (role: string) => {
  if (role === "admin") return "warning";
  if (role === "manager") return "info";
  return "default";
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<User>["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);

  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get<PaginatedResponse<User>>("/users", {
        params: {
          search: search || undefined,
          role: roleFilter || undefined,
          page,
          per_page: 15,
        },
      });
      setUsers(data.data);
      setMeta(data.meta);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const hasActiveFilters = Boolean(searchInput || roleFilter);

  const handleResetFilters = () => {
    setSearch("");
    setSearchInput("");
    setRoleFilter("");
    setPage(1);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold">User Management</h1>
          <p className="text-sm text-muted mt-0.5">
            Manage system users, role-based access, and login statuses.
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
          <button
            onClick={() => {
              setSelectedUser(null);
              setFormMode("create");
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl font-medium bg-primary hover:bg-primary-hover text-white shadow-sm shadow-primary/20 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface border border-border rounded-2xl p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            placeholder="Search by name or email…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="px-3.5 py-2 bg-background border border-border rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2 bg-background border border-border rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="staff">Staff</option>
          </select>
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
      ) : users.length === 0 ? (
        <EmptyState
          title="No users found"
          message="No users match your filter criteria or search query."
        />
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-hover/50 border-b border-border text-xs uppercase text-muted tracking-wider">
                <tr>
                  <th className="px-5 py-3 font-semibold">User</th>
                  <th className="px-5 py-3 font-semibold">Role</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Created</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-hover/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-foreground">{u.name}</div>
                      <div className="text-xs text-muted">{u.email}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={roleBadgeVariant(u.role)}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={u.is_active ? "success" : "danger"}>
                        {u.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted">
                      {formatDate(u.created_at)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setFormMode("edit");
                        }}
                        className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-surface-hover text-muted hover:text-foreground transition-colors"
                      >
                        Edit
                      </button>
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
                Showing {meta.from ?? 0} to {meta.to ?? 0} of {meta.total} users
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

      <UserFormModal
        user={selectedUser}
        mode={formMode}
        onClose={() => setFormMode(null)}
        onSaved={fetchUsers}
      />
    </div>
  );
}
