"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Clock3 } from "lucide-react";
import { Header } from "@/components/page/header";
import { Footer } from "@/components/page/footer";
import { ProductCard } from "@/components/page/product-card";
import { promotionService } from "@/services/promotion.service";

function Countdown({ endAt }: { endAt: string }) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    const update = () =>
      setRemaining(Math.max(0, new Date(endAt).getTime() - Date.now()));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [endAt]);
  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return (
    <span className="font-semibold tabular-nums">
      {days > 0 ? `${days} ngày ` : ""}
      {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:
      {String(seconds).padStart(2, "0")}
    </span>
  );
}

export default function PromotionDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ["promotion", slug],
    queryFn: () => promotionService.getProducts(slug),
    enabled: Boolean(slug),
  });
  const campaign = data?.promotion;

  return (
    <div className="min-h-screen bg-[#f7f3ec] text-neutral-900 dark:bg-neutral-950 dark:text-white">
      <Header
        isDark={false}
        onToggleDarkMode={() => undefined}
        cartCount={0}
        variant="solid"
      />
      <main>
        {isLoading ? (
          <div className="mx-auto max-w-330 px-4 py-28">
            Đang tải chiến dịch...
          </div>
        ) : campaign ? (
          <>
            <section className="relative min-h-[62vh] overflow-hidden bg-black text-white">
              {campaign.bannerImageUrl ? (
                <Image
                  src={campaign.bannerImageUrl}
                  alt={campaign.title}
                  fill
                  priority
                  className="object-cover opacity-75"
                  sizes="100vw"
                />
              ) : null}
              <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/35 to-transparent" />
              <div className="relative mx-auto flex min-h-[62vh] max-w-330 flex-col justify-end px-4 pb-14 md:px-8">
                <p className="text-xs font-semibold uppercase tracking-[0.22em]">
                  {campaign.campaignType.replaceAll("_", " ")}
                </p>
                <h1 className="mt-3 max-w-4xl text-4xl font-semibold uppercase md:text-7xl">
                  {campaign.title}
                </h1>
                <p className="mt-4 max-w-2xl text-white/80">
                  {campaign.subtitle || campaign.description}
                </p>
                <p className="mt-5 flex items-center gap-2 text-sm">
                  <Clock3 className="size-4" />{" "}
                  {campaign.campaignType === "FLASH_SALE" ? (
                    <>
                      Còn lại <Countdown endAt={campaign.endAt} />
                    </>
                  ) : (
                    <>
                      Kết thúc{" "}
                      {new Date(campaign.endAt).toLocaleString("vi-VN")}
                    </>
                  )}
                </p>
              </div>
            </section>
            <section className="mx-auto max-w-330 px-4 py-14 md:px-8">
              <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
                {data.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={{ ...product, minPrice: product.salePrice }}
                  />
                ))}
              </div>
            </section>
          </>
        ) : (
          <div className="mx-auto max-w-330 px-4 py-28">
            Chiến dịch không tồn tại hoặc đã kết thúc.
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
