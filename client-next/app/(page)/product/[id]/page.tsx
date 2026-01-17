import { TopNav } from "@/components/page/top-nav";
import { Header } from "@/components/page/header";
import { ProductBreadcrumb } from "@/components/product/breadcrumb";
import { ProductHero } from "@/components/product/product-hero";
import { ShopProfile } from "@/components/product/shop-profile";
import { ProductDetails } from "@/components/product/product-details";
import { ProductReviews } from "@/components/product/product-reviews";
import { Footer } from "@/components/page/footer";

export const metadata = {
  title: "Premium Noise Cancelling Wireless Over-Ear Headphones - Marketplace",
  description:
    "Shop premium noise cancelling wireless headphones with 40h battery life and fast charging. Best deals and authentic products.",
};

export default function ProductPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />

      <TopNav />
      <Header />

      <main className="max-w-[1200px] mx-auto px-4 py-6 flex-1 space-y-6">
        <ProductBreadcrumb />
        <ProductHero />
        <ShopProfile />
        <ProductDetails />
        <ProductReviews />
      </main>

      <Footer />
    </div>
  );
}
