"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import api from "@/lib/api";
import type { User } from "@/types";

interface AuthContextValue {
  admin: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateAdmin: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, restore session from cookie
  useEffect(() => {
    const savedToken = Cookies.get("admin_token");
    if (savedToken) {
      setToken(savedToken);
      api
        .get<{ data: User }>("/users/me")
        .then((res) => {
          const user = res.data.data;
          if (user.role === "admin" || user.role === "super-admin") {
            setAdmin(user);
          } else {
            // Not an admin — clear session
            Cookies.remove("admin_token");
            setToken(null);
          }
        })
        .catch(() => {
          Cookies.remove("admin_token");
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  async function login(email: string, password: string) {
    const res = await api.post<{
      data: { accessToken: string; refreshToken: string; user: User };
    }>("/auth/login", { email, password });
    const { accessToken, user } = res.data.data;

    if (user.role !== "admin" && user.role !== "super-admin") {
      throw new Error("Access denied. Admin accounts only.");
    }

    Cookies.set("admin_token", accessToken, { expires: 7 });
    setToken(accessToken);
    setAdmin(user);
  }

  function updateAdmin(user: User) {
    setAdmin(user);
  }

  function logout() {
    Cookies.remove("admin_token");
    setToken(null);
    setAdmin(null);
    window.location.href = "/signin";
  }

  return (
    <AuthContext.Provider value={{ admin, token, isLoading, login, logout, updateAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
