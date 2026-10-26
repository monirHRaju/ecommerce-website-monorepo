import { ShieldCheck, Truck, RefreshCw, CreditCard } from "lucide-react";

export default function FashionTrustStrip() {
  const features = [
    {
      icon: ShieldCheck,
      title: "100% Authentic Fabric",
      description: "Pure cotton, silk & muslin sourced from verified artisan weavers.",
    },
    {
      icon: Truck,
      title: "Nationwide Delivery",
      description: "Inside Dhaka in 24–48 hours, all 64 districts in 3–5 business days.",
    },
    {
      icon: RefreshCw,
      title: "7-Day Easy Exchange",
      description: "Hassle-free doorstep exchange for size, fit, and style preferences.",
    },
    {
      icon: CreditCard,
      title: "Cash on Delivery & bKash",
      description: "Pay securely at your doorstep or via instant mobile banking.",
    },
  ];

  return (
    <section className="py-12 bg-white border-b border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0 text-stone-800">
                  <Icon className="w-5 h-5 text-amber-800" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-stone-900">{f.title}</h4>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">{f.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
