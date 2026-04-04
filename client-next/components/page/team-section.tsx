import Image from "next/image";

const TEAM_CARDS = [
  {
    title: 'TEAM "BẤT TỬ" (JEAN CÁC LOẠI)',
    description: "Denim nguyên bản, jean sậm màu và item dễ phối cho mọi lịch trình.",
    image:
      "https://images.unsplash.com/photo-1516826957135-700dedea698c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: 'TEAM "LƯỜI CHỌN"',
    description: "Set trung tính, thoải mái nhưng vẫn giữ được vibe lịch sự nam tính.",
    image:
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "TEAM VẬN ĐỘNG",
    description: "Vật liệu nhẹ, khô nhanh, gọn form cho ngày di chuyển liên tục.",
    image:
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80",
  },
];

const OUTFIT_SHOWCASE_IMAGES = [
  "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1550246140-50f4f1fd9b90?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1520367745676-35b3edc0f109?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1593757147298-e064ed1419e5?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=500&q=80",
];

export function TeamSection() {
  return (
    <section id="team" className="bg-[#ededed] py-16 dark:bg-neutral-900">
      <div className="mx-auto w-full max-w-330 px-4 md:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {TEAM_CARDS.map((card) => (
            <article
              key={card.title}
              className="group rounded-sm border border-transparent bg-white p-2 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:border-neutral-200 hover:shadow-xl dark:bg-neutral-800 dark:hover:border-neutral-700"
            >
              <div className="relative aspect-3/4 overflow-hidden rounded-sm">
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  sizes="(max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-[0.5deg]"
                />
                <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/35 via-transparent to-transparent opacity-45 transition-opacity duration-500 group-hover:opacity-65" />
              </div>
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
        </div>

        <div className="mt-12 rounded-sm bg-white p-6 shadow-sm dark:bg-neutral-800 md:p-8">
          <h3 className="text-3xl font-black uppercase text-[#374151] dark:text-neutral-100">
            Outfit đi làm hay đi chơi?
          </h3>
          <p className="mt-2 text-sm text-[#6b7280] dark:text-neutral-300">
            Tủ đồ của bạn cần gì, click vào đó. YaMe đã lên set sẵn sàng.
          </p>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr,2fr]">
            <div className="group relative overflow-hidden rounded-sm bg-neutral-100">
              <Image
                src="https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?auto=format&fit=crop&w=900&q=80"
                alt="Outfit main"
                width={900}
                height={1200}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent opacity-50 transition-opacity duration-500 group-hover:opacity-75" />
            </div>

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {OUTFIT_SHOWCASE_IMAGES.map((imageUrl, imageIndex) => (
                <a
                  key={`${imageUrl}-${imageIndex}`}
                  href="#new-arrivals"
                  className="group relative overflow-hidden rounded-sm bg-neutral-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <Image
                    src={imageUrl}
                    alt={`Outfit ${imageIndex + 1}`}
                    width={320}
                    height={420}
                    className="aspect-3/4 w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="pointer-events-none absolute inset-0 ring-0 ring-white/60 transition-all duration-300 group-hover:ring-2" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
