import Link from "next/link";
import Image from "next/image";
import { Users, BookOpen, ChevronDown } from "lucide-react";
import DiscordIcon from "@/components/DiscordIcon";
import { getSettings } from "@/lib/db";

const HERO_IMAGE = "/test2.webp";
// const HERO_IMAGE = "/bg.png";

const features = [
  {
    icon: <Users size={22} strokeWidth={1.5} />,
    line1: "COMMUNAUTÉ",
    line2: "ACTIVE",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
        <path d="M13 19l6-6" />
        <path d="M2 2l20 20" />
      </svg>
    ),
    line1: "TOURNOIS &",
    line2: "ÉVÉNEMENTS",
  },
  {
    icon: <BookOpen size={22} strokeWidth={1.5} />,
    line1: "GUIDES &",
    line2: "ASTUCES",
  },
  {
    icon: <DiscordIcon size={22} />,
    line1: "DISCORD",
    line2: "FRANCOPHONE",
  },
];

export default async function Hero() {
  const { discordInvite } = await getSettings();
  return (
    <section
      className="relative flex items-center overflow-hidden"
      style={{ minHeight: "600px", paddingTop: "64px" }}
    >
      {/* Background image */}
      <Image
        src={HERO_IMAGE}
        alt=""
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />

      {/* Dark overlay — stronger on the left for text readability */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(8,14,26,0.97) 0%, rgba(8,14,26,0.88) 35%, rgba(8,14,26,0.55) 60%, rgba(8,14,26,0.25) 100%)",
        }}
      />
      {/* Additional top/bottom vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(8,14,26,0.6) 0%, transparent 30%, transparent 70%, rgba(8,14,26,0.6) 100%)",
        }}
      />

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 w-full">
        <div className="max-w-[640px]">
          <h1 className="font-bold leading-[1.08] tracking-wide mb-5">
            <span className="block text-[2.6rem] sm:text-5xl lg:text-[3.2rem] text-white uppercase">
              LA COMMUNAUTÉ FRANÇAISE
            </span>
            <span className="block text-[2.6rem] sm:text-5xl lg:text-[3.2rem] text-white uppercase">
              AGE OF EMPIRES
            </span>
          </h1>

          <p className="text-gray-300 text-[1rem] leading-relaxed mb-8 max-w-[480px]">
            Rejoignez des milliers de joueurs passionnés par Age of Empires II,
            Age of Empires III, Age of Empires IV et Age of Mythology: Retold.
          </p>

          {/* Feature icons */}
          <div className="flex flex-wrap gap-x-6 gap-y-4 mb-10">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="text-[#c8a32e] shrink-0">{f.icon}</div>
                <div className="text-[11px] font-bold tracking-[0.12em] leading-snug text-white/90 uppercase">
                  <div>{f.line1}</div>
                  <div>{f.line2}</div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-wrap items-center gap-4">
            <a
              href={discordInvite}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#5865f2] hover:bg-[#4752c4] text-white font-bold text-sm tracking-wider px-6 py-3.5 rounded transition-colors"
            >
              <DiscordIcon size={18} />
              REJOINDRE LE DISCORD
            </a>

            <Link
              href="/decouvrir"
              className="flex items-center gap-2 border border-white/30 hover:border-[#c8a32e]/80 text-white hover:text-[#c8a32e] font-bold text-sm tracking-wider px-6 py-3.5 rounded transition-colors"
            >
              EN SAVOIR PLUS
              <ChevronDown size={16} className="-rotate-90" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
