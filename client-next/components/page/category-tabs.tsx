"use client";

import { useState } from "react";

const categories = [
  { name: "Electronics", icon: "devices" },
  { name: "Fashion", icon: "apparel" },
  { name: "Home", icon: "home" },
  { name: "Beauty", icon: "face" },
  { name: "Sports", icon: "fitness_center" },
  { name: "Toys", icon: "toys" },
  { name: "Auto", icon: "directions_car" },
  { name: "Groceries", icon: "shopping_basket" },
];

export function CategoryTabs() {
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <div className="bg-card dark:bg-background-dark/50 mb-6 rounded-lg shadow-sm border border-border">
      <div className="flex overflow-x-auto [scrollbar-width:none] px-2">
        {categories.map((category, index) => (
          <a
            key={index}
            onClick={() => setActiveCategory(index)}
            className={`flex flex-col items-center min-w-25 py-4 border-b-2 transition-colors cursor-pointer ${
              activeCategory === index
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-primary"
            }`}
            href="#"
          >
            <span className="material-symbols-outlined mb-1">
              {category.icon}
            </span>
            <p className="text-xs font-bold uppercase tracking-wider">
              {category.name}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
