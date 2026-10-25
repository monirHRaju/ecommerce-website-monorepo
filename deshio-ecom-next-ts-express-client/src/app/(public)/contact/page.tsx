import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageSquare, Phone } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";
import ContactForm from "@/components/contact/ContactForm";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const name = settings?.siteName || "Deshio";
  return {
    title: `Contact & Studio Concierge — ${name} Fashion`,
    description:
      settings?.contactPageSubtitle ||
      `Connect with our ${name} studio concierge for sizing guidance, custom handloom orders, or delivery inquiries across Bangladesh.`,
    openGraph: {
      title: `Contact ${name} — Studio Concierge & Customer Care`,
      description:
        settings?.contactPageSubtitle ||
        `Reach our team for garment sizing advice, exchange support, or bespoke inquiries.`,
      type: "website",
    },
  };
}

const defaultFaqs = [
  {
    question: "How long does delivery take inside and outside Dhaka?",
    answer:
      "Orders inside Dhaka arrive within 24–48 hours. Nationwide courier deliveries across all 64 districts take 3–5 business days.",
  },
  {
    question: "Can I exchange a garment if the size doesn't fit?",
    answer:
      "Yes! We offer a hassle-free 7-day size exchange on all unworn garments with original tags attached.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept Cash on Delivery (COD) nationwide as well as Mobile Banking (bKash, Nagad, and Rocket).",
  },
  {
    question: "How can I be sure of my Panjabi or Kurti measurements?",
    answer:
      "Every product page includes an interactive Size Guide with chest, shoulder, and garment length measurements in inches.",
  },
];

export default async function ContactPage() {
  const settings = await getSiteSettings();

  const title = settings?.contactPageTitle || "We'd Love to Hear From You";
  const subtitle =
    settings?.contactPageSubtitle ||
    "Whether you need sizing guidance, fabric care advice, or assistance with an existing order, our studio team is ready to assist.";

  const email = settings?.contactEmail || "care@deshio.com";
  const phone = settings?.contactPhone || "+880 1700-000000";
  const address = settings?.address || "Road 11, Banani, Dhaka 1213, Bangladesh";
  const showroomHours = settings?.showroomHours || "11:00 AM – 9:00 PM (Open 7 Days)";
  const helplineHours = settings?.helplineHours || "Sat – Thu, 10:00 AM – 8:00 PM BST";

  const infoCards = [
    {
      icon: Mail,
      label: "Concierge Email",
      value: email,
      sub: "Responses within 12 business hours",
    },
    {
      icon: Phone,
      label: "Studio Helpline",
      value: phone,
      sub: helplineHours,
    },
    {
      icon: MapPin,
      label: "Flagship Atelier",
      value: address,
      sub: "Showroom & Fitting Studio",
    },
    {
      icon: Clock,
      label: "Showroom Hours",
      value: showroomHours,
      sub: "Walk-ins Welcome",
    },
  ];

  const faqs = settings?.contactFaqs?.length ? settings.contactFaqs : defaultFaqs;

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
            {title}
          </h1>
          <p className="text-stone-500 text-sm sm:text-base font-light leading-relaxed">
            {subtitle}
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
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                  {label}
                </p>
                <p className="font-serif text-sm sm:text-base font-semibold text-stone-900 mt-0.5 truncate">
                  {value}
                </p>
                <p className="text-xs text-stone-500 mt-0.5 font-light">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Form + FAQ Grid ─────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          {/* Interactive Client Island Form */}
          <div className="lg:col-span-7">
            <ContactForm />
          </div>

          {/* Dynamic Accordion FAQs */}
          <div className="lg:col-span-5 space-y-5">
            <div>
              <h2 className="font-serif text-2xl text-stone-900 mb-1">
                Common Questions
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 font-light">
                Immediate answers regarding sizing, exchanges, and nationwide delivery.
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map(({ question, answer }, idx) => (
                <details
                  key={idx}
                  className="group rounded-2xl bg-white border border-stone-200 p-5 open:border-stone-400 transition-colors"
                >
                  <summary className="font-medium text-sm text-stone-900 cursor-pointer list-none flex items-center justify-between gap-3">
                    <span>{question}</span>
                    <span className="text-stone-400 group-open:rotate-45 transition-transform text-lg leading-none">
                      +
                    </span>
                  </summary>
                  <p className="text-xs sm:text-sm text-stone-600 font-light leading-relaxed mt-3 pt-3 border-t border-stone-100">
                    {answer}
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
