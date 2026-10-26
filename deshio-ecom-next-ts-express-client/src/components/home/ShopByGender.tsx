import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export default function ShopByGender() {
  const sections = [
    {
      title: "Women's Atelier",
      subtitle: "Flowing silks, contemporary kurtis & festive sarees",
      image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80",
      link: "/products?gender=women",
      cta: "Explore Women",
    },
    {
      title: "Men's Studio",
      subtitle: "Tailored panjabis, crisp casuals & heritage vests",
      image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&q=80",
      link: "/products?gender=men",
      cta: "Explore Men",
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-stone-100/70 border-y border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs uppercase tracking-widest font-bold text-amber-800">
            Tailored Experiences
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 tracking-tight mt-2">
            Designed for Every Silhouette
          </h2>
          <p className="text-stone-500 text-sm sm:text-base mt-2 font-light">
            Discover curated wardrobes thoughtfully created for personal expression and comfort.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {sections.map((sec) => (
            <Link
              key={sec.title}
              href={sec.link}
              className="group relative block rounded-2xl overflow-hidden aspect-[4/5] sm:aspect-[16/11] bg-stone-300 shadow-md hover:shadow-2xl transition-all duration-500"
            >
              <Image
                src={sec.image}
                alt={sec.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/30 to-transparent" />

              <div className="absolute bottom-6 left-6 right-6 sm:bottom-8 sm:left-8 sm:right-8 text-white">
                <h3 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight">
                  {sec.title}
                </h3>
                <p className="text-stone-200 text-xs sm:text-sm mt-1 max-w-md font-light">
                  {sec.subtitle}
                </p>
                <div className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-lg bg-white/95 text-stone-900 text-xs font-semibold hover:bg-white transition-colors group-hover:translate-x-1 duration-300">
                  <span>{sec.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
