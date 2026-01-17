import { TopNav } from "@/components/page/top-nav";
import { Header } from "@/components/page/header";
import { CategoryTabs } from "@/components/page/category-tabs";
import { HeroSection } from "@/components/page/hero-section";
import { FlashSaleSection } from "@/components/page/flash-sale-section";
import { DailyDiscover } from "@/components/page/daily-discover";

export default function Home() {
  return (
    <div className="min-h-screen">
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />

      {/* Top Utility Bar */}
      <TopNav />

      {/* Main Header */}
      <Header />

      {/* Content Container */}
      <main className="max-w-300 mx-auto px-4 py-6">
        {/* Category Tabs */}
        <CategoryTabs />

        {/* Hero Carousel & Promo */}
        <HeroSection />

        {/* Flash Sale Section */}
        <FlashSaleSection />

        {/* Daily Discover Section */}
        <DailyDiscover />
      </main>
    </div>
  );
}
