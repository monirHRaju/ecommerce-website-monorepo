import { ChevronDown, HelpCircle } from "lucide-react";

export default function FashionFAQ() {
  const faqs = [
    {
      q: "How do I choose the correct size for Panjabis, Kurtis, and Sarees?",
      a: "Every product page features a dedicated Size Guide with precise chest, waist, hip, and length measurements in inches. If you fall between two sizes or prefer a relaxed silhouette, we recommend choosing one size up. Our customer concierge is also available to assist you with personalized sizing recommendations.",
    },
    {
      q: "What are your delivery charges and delivery timelines?",
      a: "Inside Dhaka deliveries arrive within 24 to 48 hours for ৳70. Outside Dhaka (all 64 districts in Bangladesh) deliveries typically take 2 to 4 business days for ৳130. You will receive an SMS and email notification with tracking updates as soon as your parcel is dispatched.",
    },
    {
      q: "What is your exchange and return policy?",
      a: "We offer a 7-day hassle-free exchange window. If the garment does not fit perfectly or you wish to switch colors or styles, you can request an exchange through your customer dashboard or by contacting our support. The item must be unworn, unwashed, and in its original packaging with tags intact.",
    },
    {
      q: "Can I inspect the parcel before paying with Cash on Delivery?",
      a: "Yes. When our courier partner delivers your package, you are welcome to inspect the package in the presence of the delivery agent before completing your Cash on Delivery payment.",
    },
    {
      q: "How should I care for delicate fabrics like Silk, Muslin, and Handloom Cotton?",
      a: "For pure silk and Jamdani sarees, dry cleaning is strongly recommended to preserve their luster and weave integrity. Pure cotton and linen pieces can be hand-washed in cold water using a mild liquid detergent. Always dry in shade and iron on the reverse side with medium heat.",
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-stone-50/60">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-200/80 text-stone-800 text-xs font-semibold tracking-wider uppercase mb-3">
            <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
            <span>Customer Concierge</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-stone-500 text-sm sm:text-base mt-2 font-light">
            Everything you need to know about sizing, delivery, and fabric care.
          </p>
        </div>

        <div className="space-y-3.5">
          {faqs.map((faq, idx) => (
            <details
              key={idx}
              className="group rounded-xl border border-stone-200/90 bg-white p-5 transition-all duration-200 open:shadow-sm open:border-stone-300"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between text-left font-medium text-stone-900 text-sm sm:text-base select-none">
                <span className="pr-4">{faq.q}</span>
                <ChevronDown className="w-4 h-4 text-stone-400 transition-transform duration-300 group-open:rotate-180 shrink-0" />
              </summary>
              <p className="mt-3.5 text-stone-600 text-xs sm:text-sm leading-relaxed border-t border-stone-100 pt-3">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
