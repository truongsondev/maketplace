"use client";

import { useState, useEffect } from "react";
import { HeroCarousel } from "@/components/hero-carousel";
import { Header } from "@/components/page/header";
import { FilterBar } from "@/components/page/filter-bar";
import { CategoriesGrid } from "@/components/page/categories-grid";
import { ProductsGrid } from "@/components/page/products-grid";
import { Footer } from "@/components/page/footer";
import { COLORS } from "@/lib/constants";
import { LetterSession } from "@/components/page/letter-session";
import { useCategories } from "@/hooks/use-categories";
import { useProducts } from "@/hooks/use-products";

export default function Home() {
  const [isDark, setIsDark] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const cartCount = 2;

  const { data: categories = [], isLoading: isCategoriesLoading } =
    useCategories();

  const { data: productsData, isLoading: isProductsLoading } = useProducts();
  const products = productsData?.products ?? [];

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <div className="bg-background-light dark:bg-background-dark text-neutral-800 dark:text-neutral-50 min-h-screen flex flex-col transition-colors duration-200 overflow-x-hidden">
      <Header
        isDark={isDark}
        onToggleDarkMode={() => setIsDark(!isDark)}
        cartCount={cartCount}
      />

      <main className="flex-1 flex flex-col">
        <HeroCarousel />
        <FilterBar
          colors={COLORS}
          selectedColor={selectedColor}
          onColorChange={setSelectedColor}
        />
        <CategoriesGrid
          categories={categories}
          isLoading={isCategoriesLoading}
        />
        <ProductsGrid products={products} isLoading={isProductsLoading} />
      </main>
      <LetterSession />
      <Footer />
    </div>
  );
}
