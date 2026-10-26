import { Product } from "@/types";
import { Sparkles, Shirt, Droplets, Info } from "lucide-react";

interface FashionProductDetailsProps {
  product: Product;
}

export default function FashionProductDetails({ product }: FashionProductDetailsProps) {
  const details = [
    {
      icon: Sparkles,
      title: "Material & Weave",
      value: product.material || "100% Premium Pure Cotton Handloom",
    },
    {
      icon: Shirt,
      title: "Fit & Silhouette",
      value: product.fit || "Classic relaxed silhouette with tailored shoulders",
    },
    {
      icon: Droplets,
      title: "Care Instructions",
      value:
        product.careInstructions ||
        "Dry clean recommended for silk & festive weaves. Cold hand wash with mild detergent for cotton. Dry in shade.",
    },
  ];

  return (
    <div className="space-y-4 pt-6 border-t border-stone-200">
      <h3 className="font-serif text-lg font-bold text-stone-900">
        Craftsmanship & Details
      </h3>

      <div className="grid grid-cols-1 gap-3">
        {details.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="flex items-start gap-3 p-3.5 rounded-xl bg-stone-50 border border-stone-200/80"
            >
              <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center shrink-0 text-amber-800">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  {item.title}
                </p>
                <p className="text-xs text-stone-800 mt-0.5 leading-relaxed">
                  {item.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {product.specifications && Object.keys(product.specifications).length > 0 && (
        <div className="pt-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
            Specifications
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(product.specifications).map(([k, v]) => (
              <div key={k} className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/60">
                <span className="text-stone-400 font-medium block text-[11px]">{k}</span>
                <span className="text-stone-800 font-semibold">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
