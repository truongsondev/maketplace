"use client";

import { useState } from "react";

export function ProductReviews() {
  const [selectedRating, setSelectedRating] = useState("all");

  const reviews = [
    {
      id: 1,
      author: "Sarah Johnson",
      rating: 5,
      date: "2 days ago",
      title: "Amazing sound quality and comfort!",
      content:
        "I've been using these headphones for a week and I'm very impressed. The noise cancellation is excellent, and the sound quality is crystal clear. Battery life is outstanding. Highly recommended!",
      avatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuC2nCSmczl9SvOlccYzFrRRJ0NdGzyZJ5_VXIFrMP9ps3u2upfyMuE5yb1X7lrxTvbnvAEGpCn4vgvNx9dxhWGg3pnETghNdcrykAIkbd_X2gqMqXPX_joT5u9-QRbcUDs5c-Ds-jzpSWD3TjlG-HPCEGfg9n4vKU6BI6IgT7S2g4SAjeYHYB62j2pmyWvh8yPhJJyotLbUOtsfcgHdKkU55PRZLIKvTgKIFqYgjIQNhL6ak9aeqvtQnSRlZopzK8ijr9P0yY5H-FR4",
      verified: true,
      helpful: 234,
    },
    {
      id: 2,
      author: "Mike Chen",
      rating: 5,
      date: "5 days ago",
      title: "Best investment ever!",
      content:
        "Worth every penny. The build quality is solid, and the features are top-notch. Fast delivery as well!",
      avatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDB1czZTdtF621rit9BCBCuy4gaMJ3Km1xh8ZE1mxlPbBGbxqDPCdstKHtJSibctXb0qC7GbgudDd2rfXy_BsS0EOBaeCGXUH7rOs7ovu2jDJHTmTno7wOupJ9jUvFv8Tw8dz8faMQjjDz_yyFSw3uPIQ7eVtLIDbG-_PPVD3HWBUoUsdWrYjrqijKRfx4y73zMrKQ8JmPJzMb93skltLh-Znrtuc0V2vVQdTUQ5ZgkaB-C3ZXqcW0Hl1LPcLtOl9lgQeoZ1kFheR6i",
      verified: true,
      helpful: 156,
    },
  ];

  return (
    <div className="bg-card dark:bg-card/50 rounded-xl shadow-sm p-4 lg:p-6 border border-border space-y-6">
      <h3 className="font-bold uppercase text-sm tracking-wider">
        Product Ratings
      </h3>

      {/* Review Summary */}
      <div className="bg-primary/5 dark:bg-primary/10 p-6 rounded-lg flex flex-col md:flex-row items-center gap-8 border border-primary/10">
        <div className="text-center md:text-left">
          <div className="text-primary text-3xl font-bold">
            4.9{" "}
            <span className="text-lg font-medium text-muted-foreground">
              out of 5
            </span>
          </div>
          <div className="flex text-primary mt-1 justify-center md:justify-start">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                star
              </span>
            ))}
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex-1 flex flex-wrap gap-2 justify-center md:justify-start">
          {["all", "5star", "4star", "3star", "media", "comments"].map(
            (filter) => {
              const labels: Record<string, string> = {
                all: "All",
                "5star": "5 Star (1.1k)",
                "4star": "4 Star (152)",
                "3star": "3 Star (42)",
                media: "With Media (854)",
                comments: "With Comments (942)",
              };

              return (
                <button
                  key={filter}
                  suppressHydrationWarning
                  onClick={() => setSelectedRating(filter)}
                  className={`px-4 py-1.5 border rounded text-sm transition-colors ${
                    selectedRating === filter
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border hover:border-primary"
                  }`}
                >
                  {labels[filter]}
                </button>
              );
            },
          )}
        </div>
      </div>

      {/* Review List */}
      <div className="divide-y divide-border">
        {reviews.map((review) => (
          <div key={review.id} className="py-6 flex gap-4">
            {/* Avatar */}
            <div
              className="w-10 h-10 rounded-full bg-cover bg-center shrink-0"
              style={{ backgroundImage: `url('${review.avatar}')` }}
              //   alt={`${review.author} avatar`}
            />

            {/* Review Content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{review.author}</p>
                    {review.verified && (
                      <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] px-1.5 py-0.5 rounded">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{review.date}</p>
                </div>
                <div className="flex text-primary text-sm">
                  {[...Array(review.rating)].map((_, i) => (
                    <span
                      key={i}
                      className="material-symbols-outlined"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                  ))}
                </div>
              </div>

              {/* Review Title & Content */}
              <p className="font-medium text-sm mb-1">{review.title}</p>
              <p className="text-sm text-foreground leading-relaxed mb-3">
                {review.content}
              </p>

              {/* Helpful Button */}
              <button
                suppressHydrationWarning
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-sm">
                  thumb_up
                </span>
                Helpful ({review.helpful})
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      <button className="w-full py-3 border border-border rounded-lg hover:bg-muted transition-colors font-medium">
        Load More Reviews
      </button>
    </div>
  );
}
