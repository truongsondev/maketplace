import { Plus_Jakarta_Sans } from "next/font/google";

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
      className={`${plusJakartaSans.variable} font-display bg-[#f5f5f5] text-[#222222] min-h-screen flex flex-col`}
    >
      <main className="grow flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,0,0,0.045),transparent_45%),radial-gradient(circle_at_85%_75%,rgba(0,0,0,0.035),transparent_45%)] pointer-events-none" />
        {children}
      </main>
    </div>
  );
}
