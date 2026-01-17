"use client";
import { MarketplaceHeader } from "@/components/auth/marketplace-header";
import { LoginPanel } from "@/components/auth/login-panel";
import { LoginForm } from "@/components/auth/login-form";
import { MarketplaceFooter } from "@/components/auth/marketplace-footer";

export default function MarketplaceLogin() {
  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-[#f8f6f5] dark:bg-[#1a0e0b] overflow-x-hidden">
      {/* Header */}
      <MarketplaceHeader />

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center py-12 px-4 md:px-10 lg:px-40">
        <div className="flex flex-col md:flex-row w-full  bg-white dark:bg-[#2a1a16] rounded-xl shadow-2xl overflow-hidden border border-[#e6dedb] dark:border-[#3d2a24]">
          <LoginPanel />

          <LoginForm />
        </div>
      </main>

      {/* Footer */}
      <MarketplaceFooter />
    </div>
  );
}
