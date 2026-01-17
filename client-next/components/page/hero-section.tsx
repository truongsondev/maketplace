"use client";

import { useState, useEffect } from "react";

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  const slides = [
    {
      id: 1,
      title: "Year End",
      highlight: "Mega Sale",
      subtitle:
        "Up to 70% off on tech, home, and fashion essentials. Don't miss out on incredible deals!",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDpv1tZBzQqzWHNRBBJHMVu2mIIVqcwdScgmhwF3P6QLyPcNNg6fjX574WzMZiA8rcP1fXYnuzMvqoeroCY2t2y5N8CgnexrhXIRWloOz-_JsLHpoAYP67yrrT4pliZD2GJJBzNpVxktxlKaCEod1s7UEpOpaQkWaaEtlVw7EYL-RKfZAYe-u2NBzYgH1AV9BPnjOUFz9Qd-x-QysMXDunyJPet-xXxYr6qpX0s8t2x9i_QBCR3rjRjoMZ92MW2GYJ-nXvXAhYLFmUV",
    },
    {
      id: 2,
      title: "Flash",
      highlight: "Deal Hour",
      subtitle:
        "Limited quantities available! Grab the hottest products at unbeatable prices before they're gone.",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBHZWZ3404yrR66NCinfG2ok0ZIZx0QUArXFNMDHtz7m6qUNg3G-ON9ol-pfVQYtk0a1rVPiZrEsFItNAfEAVxqRb6_bSx0x72ZAKYKqz7STGKLdQoNGu_m1SBonSxCdqxVheKQ01lzQrXK-1UMjcFHa-xMWry5yu7yo4pYhoTOiJuBMgr14LNfpOGC5LpxGGH6Bi5RaiTQngTmXyYOHTeiRkYE1tDYZ93wBLuI4vRfBioIC1vHomJZtQz4qszxkZ8TzmPcJFjS_gae",
    },
    {
      id: 3,
      title: "New",
      highlight: "Collection",
      subtitle:
        "Discover the latest trends and exclusive new arrivals just added to our store.",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuD54-_jDJ8qIVGAiSd-eBIweYORflT-qnnGbQLIAex305XFdPRurjyGZZkg-lG8Aqk9NpwISFp-RR_AVfQZ4YchwAyD_VPoAYHUBK5HezULqPlLtE1L1t_Cl8rfaMrNlOUQGcqlLcGvomVMAtuUCFdwXrt5ZTHxzWk49CdF_j-NFUVvtfW-whezwROhXEYR5pOYpPLXbg7MgxLzKAORwNyv5e2PpYvBLwd64cAqkN79bzqYsN1YCHK1hF88L82SZNxOEGc13TH8g49U",
    },
  ];

  useEffect(() => {
    if (!isAutoPlay) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlay, slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlay(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlay(false);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlay(false);
  };

  return (
    <div className="w-full mb-12">
      <div className="relative w-full h-96 rounded-2xl overflow-hidden shadow-2xl border border-border/50 group">
        <div className="relative w-full h-full">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentSlide ? "opacity-100" : "opacity-0"
              }`}
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{
                  backgroundImage: `url("${slide.image}")`,
                }}
              ></div>

              <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/50 to-black/30"></div>

              <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 py-12">
                <div className="flex items-center gap-2 mb-6 w-fit">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span className="text-primary font-bold text-xs uppercase tracking-widest">
                    Limited Time Offer
                  </span>
                </div>

                <h2 className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight text-balance">
                  {slide.title}{" "}
                  <span className="text-primary">{slide.highlight}</span>
                </h2>

                <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-md leading-relaxed">
                  {slide.subtitle}
                </p>

                <div className="flex items-center gap-4">
                  <button className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                    Shop Now
                  </button>
                  <button className="border-2 border-white/30 hover:border-white/60 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 hover:bg-white/10">
                    Learn More
                  </button>
                </div>

                <div className="absolute bottom-8 left-8 md:left-16 right-8 md:right-16 flex flex-wrap gap-8">
                  <div>
                    <p className="text-primary font-bold text-2xl">10K+</p>
                    <p className="text-gray-300 text-sm">Products on Sale</p>
                  </div>
                  <div>
                    <p className="text-primary font-bold text-2xl">24/7</p>
                    <p className="text-gray-300 text-sm">Fast Delivery</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-all duration-300 backdrop-blur-sm"
          aria-label="Previous slide"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-all duration-300 backdrop-blur-sm"
          aria-label="Next slide"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentSlide
                  ? "bg-primary w-8 h-2"
                  : "bg-white/40 hover:bg-white/60 w-2 h-2"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            ></button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="relative h-48 rounded-xl overflow-hidden shadow-lg border border-border/50 group cursor-pointer">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
            style={{
              backgroundImage:
                'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBHZWZ3404yrR66NCinfG2ok0ZIZx0QUArXFNMDHtz7m6qUNg3G-ON9ol-pfVQYtk0a1rVPiZrEsFItNAfEAVxqRb6_bSx0x72ZAKYKqz7STGKLdQoNGu_m1SBonSxCdqxVheKQ01lzQrXK-1UMjcFHa-xMWry5yu7yo4pYhoTOiJuBMgr14LNfpOGC5LpxGGH6Bi5RaiTQngTmXyYOHTeiRkYE1tDYZ93wBLuI4vRfBioIC1vHomJZtQz4qszxkZ8TzmPcJFjS_gae")',
            }}
          ></div>
          <div className="absolute inset-0 bg-linear-to-r from-black/70 to-black/40"></div>
          <div className="relative h-full flex flex-col justify-between p-8 text-white">
            <div>
              <p className="text-3xl font-bold">Free Shipping</p>
              <p className="text-gray-200 text-sm mt-1">No minimum spend</p>
            </div>
            <div className="flex items-center gap-2 w-fit text-primary hover:text-primary/80 transition-colors">
              <span className="text-sm font-bold">Shop Now</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="relative h-48 rounded-xl overflow-hidden shadow-lg border border-border/50 group cursor-pointer">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
            style={{
              backgroundImage:
                'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD54-_jDJ8qIVGAiSd-eBIweYORflT-qnnGbQLIAex305XFdPRurjyGZZkg-lG8Aqk9NpwISFp-RR_AVfQZ4YchwAyD_VPoAYHUBK5HezULqPlLtE1L1t_Cl8rfaMrNlOUQGcqlLcGvomVMAtuUCFdwXrt5ZTHxzWk49CdF_j-NFUVvtfW-whezwROhXEYR5pOYpPLXbg7MgxLzKAORwNyv5e2PpYvBLwd64cAqkN79bzqYsN1YCHK1hF88L82SZNxOEGc13TH8g49U")',
            }}
          ></div>
          <div className="absolute inset-0 bg-linear-to-r from-black/70 to-black/40"></div>
          <div className="relative h-full flex flex-col justify-between p-8 text-white">
            <div>
              <p className="text-3xl font-bold">Claim Vouchers</p>
              <p className="text-gray-200 text-sm mt-1">Collect & save extra</p>
            </div>
            <div className="flex items-center gap-2 w-fit text-primary hover:text-primary/80 transition-colors">
              <span className="text-sm font-bold">Get Vouchers</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
