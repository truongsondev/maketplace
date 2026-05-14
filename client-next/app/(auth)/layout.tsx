import Image from "next/image";
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
    <div className={`${plusJakartaSans.variable} luxury-page font-display`}>
      <main className="grid min-h-screen grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)]">
        <section className="relative hidden bg-black text-white lg:block">
          <Image
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1800&q=85"
            alt="AURA editorial campaign"
            fill
            priority
            sizes="55vw"
            className="object-cover opacity-82"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/82 via-black/24 to-black/10" />
          <div className="absolute inset-x-0 bottom-0 p-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-white/55">
              AURA private wardrobe
            </p>
            <h1 className="mt-4 max-w-xl text-7xl font-semibold uppercase leading-[0.92] tracking-[-0.06em]">
              Sign in to your edit
            </h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-white/70">
              Lưu wishlist, theo dõi đơn hàng và nhận gợi ý cá nhân hóa theo
              nhịp sống của bạn.
            </p>
          </div>
        </section>
        <section className="relative flex items-center justify-center px-5 py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,0,0,0.045),transparent_45%)] pointer-events-none" />
          {children}
        </section>
      </main>
    </div>
  );
}
