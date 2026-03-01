"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  bgColor: string;
  accentColor: string;
  emoji: string;
  ctaPrimary: string;
  ctaSecondary: string;
  gradient: string;
}

const slides: Slide[] = [
  {
    id: 1,
    title: "Urban Vibes",
    subtitle: "Bộ sưu tập mùa mới",
    description:
      "Khám phá những xu hướng thời trang đẳng cấp với phong cách hiện đại",
    bgColor: "from-neutral-900 to-neutral-800",
    accentColor: "text-orange-400",
    emoji: "👕",
    ctaPrimary: "Mua ngay",
    ctaSecondary: "Xem Sale",
    gradient: "from-black/70 to-transparent",
  },
  {
    id: 2,
    title: "Summer Collection",
    subtitle: "Xu hướng hè 2024",
    description: "Những thiết kế thoáng mát, thoải mái cho mùa hè nóng bỏng",
    bgColor: "from-amber-600 to-orange-600",
    accentColor: "text-yellow-300",
    emoji: "🕶️",
    ctaPrimary: "Khám phá ngay",
    ctaSecondary: "Xem bộ sưu tập",
    gradient: "from-black/60 to-transparent",
  },
  {
    id: 3,
    title: "Premium Selection",
    subtitle: "Lựa chọn hàng đầu",
    description: "Các sản phẩm chất lượng cao được chọn lọc kỹ càng cho bạn",
    bgColor: "from-slate-800 to-slate-900",
    accentColor: "text-blue-300",
    emoji: "💎",
    ctaPrimary: "Mua sắm ngay",
    ctaSecondary: "Xem chi tiết",
    gradient: "from-black/70 to-transparent",
  },
  {
    id: 4,
    title: "Flash Sale",
    subtitle: "Giảm giá đến 70%",
    description:
      "Cơ hội vàng để sở hữu những sản phẩm yêu thích với giá ưu đãi",
    bgColor: "from-red-700 to-red-900",
    accentColor: "text-yellow-200",
    emoji: "🔥",
    ctaPrimary: "Mua ngay",
    ctaSecondary: "Xem thêm",
    gradient: "from-black/60 to-transparent",
  },
];

export function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  useEffect(() => {
    if (!isAutoPlay) return;

    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isAutoPlay]);

  const next = () => {
    setCurrent((prev) => (prev + 1) % slides.length);
    setIsAutoPlay(false);
  };

  const prev = () => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlay(false);
  };

  const goToSlide = (index: number) => {
    setCurrent(index);
    setIsAutoPlay(false);
  };

  // const slide = slides[current];

  return (
    <div
      className="relative w-full h-screen overflow-hidden bg-black"
      onMouseEnter={() => setIsAutoPlay(false)}
      onMouseLeave={() => setIsAutoPlay(true)}
    >
      {/* Slides Container */}
      <div className="relative w-full h-full">
        {slides.map((s, index) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === current ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-linear-to-r ${s.bgColor}`} />

            {/* Content Overlay */}
            <div className={`absolute inset-0 bg-linear-to-r ${s.gradient}`} />

            {/* Emoji/Icon Background */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 text-[30vw] opacity-10">
              {s.emoji}
            </div>

            {/* Content */}
            <div className="relative h-full flex flex-col justify-center px-6 md:px-12 lg:px-24 max-w-4xl">
              <div className="space-y-4 md:space-y-6">
                {/* Subtitle Badge */}
                <div className="inline-block w-fit">
                  <span className="inline-block rounded-full bg-white/20 px-4 py-1.5 text-xs md:text-sm font-bold uppercase tracking-widest text-white backdrop-blur-md">
                    {s.subtitle}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-tight text-white tracking-tight">
                  {s.title.split(" ")[0]}
                  <br />
                  <span className={`${s.accentColor}`}>
                    {s.title.split(" ").slice(1).join(" ")}
                  </span>
                </h1>

                {/* Description */}
                <p className="text-lg md:text-xl text-white/90 max-w-2xl leading-relaxed">
                  {s.description}
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4 md:pt-6">
                  <button className="flex h-12 md:h-14 items-center justify-center rounded-full bg-orange-500 hover:bg-orange-600 px-8 md:px-10 text-base md:text-lg font-bold text-white shadow-lg shadow-orange-500/40 transition-all hover:scale-105 active:scale-95">
                    {s.ctaPrimary}
                  </button>
                  <button className="flex h-12 md:h-14 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md px-8 md:px-10 text-base md:text-lg font-bold text-white border border-white/30 transition-all hover:scale-105 active:scale-95">
                    {s.ctaSecondary}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prev}
        className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center size-12 md:size-14 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md transition-all hover:scale-110 text-white group"
        aria-label="Previous slide"
      >
        <ChevronLeft className="size-6 md:size-7 group-hover:scale-125 transition-transform" />
      </button>

      <button
        onClick={next}
        className="absolute right-6 md:right-8 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center size-12 md:size-14 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md transition-all hover:scale-110 text-white group"
        aria-label="Next slide"
      >
        <ChevronRight className="size-6 md:size-7 group-hover:scale-125 transition-transform" />
      </button>

      {/* Navigation Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 md:gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 ${
              index === current
                ? "w-8 md:w-10 h-2 md:h-2.5 bg-orange-500"
                : "w-2 md:w-2.5 h-2 md:h-2.5 bg-white/40 hover:bg-white/60"
            } rounded-full`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Slide Counter */}
      <div className="absolute top-6 right-6 md:top-8 md:right-8 z-20 text-white/60 text-sm md:text-base font-medium">
        <span className="text-white font-bold">
          {String(current + 1).padStart(2, "0")}
        </span>
        <span className="mx-2">/</span>
        <span>{String(slides.length).padStart(2, "0")}</span>
      </div>
    </div>
  );
}
