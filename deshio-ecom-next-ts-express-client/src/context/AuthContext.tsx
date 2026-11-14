"use client";

import api from "@/lib/axios";
import { User } from "@/types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const token = localStorage.getItem("accessToken");
      const savedUser = localStorage.getItem("user");
      if (token && savedUser) {
        try {
          setAccessToken(token);
          setUser(JSON.parse(savedUser));
        } catch {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
        }
      }
    } catch {
      // ignore storage errors in restricted webviews
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(
    (accessToken: string, refreshToken: string, user: User) => {
      try {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("user", JSON.stringify(user));
      } catch {
        // ignore storage errors
      }
      setAccessToken(accessToken);
      setUser(user);
    },
    []
  );

  const logout = useCallback(() => {
    try {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    } catch {
      // ignore storage errors
    }
    setAccessToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    try {
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch {
      // ignore storage errors
    }
    setUser(updatedUser);
  }, []);

  // Silently refresh profile on load if token exists
  useEffect(() => {
    if (!accessToken) return;
    api
      .get("/users/me")
      .then((res) => {
        const freshUser = res.data.data;
        setUser(freshUser);
        try {
          localStorage.setItem("user", JSON.stringify(freshUser));
        } catch {
          // ignore storage errors
        }
      })
      .catch(() => {});
  }, [accessToken]);

  return (
    <AuthContext.Provider
      value={{ user, accessToken, isLoading, login, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
