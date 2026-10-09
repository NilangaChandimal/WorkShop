"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@/lib/types";

export default function ForbiddenPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const stored =
        localStorage.getItem("user") || localStorage.getItem("auth_user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  function handleSignOut() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    localStorage.removeItem("auth_user");
    window.location.href = "/login";
  }

  const role = user?.role;
  const isRoleAdmin = role === "admin";
  const defaultHref = isRoleAdmin ? "/admin/users" : "/dashboard";
  const defaultLabel = isRoleAdmin
    ? "Go to User Management"
    : "Go to Workshops";

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-100 via-rose-50/40 to-slate-200 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-rose-300/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-300/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-900/5 border border-slate-200/80 p-8 sm:p-10 relative z-10 text-center">
        {/* Warning Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shadow-sm">
            <svg
              className="w-8 h-8 text-rose-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.002A11.959 11.959 0 0112 2.714z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100/70 text-rose-700 text-xs font-semibold mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
          403 Forbidden
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Access Restricted
        </h1>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          You don&apos;t have permission to access this resource or perform this
          action. Your account role does not have the necessary privileges.
        </p>

        {user && (
          <div className="mt-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-center justify-between">
            <div className="text-left">
              <span className="block font-medium text-slate-800">
                {user.name}
              </span>
              <span className="text-slate-400">{user.email}</span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-semibold uppercase text-[10px] tracking-wide">
              {user.role}
            </span>
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link
            href={defaultHref}
            className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-sm shadow-indigo-600/20 transition-colors"
          >
            {defaultLabel}
          </Link>
          <button
            onClick={handleSignOut}
            className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-medium transition-colors"
          >
            Sign out
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-xs text-slate-400">
            If you believe this is an error, please contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
