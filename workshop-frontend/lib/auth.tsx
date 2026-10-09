"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import api from "./api";
import type { User } from "./types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  hasRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post("/login", { email, password });
      const newToken = data.token;
      const newUser: User = data.user.data ?? data.user;

      localStorage.setItem("auth_token", newToken);
      localStorage.setItem("auth_user", JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);

      if (newUser.role === "admin") {
        router.push("/admin/users");
      } else {
        router.push("/dashboard");
      }

      return newUser;
    },
    [router]
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/logout");
    } catch {
      // ignore
    }
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setToken(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  const hasRole = useCallback(
    (...roles: string[]) => !!user && roles.includes(user.role),
    [user]
  );

  const value = useMemo(
    () => ({ user, token, isLoading, login, logout, hasRole }),
    [user, token, isLoading, login, logout, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
