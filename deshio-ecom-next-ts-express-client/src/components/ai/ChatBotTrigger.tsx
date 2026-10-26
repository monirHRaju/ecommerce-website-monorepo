"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Sparkles, MessageCircle, X } from "lucide-react";

// Lazy-load the chatbot component only on client demand
const ChatBot = dynamic(() => import("./ChatBot"), {
  ssr: false,
  loading: () => null,
});

export default function ChatBotTrigger() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const toggle = () => {
    if (!hasInteracted) setHasInteracted(true);
    setIsOpen((prev) => !prev);
  };

  return (
    <>
      {/* Dynamic ChatBot Panel mounted only after user interaction */}
      {hasInteracted && isOpen && <ChatBot onClose={() => setIsOpen(false)} />}

      {/* Floating Concierge Action Button */}
      <div className="fixed bottom-6 left-6 z-40">
        <button
          onClick={toggle}
          aria-label={isOpen ? "Close fashion concierge" : "Open fashion concierge"}
          className={`group flex items-center gap-2.5 px-4 py-3 rounded-full shadow-xl transition-all duration-300 ${
            isOpen
              ? "bg-stone-800 text-white"
              : "bg-stone-900 text-white hover:bg-stone-800 hover:scale-105"
          }`}
        >
          {isOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <>
              <div className="relative">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              </div>
              <span className="text-xs font-semibold tracking-wide hidden sm:inline">
                Style Concierge
              </span>
            </>
          )}
        </button>
      </div>
    </>
  );
}
