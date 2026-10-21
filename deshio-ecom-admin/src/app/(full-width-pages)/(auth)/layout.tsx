import GridShape from "@/components/common/GridShape";
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";
import { ThemeProvider } from "@/context/ThemeContext";
import React from "react";
import { Toaster } from "react-hot-toast";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <ThemeProvider>
        <Toaster position="top-right" />
        <div className="relative flex lg:flex-row w-full h-screen justify-center flex-col dark:bg-gray-900 sm:p-0">
          {children}

          {/* Right panel — Deshio branding */}
          <div className="lg:w-1/2 w-full h-full bg-brand-950 dark:bg-white/5 lg:grid items-center hidden">
            <div className="relative items-center justify-center flex z-1">
              <GridShape />
              <div className="flex flex-col items-center max-w-xs text-center">
                {/* Logo */}
                <img src="/deshio_logo.svg" alt="Deshio Admin" className="h-20 mb-6" />
                <p className="text-gray-400 dark:text-white/60 text-sm leading-relaxed">
                  Manage your products, orders, customers, and analytics — all
                  in one powerful dashboard.
                </p>

                {/* Feature bullets */}
                <ul className="mt-8 space-y-3 text-left w-full">
                  {[
                    "Full product & category management",
                    "Real-time order tracking & status updates",
                    "Customer & review moderation",
                    "AI-powered product descriptions",
                  ].map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-3 text-sm text-gray-400"
                    >
                      <span className="w-5 h-5 rounded-full bg-brand-500/20 flex items-center justify-center shrink-0">
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 12 12"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M2 6l3 3 5-5"
                            stroke="#3b82f6"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
            <ThemeTogglerTwo />
          </div>
        </div>
      </ThemeProvider>
    </div>
  );
}
