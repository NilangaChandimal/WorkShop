"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ToastProvider } from "@/components/Toast";
import Spinner from "@/components/Spinner";

function Navbar() {
  const { user, logout, hasRole } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;

  const links = [
    ...(hasRole("manager", "staff")
      ? [
          { href: "/dashboard", label: "Workshops" },
          { href: "/history", label: "History" },
        ]
      : []),
    ...(hasRole("admin")
      ? [{ href: "/admin/users", label: "Users" }]
      : []),
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 font-semibold text-sm">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="hidden sm:inline">Workshop Reg</span>
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isActive(link.href)
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted hover:text-foreground hover:bg-surface-hover"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium capitalize">
              {user.role}
            </span>
            <span className="text-muted">{user.name}</span>
          </div>
          <button
            onClick={logout}
            className="hidden sm:inline-flex px-3 py-1.5 text-sm text-muted hover:text-foreground hover:bg-surface-hover rounded-lg transition-colors"
          >
            Sign out
          </button>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden p-1.5 rounded-lg hover:bg-surface-hover text-muted"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-border bg-surface px-4 py-3 space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm ${
                isActive(link.href)
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted hover:bg-surface-hover"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted">{user.name} ({user.role})</span>
            <button onClick={logout} className="text-sm text-danger hover:text-danger-hover">
              Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return <>{children}</>;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <AuthGate>
          <Navbar />
          <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6">
            {children}
          </main>
        </AuthGate>
      </ToastProvider>
    </AuthProvider>
  );
}
