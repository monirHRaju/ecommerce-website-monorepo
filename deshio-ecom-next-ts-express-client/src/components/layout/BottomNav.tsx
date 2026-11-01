"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Search, Store, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export const OPEN_SEARCH_EVENT = "deshio:open-search";

/** Pages where the bar would get in the way (checkout needs the full screen). */
const HIDDEN_ON = ["/checkout"];

/**
 * App-style bottom tab bar, mobile only.
 * Home · Shop · Categories · Search · Account
 */
export default function BottomNav() {
  const pathname = usePathname() || "/";
  const { user } = useAuth();

  if (HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;

  const isActive = (match: (p: string) => boolean) => match(pathname);

  const accountHref = user ? "/dashboard/profile" : "/login";

  const items = [
    {
      label: "Home",
      href: "/",
      icon: Home,
      active: isActive((p) => p === "/"),
    },
    {
      label: "Shop",
      href: "/products",
      icon: Store,
      active: isActive((p) => p === "/products" || p.startsWith("/products/")),
    },
    {
      label: "Categories",
      href: "/categories",
      icon: LayoutGrid,
      active: isActive((p) => p === "/categories" || p.startsWith("/category/")),
    },
  ];

  const baseItem =
    "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium uppercase tracking-wide transition-colors";

  return (
    <nav
      aria-label="Primary"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-stone-200 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-5">
        {items.map(({ label, href, icon: Icon, active }) => (
          <li key={label}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={`${baseItem} ${active ? "text-stone-900" : "text-stone-500"}`}
            >
              <Icon className="w-[22px] h-[22px]" strokeWidth={active ? 2.4 : 1.8} />
              <span>{label}</span>
            </Link>
          </li>
        ))}

        <li>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))}
            className={`${baseItem} w-full text-stone-500`}
          >
            <Search className="w-[22px] h-[22px]" strokeWidth={1.8} />
            <span>Search</span>
          </button>
        </li>

        <li>
          <Link
            href={accountHref}
            aria-current={
              isActive((p) => p.startsWith("/dashboard") || p === "/login" || p === "/register")
                ? "page"
                : undefined
            }
            className={`${baseItem} ${
              isActive((p) => p.startsWith("/dashboard") || p === "/login" || p === "/register")
                ? "text-stone-900"
                : "text-stone-500"
            }`}
          >
            <User className="w-[22px] h-[22px]" strokeWidth={1.8} />
            <span>Account</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
