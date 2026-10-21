"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Placed on the signin page — if admin is already logged in, redirect to dashboard.
 */
export default function AuthRedirect() {
  const { admin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && admin) {
      router.replace("/");
    }
  }, [admin, isLoading, router]);

  return null;
}
