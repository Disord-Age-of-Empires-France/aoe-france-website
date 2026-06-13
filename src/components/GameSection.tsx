import Link from "next/link";
import Image from "next/image";

const STEAM_CDN = "https://cdn.akamai.steamstatic.com/steam/apps";

const ALL_GAMES = [
  {
    id: "aoe2" as const,
    title: "AoE II: DE",
    description:
      "Revivez le jeu de stratégie intemporel avec une communauté compétitive et accueillante.",
    href: "/aoe2",
    cover: `${STEAM_CDN}/813780/library_600x900.jpg`,
    fallbackBg: "var(--aoe-surface-2)",
  },
  {
    id: "aoe3" as const,
    title: "AoE III: DE",
    description:
      "Des batailles historiques intenses à l'époque des grandes découvertes.",
    href: "/aoe3",
    cover: `${STEAM_CDN}/933110/library_600x900.jpg`,
    fallbackBg: "var(--aoe-surface-2)",
  },
  {
    id: "aoe4" as const,
    title: "AoE IV",
    description:
      "Le dernier opus de la saga, entre stratégie, beauté et compétition.",
    href: "/aoe4",
    cover: `${STEAM_CDN}/1466860/library_600x900.jpg`,
    fallbackBg: "var(--aoe-surface-2)",
  },
  {
    id: "aom" as const,
    title: "AoM: Retold",
    description:
      "Dieux, mythes et légendes s'affrontent dans des batailles épiques.",
    href: "/aom-retold",
    cover: `${STEAM_CDN}/1934680/library_600x900.jpg`,
    fallbackBg: "var(--aoe-surface-2)",
  },
];

interface GameFeatures {
  aoe2: boolean;
  aoe3: boolean;
  aoe4: boolean;
  aom:  boolean;
}

interface Props {
  games?: GameFeatures;
}

export default function GameSection({ games }: Props) {
  const visible = games
    ? ALL_GAMES.filter((g) => games[g.id])
    : ALL_GAMES;

  if (visible.length === 0) return null;

  return (
    <section className="bg-background py-14 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h2 className="text-xl font-bold tracking-[0.2em] text-foreground uppercase">
            NOS UNIVERS
          </h2>
          <div className="mt-2 h-[2px] w-10 bg-[#c8a32e]" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {visible.map((game) => (
            <div
              key={game.id}
              className="group overflow-hidden border border-border-site hover:border-[#c8a32e]/50 transition-all duration-300 flex flex-col bg-surface"
            >
              <div
                className="relative h-52 overflow-hidden"
                style={{ background: game.fallbackBg }}
              >
                <Image
                  src={game.cover}
                  alt={game.title}
                  fill
                  className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-surface to-transparent" />
              </div>

              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-[15px] tracking-wider text-[#c8a32e] mb-2">
                  {game.title}
                </h3>
                <p className="text-muted text-[13px] leading-relaxed flex-1">
                  {game.description}
                </p>
                <Link
                  href={game.href}
                  className="mt-4 text-[11px] font-bold tracking-wider text-[#c8a32e] hover:text-[#e5bb44] transition-colors"
                >
                  EN SAVOIR PLUS →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
