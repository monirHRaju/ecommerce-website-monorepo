"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

interface Props {
  images: string[];
  title: string;
}

const FALLBACK =
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80";

export default function ImageGallery({ images, title }: Props) {
  const imgs = images?.length ? images : [FALLBACK];
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });

  const prev = () => setActive((i) => (i - 1 + imgs.length) % imgs.length);
  const next = () => setActive((i) => (i + 1) % imgs.length);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin({ x, y });
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Main Display Image (3:4 portrait) */}
        <div
          className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-stone-100 border border-stone-200/80 cursor-zoom-in select-none group"
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={() => setZoomed(true)}
        >
          {/* Zoomable Image Container */}
          <div
            className="absolute inset-0 transition-transform duration-100 will-change-transform"
            style={{
              transform: hovered ? "scale(2.2)" : "scale(1)",
              transformOrigin: `${origin.x}% ${origin.y}%`,
            }}
          >
            <Image
              src={imgs[active]}
              alt={`${title} — view ${active + 1}`}
              fill
              className="object-cover object-top"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
              unoptimized
            />
          </div>

          {/* Navigation Arrows */}
          {imgs.length > 1 && !hovered && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label="Previous image"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 text-stone-800 hover:bg-white shadow-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                aria-label="Next image"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 text-stone-800 hover:bg-white shadow-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-10"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Hover Zoom Indicator */}
          {!hovered && (
            <div className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-900/60 backdrop-blur-xs text-white text-[11px] pointer-events-none">
              <ZoomIn className="w-3.5 h-3.5" />
              <span>Hover to zoom</span>
            </div>
          )}
        </div>

        {/* Thumbnails Row */}
        {imgs.length > 1 && (
          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
            {imgs.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                className={`relative w-16 h-20 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                  active === i
                    ? "border-stone-900 shadow-xs"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <Image
                  src={img}
                  alt={`${title} thumbnail ${i + 1}`}
                  fill
                  className="object-cover object-top"
                  sizes="64px"
                  unoptimized
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {zoomed && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setZoomed(false)}
        >
          <button
            type="button"
            onClick={() => setZoomed(false)}
            aria-label="Close zoomed view"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors z-20"
          >
            <X className="w-5 h-5" />
          </button>

          <div
            className="relative max-w-3xl w-full aspect-[3/4] max-h-[85vh] rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={imgs[active]}
              alt={`${title} enlarged`}
              fill
              className="object-contain"
              sizes="90vw"
              unoptimized
            />
          </div>
        </div>
      )}
    </>
  );
}
