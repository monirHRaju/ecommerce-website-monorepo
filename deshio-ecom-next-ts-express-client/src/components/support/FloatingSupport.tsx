"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { MessageCircle, X } from "lucide-react";

interface FloatingSupportProps {
  whatsapp?: string;
  messenger?: string;
  enabled?: boolean;
}

export function formatWhatsAppUrl(input?: string): string {
  if (!input) return "https://wa.me/8801700000000";
  const trimmed = input.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "https://wa.me/8801700000000";
  if (digits.length === 11 && digits.startsWith("01")) {
    return `https://wa.me/88${digits}`;
  }
  return `https://wa.me/${digits}`;
}

export function formatMessengerUrl(input?: string): string {
  if (!input) return "https://m.me/deshio";
  const trimmed = input.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const clean = trimmed.replace(/^[@/]+/, "").replace(/^m\.me\//i, "");
  return `https://m.me/${clean}`;
}

export default function FloatingSupport({
  whatsapp,
  messenger,
  enabled = true,
}: FloatingSupportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const whatsappUrl = useMemo(() => formatWhatsAppUrl(whatsapp), [whatsapp]);
  const messengerUrl = useMemo(
    () => formatMessengerUrl(messenger),
    [messenger]
  );

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (!enabled) return null;

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 280);
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end"
      aria-label="Direct Customer Support"
    >
      {/* ── Social Action Options Popover ─────────────────────────────────── */}
      <div
        className={`flex flex-col items-end gap-3 mb-3 transition-all duration-300 origin-bottom-right ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 translate-y-4 pointer-events-none"
        }`}
      >
        {/* WhatsApp Option */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with Deshio on WhatsApp"
          className="group flex items-center gap-3 pr-1 pl-3.5 py-1.5 rounded-full bg-white text-stone-900 border border-stone-200/90 shadow-xl hover:border-emerald-500 hover:shadow-2xl transition-all duration-200"
        >
          <div className="flex flex-col items-end text-right">
            <span className="text-xs font-semibold text-stone-900 group-hover:text-emerald-600 transition-colors">
              WhatsApp
            </span>
            <span className="text-[10px] text-stone-400 font-light -mt-0.5">
              Direct live chat
            </span>
          </div>

          <div className="w-11 h-11 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-md group-hover:scale-108 transition-transform duration-200">
            <svg
              className="w-6 h-6 fill-current"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
            </svg>
          </div>
        </a>

        {/* Messenger Option */}
        <a
          href={messengerUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with Deshio on Facebook Messenger"
          className="group flex items-center gap-3 pr-1 pl-3.5 py-1.5 rounded-full bg-white text-stone-900 border border-stone-200/90 shadow-xl hover:border-blue-500 hover:shadow-2xl transition-all duration-200"
        >
          <div className="flex flex-col items-end text-right">
            <span className="text-xs font-semibold text-stone-900 group-hover:text-blue-600 transition-colors">
              Messenger
            </span>
            <span className="text-[10px] text-stone-400 font-light -mt-0.5">
              Facebook chat
            </span>
          </div>

          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#0084FF] to-[#00B2FF] text-white flex items-center justify-center shadow-md group-hover:scale-108 transition-transform duration-200">
            <svg
              className="w-6 h-6 fill-current"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.093.304 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26 6.559-6.963 3.13 3.259 5.889-3.259-6.56 6.963z" />
            </svg>
          </div>
        </a>
      </div>

      {/* ── Main Floating Support Trigger Button ──────────────────────────── */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label={
          isOpen
            ? "Close direct customer support options"
            : "Open direct customer support (WhatsApp & Messenger)"
        }
        className={`group relative flex items-center gap-2.5 px-4 py-3 rounded-full shadow-2xl transition-all duration-300 cursor-pointer ${
          isOpen
            ? "bg-stone-800 text-white rotate-0"
            : "bg-stone-900 text-white hover:bg-stone-800 hover:scale-105"
        }`}
      >
        {isOpen ? (
          <X className="w-5 h-5 text-stone-300" />
        ) : (
          <>
            <div className="relative">
              <MessageCircle className="w-5 h-5 text-amber-300" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-stone-900 animate-pulse" />
            </div>
            <span className="text-xs font-semibold tracking-wide">
              Support
            </span>
          </>
        )}
      </button>
    </div>
  );
}
