"use client";

import React, { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { toast } from "@/context/ToastContext";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    setSubscribed(true);
    toast.success("Welcome to our VIP newsletter!");
    setEmail("");
  };

  if (subscribed) {
    return (
      <div className="flex items-center gap-2 text-sm text-stone-700 bg-stone-100 px-3.5 py-2.5 rounded-lg border border-stone-200">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>Thank you for subscribing to new collections.</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
        className="flex-1 min-w-0 px-3.5 py-2 text-sm rounded-lg border border-stone-300 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900"
      />
      <button
        type="submit"
        aria-label="Subscribe"
        className="px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors shrink-0"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
}
