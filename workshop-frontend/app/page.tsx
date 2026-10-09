"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth";
import Spinner from "@/components/Spinner";

function RedirectHome() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
    } else if (user.role === "admin") {
      router.replace("/admin/users");
    } else {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

export default function HomePage() {
  return (
    <AuthProvider>
      <RedirectHome />
    </AuthProvider>
  );
}
