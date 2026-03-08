import { Plus_Jakarta_Sans } from "next/font/google";
import { AuthHeader } from "@/components/auth/auth-header";
import { AuthFooter } from "@/components/auth/auth-footer";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${plusJakartaSans.variable} font-display bg-background-light text-text-main min-h-screen flex flex-col`}
    >
      <AuthHeader />

      <main className="grow flex items-center justify-center p-6 relative overflow-hidden">
        {/* Decorative background blobs */}
        <div className="absolute -top-[10%] -left-[10%] w-125 h-125 rounded-full bg-primary/5 blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-[10%] -right-[10%] w-125 h-125 rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

        {children}
      </main>

      <AuthFooter />
    </div>
  );
}
