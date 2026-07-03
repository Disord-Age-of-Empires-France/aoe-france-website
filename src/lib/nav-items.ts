export type GameId    = "aoe2" | "aoe3" | "aoe4" | "aom";
export type SectionId = "news" | "guides" | "community";

export interface NavItem {
  key:   string;
  label: string;
  href?: string;  // override absolu ; sinon construit depuis la section parente
}

export const GAME_NAV_ITEMS: Record<GameId, NavItem[]> = {
  aoe2: [
    { key: "presentation",  label: "Présentation" },
    { key: "civilisations", label: "Civilisations" },
    { key: "guides",        label: "Guides" },
    { key: "tournois",      label: "Tournois" },
  ],
  aoe3: [
    { key: "presentation",  label: "Présentation" },
    { key: "civilisations", label: "Civilisations" },
    { key: "guides",        label: "Guides" },
    { key: "tournois",      label: "Tournois" },
  ],
  aoe4: [
    { key: "presentation",  label: "Présentation" },
    { key: "civilisations", label: "Civilisations" },
    { key: "guides",        label: "Guides" },
    { key: "tournois",      label: "Tournois" },
  ],
  aom: [
    { key: "presentation",  label: "Présentation" },
    { key: "dieux-majeurs", label: "Dieux majeurs" },
    { key: "guides",        label: "Guides" },
    { key: "tournois",      label: "Tournois" },
  ],
};

export const DEFAULT_GAME_NAV_ITEMS: Record<GameId, string[]> = {
  aoe2: ["presentation", "civilisations", "guides", "tournois"],
  aoe3: ["presentation", "civilisations", "guides", "tournois"],
  aoe4: ["presentation", "civilisations", "guides", "tournois"],
  aom:  ["presentation", "dieux-majeurs", "guides", "tournois"],
};

export const SECTION_NAV_ITEMS: Record<SectionId, NavItem[]> = {
  news: [
    { key: "patch-notes",  label: "Patch Notes" },
    { key: "evenements",   label: "Événements" },
    { key: "tournois",     label: "Tournois" },
  ],
  guides: [
    { key: "aoe2", label: "AoE II" },
    { key: "aoe3", label: "AoE III" },
    { key: "aoe4", label: "AoE IV" },
    { key: "aom",  label: "AoM" },
  ],
  community: [
    { key: "discord",      label: "Discord" },
    { key: "forum",        label: "Forum",       href: "/forum" },
    { key: "coaching",     label: "Coaching",    href: "/coaching" },
    { key: "tournois",     label: "Tournois" },
    { key: "evenements",   label: "Événements" },
    { key: "partenaires",  label: "Partenaires" },
  ],
};

export const DEFAULT_SECTION_NAV_ITEMS: Record<SectionId, string[]> = {
  news:      ["patch-notes", "evenements", "tournois"],
  guides:    ["aoe2", "aoe3", "aoe4", "aom"],
  community: ["discord", "forum", "coaching", "tournois", "evenements", "partenaires"],
};
