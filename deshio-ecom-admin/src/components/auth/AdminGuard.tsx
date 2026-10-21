"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Placed in the (admin) layout — redirects to /signin if not authenticated,
 * or to /forbidden if authenticated but not an admin.
 */
export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { admin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!admin) {
      router.replace("/signin");
    }
  }, [admin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading admin panel…</p>
        </div>
      </div>
    );
  }

  if (!admin) return null;

  return <>{children}</>;
}
