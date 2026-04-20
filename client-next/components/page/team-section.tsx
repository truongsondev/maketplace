"use client";

import Image from "next/image";
import { buildCollectionCampaignHref } from "@/lib/home-team-campaigns";
import { useHomeTeamContent } from "@/hooks/use-home-team-content";

export function TeamSection() {
  const { data, isLoading } = useHomeTeamContent();
  const teamCards = data?.teamCards ?? [];
  const highlights = data?.highlights ?? [];
  const gallery = data?.gallery ?? [];

  return (
    <section id="team" className="bg-[#ededed] py-16 dark:bg-neutral-900">
      <div className="mx-auto w-full max-w-330 px-4 md:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {(isLoading ? [] : teamCards).map((card) => (
            <article
              key={card.id}
              className="group rounded-sm border border-transparent bg-white p-2 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:border-neutral-200 hover:shadow-xl dark:bg-neutral-800 dark:hover:border-neutral-700"
            >
              <a
                href={buildCollectionCampaignHref(
                  card.collectionSlug,
                  card.query,
                  card.usageOccasion,
                  card.scope,
                )}
                className="relative block aspect-3/4 overflow-hidden rounded-sm"
              >
                <Image
                  src={card.imageUrl}
                  alt={card.title}
                  fill
                  sizes="(max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-[0.5deg]"
                />
                <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/35 via-transparent to-transparent opacity-45 transition-opacity duration-500 group-hover:opacity-65" />
              </a>
              <div className="px-2 pb-2 pt-4 text-center">
                <h3 className="text-2xl font-black uppercase leading-tight text-[#374151] transition-colors duration-300 group-hover:text-[#111827] dark:text-neutral-100 dark:group-hover:text-white">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm text-[#6b7280] transition-colors duration-300 group-hover:text-[#4b5563] dark:text-neutral-300 dark:group-hover:text-neutral-200">
                  {card.description}
                </p>
              </div>
            </article>
          ))}

          {isLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`team-skeleton-${index}`}
                  className="aspect-3/4 animate-pulse rounded-sm bg-neutral-200 dark:bg-neutral-700"
                />
              ))
            : null}
        </div>

        <div className="mt-12 rounded-sm bg-white p-6 shadow-sm dark:bg-neutral-800 md:p-8">
          <h3 className="text-3xl font-black uppercase text-[#374151] dark:text-neutral-100">
            Outfit đi làm hay đi chơi?
          </h3>
          <p className="mt-2 text-sm text-[#6b7280] dark:text-neutral-300">
            Tủ đồ của bạn cần gì, click vào đó. YaMe đã lên set sẵn sàng.
          </p>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {(isLoading ? [] : highlights).map((item) => (
              <a
                key={item.id}
                href={buildCollectionCampaignHref(
                  item.collectionSlug,
                  item.query,
                  item.usageOccasion,
                )}
                className="group relative overflow-hidden rounded-sm bg-neutral-100"
              >
                <Image
                  src={item.imageUrl}
                  alt={`Outfit ${item.title}`}
                  width={1200}
                  height={900}
                  className="aspect-16/10 w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-r from-black/75 via-black/35 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end p-5 text-white md:p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
                    {item.subtitle}
                  </p>
                  <h4 className="mt-2 text-2xl font-black uppercase">
                    {item.title}
                  </h4>
                  <p className="mt-2 max-w-sm text-sm text-white/85">
                    {item.description}
                  </p>
                  <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white/90">
                    {item.ctaLabel}
                  </p>
                </div>
              </a>
            ))}

            {isLoading
              ? Array.from({ length: 2 }).map((_, index) => (
                  <div
                    key={`highlight-skeleton-${index}`}
                    className="aspect-16/10 animate-pulse rounded-sm bg-neutral-200 dark:bg-neutral-700"
                  />
                ))
              : null}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {(isLoading ? [] : gallery).map((item, imageIndex) => (
              <a
                key={item.id}
                href={buildCollectionCampaignHref(
                  item.collectionSlug,
                  item.query,
                  item.usageOccasion,
                )}
                className="group relative overflow-hidden rounded-sm bg-neutral-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <Image
                  src={item.imageUrl}
                  alt={`Outfit ${imageIndex + 1}`}
                  width={320}
                  height={420}
                  className="aspect-3/4 w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="pointer-events-none absolute inset-0 ring-0 ring-white/60 transition-all duration-300 group-hover:ring-2" />
              </a>
            ))}

            {isLoading
              ? Array.from({ length: 12 }).map((_, index) => (
                  <div
                    key={`gallery-skeleton-${index}`}
                    className="aspect-3/4 animate-pulse rounded-sm bg-neutral-200 dark:bg-neutral-700"
                  />
                ))
              : null}
          </div>
        </div>
      </div>
    </section>
  );
}
