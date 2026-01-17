"use client";
import Header from "@/components/auth/register-header";
import { MarketplaceFooter } from "@/components/auth/marketplace-footer";
import RegistrationForm from "@/components/auth/registration-form";
import TrustBadges from "@/components/auth/trust-badges";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark">
      <Header />

      <main className="flex flex-col items-center justify-center flex-1 py-12 px-4 bg-[#F6F7F8]">
        <RegistrationForm />
      </main>

      <TrustBadges />

      <MarketplaceFooter />
    </div>
  );
}
