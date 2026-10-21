"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function ForbiddenPage() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-error-50 dark:bg-error-500/10 flex items-center justify-center mx-auto mb-6">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              stroke="#ef4444"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Text */}
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-3">
          Access Denied
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
          This dashboard is restricted to administrator accounts only. Your
          account does not have the required permissions.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={logout}
            className="px-6 py-3 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
          >
            Sign in with another account
          </button>
          <Link
            href="http://localhost:3000"
            className="px-6 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Go to Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
