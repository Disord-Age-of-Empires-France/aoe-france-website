export const ARTICLE_CATEGORIES = [
  { value: "AOE II",      label: "AOE II",      color: "purple", group: "game" },
  { value: "AOE III",     label: "AOE III",     color: "green",  group: "game" },
  { value: "AOE IV",      label: "AOE IV",      color: "blue",   group: "game" },
  { value: "AOM: RETOLD", label: "AOM: RETOLD", color: "amber",  group: "game" },
  { value: "COMMUNAUTÉ",  label: "COMMUNAUTÉ",  color: "amber",  group: "tag"  },
  { value: "GUIDE",       label: "GUIDE",       color: "green",  group: "tag"  },
  { value: "ÉVÉNEMENT",   label: "ÉVÉNEMENT",   color: "red",    group: "tag"  },
  { value: "TOURNOI",     label: "TOURNOI",     color: "purple", group: "tag"  },
  { value: "PATCH NOTES", label: "PATCH NOTES", color: "red",    group: "tag"  },
] as const;

export type ArticleStatus = "draft" | "published" | "archived";
