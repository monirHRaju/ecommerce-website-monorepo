"use client";

import { useState, FormEvent } from "react";
import {
  CheckCircle,
  Clock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
} from "lucide-react";

const infoCards = [
  {
    icon: Mail,
    label: "Concierge Email",
    value: "care@deshio.com",
    sub: "Responses within 12 business hours",
  },
  {
    icon: Phone,
    label: "Studio Helpline",
    value: "+880 1700-000000",
    sub: "Sat – Thu, 10:00 AM – 8:00 PM BST",
  },
  {
    icon: MapPin,
    label: "Flagship Atelier",
    value: "Road 11, Banani",
    sub: "Dhaka 1213, Bangladesh",
  },
  {
    icon: Clock,
    label: "Showroom Hours",
    value: "11:00 AM – 9:00 PM",
    sub: "Open 7 days a week",
  },
];

const faqs = [
  {
    q: "How long does delivery take inside and outside Dhaka?",
    a: "Orders inside Dhaka arrive within 24–48 hours. Nationwide courier deliveries across all 64 districts take 3–5 business days.",
  },
  {
    q: "Can I exchange a garment if the size doesn't fit?",
    a: "Yes! We offer a hassle-free 7-day size exchange on all unworn garments with original tags attached.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept Cash on Delivery (COD) nationwide as well as Mobile Banking (bKash, Nagad, and Rocket).",
  },
  {
    q: "How can I be sure of my Panjabi or Kurti measurements?",
    a: "Every product page includes an interactive Size Guide with chest, shoulder, and garment length measurements in inches.",
  },
];

export default function ContactPage() {
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
    <div className="min-h-screen bg-stone-50/30">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-stone-200 py-14 sm:py-20 px-4 sm:px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-semibold uppercase tracking-widest mb-4">
            <MessageSquare className="w-3.5 h-3.5" />
            Client Concierge
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl text-stone-900 tracking-tight mb-4">
            We&apos;d Love to Hear From You
          </h1>
          <p className="text-stone-500 text-sm sm:text-base font-light leading-relaxed">
            Whether you need sizing guidance, fabric care advice, or assistance
            with an existing order, our Dhaka studio team is ready to assist.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
        {/* ── Contact Info Cards ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {infoCards.map(({ icon: Icon, label, value, sub }) => (
            <div
              key={label}
              className="rounded-2xl bg-white border border-stone-200 p-6 flex items-start gap-4 shadow-2xs"
            >
              <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                  {label}
                </p>
                <p className="font-serif text-base font-semibold text-stone-900 mt-0.5">
                  {value}
                </p>
                <p className="text-xs text-stone-500 mt-0.5 font-light">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Form + FAQ Grid ─────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          {/* Contact Form */}
          <div className="lg:col-span-7 rounded-2xl bg-white border border-stone-200 p-6 sm:p-10 shadow-2xs">
            <h2 className="font-serif text-2xl text-stone-900 mb-1">
              Send a Message
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mb-6 font-light">
              Fill out the form below and our client care specialists will get
              back to you shortly.
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
                  Your inquiry has been received by our Dhaka concierge desk. We
                  will reply within 12 business hours.
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
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
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
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
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
                    onChange={(e) =>
                      setForm({ ...form, subject: e.target.value })
                    }
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
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:outline-stone-900 bg-white resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-stone-900 text-white text-xs font-semibold uppercase tracking-widest hover:bg-stone-800 disabled:opacity-50 transition-colors"
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

          {/* Quick FAQs */}
          <div className="lg:col-span-5 space-y-5">
            <div>
              <h2 className="font-serif text-2xl text-stone-900 mb-1">
                Common Questions
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 font-light">
                Immediate answers regarding sizing, exchanges, and nationwide
                delivery.
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map(({ q, a }) => (
                <details
                  key={q}
                  className="group rounded-2xl bg-white border border-stone-200 p-5 open:border-stone-400 transition-colors"
                >
                  <summary className="font-medium text-sm text-stone-900 cursor-pointer list-none flex items-center justify-between gap-3">
                    <span>{q}</span>
                    <span className="text-stone-400 group-open:rotate-45 transition-transform text-lg leading-none">
                      +
                    </span>
                  </summary>
                  <p className="text-xs sm:text-sm text-stone-600 font-light leading-relaxed mt-3 pt-3 border-t border-stone-100">
                    {a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
