"use client";

import { useRef, useState } from "react";
import Image from "next/image";

export default function PostImageCarousel({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  function handleScroll() {
    const el = containerRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActive(index);
  }

  if (images.length <= 1) {
    return (
      <div className="relative aspect-square w-full bg-black/5">
        <Image
          src={images[0]}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 600px"
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="no-scrollbar flex aspect-square w-full snap-x snap-mandatory overflow-x-auto scroll-smooth"
      >
        {images.map((src, i) => (
          <div key={i} className="relative aspect-square w-full shrink-0 snap-center bg-black/5">
            <Image
              src={src}
              alt={alt}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 600px"
            />
          </div>
        ))}
      </div>

      <span className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
        {active + 1}/{images.length}
      </span>

      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
        {images.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full transition-colors ${
              i === active ? "bg-white" : "bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
