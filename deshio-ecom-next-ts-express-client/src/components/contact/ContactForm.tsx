"use client";

import { useState, FormEvent } from "react";
import { CheckCircle, Send } from "lucide-react";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);
    setSubmitted(true);
    setForm({ name: "", email: "", subject: "", message: "" });
  }

  return (
    <div className="rounded-2xl bg-white border border-stone-200 p-6 sm:p-10 shadow-2xs">
      <h2 className="font-serif text-2xl text-stone-900 mb-1">
        Send a Message
      </h2>
      <p className="text-xs sm:text-sm text-stone-500 mb-6 font-light">
        Fill out the form below and our client care specialists will get back to
        you shortly.
      </p>

      {submitted ? (
        <div className="py-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle className="w-7 h-7" />
          </div>
          <h3 className="font-serif text-2xl text-stone-900">
            Thank You for Reaching Out
          </h3>
          <p className="text-stone-500 text-sm max-w-sm mx-auto font-light">
            Your inquiry has been received by our studio concierge desk. We will
            reply within 12 business hours.
          </p>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="px-6 py-2.5 rounded-full border border-stone-300 text-xs font-semibold uppercase tracking-wider text-stone-800 hover:bg-stone-100 transition-colors"
          >
            Send Another Inquiry
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Farhana Karim"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:outline-stone-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:outline-stone-900 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
              Subject *
            </label>
            <input
              type="text"
              required
              placeholder="Sizing inquiry, order status, or exchange request"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:outline-stone-900 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
              Message *
            </label>
            <textarea
              rows={5}
              required
              placeholder="Share your garment question or order reference number..."
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:outline-stone-900 bg-white resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-stone-900 text-white text-xs font-semibold uppercase tracking-widest hover:bg-stone-800 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {submitting ? (
              <span>Sending Inquiry...</span>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Send Message</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
