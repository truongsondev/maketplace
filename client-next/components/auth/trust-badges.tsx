import { Shield, Lock, Headset } from "lucide-react";

export default function TrustBadges() {
  const badges = [
    {
      icon: Shield,
      title: "Secure Data",
      subtitle: "Encryption",
    },
    {
      icon: Lock,
      title: "Privacy",
      subtitle: "Guaranteed",
    },
    {
      icon: Headset,
      title: "24/7 Seller",
      subtitle: "Support",
    },
  ];

  return (
    <div className="mt-12 flex flex-wrap justify-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
      {badges.map((badge) => {
        const IconComponent = badge.icon;
        return (
          <div key={badge.title} className="flex items-center gap-2">
            <IconComponent
              size={32}
              className="text-[#111418] dark:text-white"
            />
            <span className="text-xs font-bold uppercase tracking-tighter text-[#111418] dark:text-white whitespace-nowrap">
              {badge.title}
              <br />
              {badge.subtitle}
            </span>
          </div>
        );
      })}
    </div>
  );
}
