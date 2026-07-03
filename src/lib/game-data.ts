import { upsertGameCivilizations, upsertGameEntities, createGameSyncLog } from "./db";

type RawEntity = {
  civilization: string | null;
  type:         "unit" | "building" | "technology";
  slug:         string;
  name:         string;
  description?: string;
  iconUrl?:     string;
  category?:    string;
  age?:         string;
  stats?:       Record<string, unknown>;
};

export interface SyncResult {
  success: boolean;
  count:   number;
  source:  string;
  error?:  string;
}

// ─── AoE4 — GitHub data dump (aoe4world/data) + AoE4World stats API ──────────

const AOE4_STATS_URL  = "https://aoe4world.com/api/v0/games/statistics?leaderboard=rm_1v1";
const AOE4_DATA_BASE  = "https://raw.githubusercontent.com/aoe4world/data/main";

const AOE4_CIVS: Array<{ slug: string; name: string; dlc?: string }> = [
  { slug: "english",             name: "Anglais"               },
  { slug: "french",              name: "Français"              },
  { slug: "holy-roman-empire",   name: "Saint-Empire"          },
  { slug: "delhi-sultanate",     name: "Sultanat de Delhi"     },
  { slug: "mongols",             name: "Mongols"               },
  { slug: "chinese",             name: "Chinois"               },
  { slug: "rus",                 name: "Rus"                   },
  { slug: "abbasid-dynasty",     name: "Califat abbasside"     },
  { slug: "ottomans",            name: "Ottomans",             dlc: "DLC" },
  { slug: "malians",             name: "Maliens",              dlc: "DLC" },
  { slug: "japanese",            name: "Japonais",             dlc: "DLC" },
  { slug: "byzantines",          name: "Byzantins",            dlc: "DLC" },
  { slug: "ayyubids",            name: "Ayyoubides",           dlc: "DLC" },
  { slug: "zhu-xis-legacy",      name: "Héritage de Zhu Xi",  dlc: "Variant" },
  { slug: "jeannes-arc",         name: "Jeanne d'Arc",        dlc: "Variant" },
  { slug: "order-of-the-dragon", name: "Ordre du Dragon",     dlc: "Variant" },
  { slug: "house-of-lancaster",  name: "Maison de Lancaster",  dlc: "Variant" },
  { slug: "duchy-of-burgundy",   name: "Duché de Bourgogne",  dlc: "Variant" },
];

// Correspondance abréviation aoe4world → slug de notre DB
const AOE4_CIV_MAP: Record<string, string> = {
  en:  "english",
  fr:  "french",
  hr:  "holy-roman-empire",
  de:  "delhi-sultanate",
  mo:  "mongols",
  ch:  "chinese",
  ru:  "rus",
  ab:  "abbasid-dynasty",
  ot:  "ottomans",
  ma:  "malians",
  ja:  "japanese",
  by:  "byzantines",
  ay:  "ayyubids",
  zx:  "zhu-xis-legacy",
  je:  "jeannes-arc",
  od:  "order-of-the-dragon",
  hl:  "house-of-lancaster",
  bu:  "duchy-of-burgundy",
};

const AOE4_AGE_NAMES: Record<number, string> = {
  1: "Âge Sombre",
  2: "Âge Féodal",
  3: "Âge Châtelain",
  4: "Âge Impérial",
};

interface Aoe4Unit {
  id:             string;
  baseId:         string;
  name:           string;
  civs:           string[];
  age:            number;
  unique:         boolean;
  costs:          Record<string, number>;
  hitpoints:      number;
  weapons:        Array<{ name?: string; damage: number; speed: number; range?: { min: number; max: number } }>;
  armor:          Array<{ type: string; value: number }>;
  displayClasses?: string[];
  description?:   string;
  icon?:          string;
  movement?:      { speed: number };
  producedBy?:    string[];
}

interface Aoe4Building {
  id:           string;
  name:         string;
  civs:         string[];
  unique:       boolean;
  minAge:       number;
  description?: string;
  icon?:        string;
}

interface Aoe4Technology {
  id:              string;
  name:            string;
  civs:            string[];
  unique:          boolean;
  minAge:          number;
  costs?:          Record<string, number>;
  displayClasses?: string[];
  description?:    string;
  icon?:           string;
}

async function fetchAoe4Json<T>(path: string): Promise<T[] | null> {
  try {
    const resp = await fetch(`${AOE4_DATA_BASE}/${path}`, { cache: "no-store" });
    if (!resp.ok) return null;
    const json = await resp.json() as { data?: T[] } | T[];
    // La racine est soit un tableau direct, soit { data: [...] }
    if (Array.isArray(json)) return json;
    if (json && typeof json === "object" && "data" in json && Array.isArray(json.data)) return json.data;
    return null;
  } catch { return null; }
}

function aoe4UnitToEntity(unit: Aoe4Unit, civilization: string | null): RawEntity {
  const weapon = unit.weapons?.[0];
  const stats: Record<string, unknown> = { hp: unit.hitpoints };
  if (weapon) {
    stats.attack = weapon.damage;
    if (weapon.range?.max) stats.range = weapon.range.max;
    if (weapon.speed > 0) {
      stats.attackSpeed = weapon.speed;
      stats.dps = Math.round((weapon.damage / weapon.speed) * 10) / 10;
    }
    if (weapon.name) stats.weaponName = weapon.name;
  }
  if (unit.armor?.length) {
    stats.armor = Object.fromEntries(unit.armor.map(a => [a.type, a.value]));
  }
  if (unit.costs) {
    const { time, total, popcap, ...resources } = unit.costs;
    const cost = Object.fromEntries(Object.entries(resources).filter(([, v]) => v > 0));
    if (Object.keys(cost).length) stats.cost = cost;
    if (time > 0) stats.trainTime = time;
  }
  if (unit.movement?.speed) stats.moveSpeed = unit.movement.speed;
  if (unit.producedBy?.length) stats.producedBy = unit.producedBy;
  return {
    civilization,
    type:        "unit",
    slug:        unit.id,
    name:        unit.name,
    description: unit.description ?? "",
    iconUrl:     unit.icon ?? "",
    category:    unit.displayClasses?.[0] ?? "Unité",
    age:         AOE4_AGE_NAMES[unit.age] ?? `Âge ${unit.age}`,
    stats,
  };
}

async function buildAoe4Entities(): Promise<RawEntity[]> {
  const [rawUnits, rawBuildings, rawTechs] = await Promise.all([
    fetchAoe4Json<Aoe4Unit>("units/all-unified.json"),
    fetchAoe4Json<Aoe4Building>("buildings/all-unified.json"),
    fetchAoe4Json<Aoe4Technology>("technologies/all-unified.json"),
  ]);

  const entities: RawEntity[] = [];

  // ── Unités ──────────────────────────────────────────────────────────────────
  if (rawUnits) {
    // Unités partagées : garder uniquement l'âge max par baseId
    const sharedLatest = new Map<string, Aoe4Unit>();
    for (const u of rawUnits) {
      if (u.unique) continue;
      if (!u.civs.some(c => AOE4_CIV_MAP[c])) continue;
      const prev = sharedLatest.get(u.baseId);
      if (!prev || u.age > prev.age) sharedLatest.set(u.baseId, u);
    }
    for (const u of sharedLatest.values()) {
      entities.push(aoe4UnitToEntity(u, null));
    }

    // Unités uniques (spécifiques à une civ)
    for (const u of rawUnits) {
      if (!u.unique) continue;
      const civSlug = u.civs.map(c => AOE4_CIV_MAP[c]).find(Boolean);
      if (!civSlug) continue;
      entities.push(aoe4UnitToEntity(u, civSlug));
    }
  }

  // ── Bâtiments uniques ────────────────────────────────────────────────────────
  if (rawBuildings) {
    for (const b of rawBuildings) {
      if (!b.unique) continue;
      const civSlug = b.civs.map(c => AOE4_CIV_MAP[c]).find(Boolean);
      if (!civSlug) continue;
      entities.push({
        civilization: civSlug,
        type:         "building",
        slug:         b.id,
        name:         b.name,
        description:  b.description ?? "",
        iconUrl:      b.icon ?? "",
        category:     "Bâtiment unique",
        age:          AOE4_AGE_NAMES[b.minAge] ?? `Âge ${b.minAge}`,
        stats:        {},
      });
    }
  }

  // ── Technologies uniques ──────────────────────────────────────────────────────
  if (rawTechs) {
    for (const t of rawTechs) {
      if (!t.unique) continue;
      const civSlug = t.civs.map(c => AOE4_CIV_MAP[c]).find(Boolean);
      if (!civSlug) continue;
      const stats: Record<string, unknown> = {};
      if (t.costs) {
        const { time, total, popcap, ...resources } = t.costs;
        const cost = Object.fromEntries(Object.entries(resources).filter(([, v]) => v > 0));
        if (Object.keys(cost).length) stats.cost = cost;
        if (time > 0) stats.researchTime = time;
      }
      if (t.description) stats.effect = t.description;
      entities.push({
        civilization: civSlug,
        type:         "technology",
        slug:         t.id,
        name:         t.name,
        description:  "",
        iconUrl:      t.icon ?? "",
        category:     t.displayClasses?.[0] ?? "Technologie",
        age:          AOE4_AGE_NAMES[t.minAge] ?? `Âge ${t.minAge}`,
        stats,
      });
    }
  }

  return entities;
}

export async function syncAoe4(): Promise<SyncResult> {
  const source = `aoe4world/data (GitHub) + ${AOE4_STATS_URL}`;

  // 1. Stats compétitives (optionnel, échec silencieux)
  const statsMap = new Map<string, { win_rate?: number; pick_rate?: number; games_count?: number }>();
  try {
    const resp = await fetch(AOE4_STATS_URL, { cache: "no-store" });
    if (resp.ok) {
      const json = await resp.json();
      const apiCivs: Array<{ key?: string; civilization?: string; win_rate?: number; pick_rate?: number; games_count?: number }> =
        json.civilizations ?? json.data ?? json.civ_stats ?? [];
      for (const c of apiCivs) {
        const key = c.key ?? c.civilization;
        if (key) statsMap.set(key, c);
      }
    }
  } catch { /* API indisponible */ }

  // 2. Entités depuis GitHub (optionnel, échec silencieux)
  const entities = await buildAoe4Entities();

  // 3. Upsert des civs + entités
  const civs = AOE4_CIVS.map(c => {
    const s = statsMap.get(c.slug);
    return {
      slug:       c.slug,
      name:       c.name,
      dlc:        c.dlc ?? null,
      winRate:    s?.win_rate    != null ? Number(s.win_rate)          : null,
      pickRate:   s?.pick_rate   != null ? Number(s.pick_rate) * 100   : null,
      gamesCount: s?.games_count != null ? Number(s.games_count)       : null,
    };
  });

  try {
    const count = await upsertGameCivilizations("aoe4", civs);
    if (entities.length) await upsertGameEntities("aoe4", entities);
    const notes: string[] = [];
    if (!statsMap.size) notes.push("stats API indisponible");
    if (!entities.length) notes.push("GitHub data indisponible");
    await createGameSyncLog({
      game: "aoe4", source, status: "success", recordsUpdated: count,
      error: notes.length ? notes.join(", ") : null,
      syncedAt: new Date().toISOString(),
    });
    return { success: true, count, source };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await createGameSyncLog({ game: "aoe4", source, status: "error", recordsUpdated: 0, error, syncedAt: new Date().toISOString() });
    return { success: false, count: 0, source, error };
  }
}

// ─── AoE2 — données statiques + enrichissement aoe2.net ──────────────────────

const AOE2_CIVS: Array<{ slug: string; name: string }> = [
  { slug: "britons",      name: "Britanniques" }, { slug: "byzantines",  name: "Byzantins"    },
  { slug: "celts",        name: "Celtes"        }, { slug: "chinese",     name: "Chinois"      },
  { slug: "franks",       name: "Francs"        }, { slug: "goths",       name: "Goths"        },
  { slug: "japanese",     name: "Japonais"      }, { slug: "mongols",     name: "Mongols"      },
  { slug: "persians",     name: "Perses"        }, { slug: "saracens",    name: "Sarrasins"    },
  { slug: "spanish",      name: "Espagnols"     }, { slug: "teutons",     name: "Teutons"      },
  { slug: "turks",        name: "Turcs"         }, { slug: "vikings",     name: "Vikings"      },
  { slug: "aztecs",       name: "Aztèques"      }, { slug: "mayans",      name: "Mayas"        },
  { slug: "huns",         name: "Huns"          }, { slug: "koreans",     name: "Coréens"      },
  { slug: "italians",     name: "Italiens"      }, { slug: "indians",     name: "Indiens"      },
  { slug: "incas",        name: "Incas"         }, { slug: "magyars",     name: "Magyars"      },
  { slug: "slavs",        name: "Slaves"        }, { slug: "berbers",     name: "Berbères"     },
  { slug: "ethiopians",   name: "Éthiopiens"    }, { slug: "malians",     name: "Maliens"      },
  { slug: "portuguese",   name: "Portugais"     }, { slug: "burmese",     name: "Birmans"      },
  { slug: "khmer",        name: "Khmers"        }, { slug: "malay",       name: "Malais"       },
  { slug: "vietnamese",   name: "Vietnamiens"   }, { slug: "bulgarians",  name: "Bulgares"     },
  { slug: "cumans",       name: "Coumans"       }, { slug: "lithuanians", name: "Lituaniens"   },
  { slug: "tatars",       name: "Tatars"        }, { slug: "poles",       name: "Polonais"     },
  { slug: "bohemians",    name: "Bohémiens"     }, { slug: "burgundians", name: "Bourguignons" },
  { slug: "sicilians",    name: "Siciliens"     }, { slug: "armenians",   name: "Arméniens"    },
  { slug: "georgians",    name: "Géorgiens"     }, { slug: "romans",      name: "Romains"      },
  { slug: "gurjaras",     name: "Gurjaras"      }, { slug: "bengalis",    name: "Bengalis"     },
  { slug: "dravidians",   name: "Dravidiens"    }, { slug: "hindustanis", name: "Hindustani"   },
];

const AOE2_UNIQUE_UNITS: RawEntity[] = [
  { civilization:"britons",      type: "unit", slug: "longbowman",       name: "Archer Longbow",       category: "Infanterie à distance", age: "Châtelain", stats: { hp: 35, attack: 6, range: 7, cost: { food: 35, gold: 40 }, trainTime: 18 } },
  { civilization:"byzantines",   type: "unit", slug: "cataphract",        name: "Cataphracte",           category: "Cavalerie lourde",       age: "Impérial",  stats: { hp: 150, attack: 9, armor: { melee: 2, ranged: 1 }, cost: { food: 70, gold: 75 }, trainTime: 20 } },
  { civilization:"celts",        type: "unit", slug: "woad-raider",       name: "Guerrier Woad",         category: "Infanterie",             age: "Châtelain", stats: { hp: 65, attack: 8, armor: { melee: 0, ranged: 1 }, cost: { food: 65, gold: 25 }, trainTime: 10 } },
  { civilization:"chinese",      type: "unit", slug: "cho-ko-nu",         name: "Cho-ko-nu",             category: "Infanterie à distance",  age: "Châtelain", stats: { hp: 45, attack: 8, range: 4, cost: { food: 40, gold: 35 }, trainTime: 16 } },
  { civilization:"franks",       type: "unit", slug: "throwing-axeman",   name: "Lanceur de Haches",     category: "Infanterie à distance",  age: "Châtelain", stats: { hp: 70, attack: 7, range: 3, cost: { food: 55, gold: 25 }, trainTime: 17 } },
  { civilization:"goths",        type: "unit", slug: "huskarl",           name: "Huskarl",               category: "Infanterie lourde",      age: "Châtelain", stats: { hp: 60, attack: 10, armor: { melee: 0, ranged: 6 }, cost: { food: 80, gold: 40 }, trainTime: 14 } },
  { civilization:"japanese",     type: "unit", slug: "samurai",           name: "Samouraï",              category: "Infanterie lourde",      age: "Châtelain", stats: { hp: 60, attack: 12, armor: { melee: 1, ranged: 1 }, cost: { food: 60, gold: 30 }, trainTime: 9 } },
  { civilization:"mongols",      type: "unit", slug: "mangudai",          name: "Mangudai",              category: "Cavalerie à distance",   age: "Châtelain", stats: { hp: 60, attack: 6, range: 4, cost: { food: 55, gold: 65 }, trainTime: 26 } },
  { civilization:"persians",     type: "unit", slug: "war-elephant",      name: "Éléphant de Guerre",    category: "Cavalerie unique",       age: "Impérial",  stats: { hp: 450, attack: 15, armor: { melee: 1, ranged: 2 }, cost: { food: 200, gold: 75 }, trainTime: 31 } },
  { civilization:"saracens",     type: "unit", slug: "mameluke",          name: "Mameluk",               category: "Cavalerie à distance",   age: "Châtelain", stats: { hp: 65, attack: 8, range: 3, cost: { food: 55, gold: 85 }, trainTime: 23 } },
  { civilization:"spanish",      type: "unit", slug: "conquistador",      name: "Conquistador",          category: "Cavalerie à distance",   age: "Châtelain", stats: { hp: 80, attack: 16, range: 6, cost: { food: 60, gold: 70 }, trainTime: 24 } },
  { civilization:"teutons",      type: "unit", slug: "teutonic-knight",   name: "Chevalier Teutonique",  category: "Infanterie lourde",      age: "Châtelain", stats: { hp: 100, attack: 17, armor: { melee: 5, ranged: 2 }, cost: { food: 85, gold: 40 }, trainTime: 12 } },
  { civilization:"turks",        type: "unit", slug: "janissary",         name: "Janissaire",            category: "Infanterie à distance",  age: "Châtelain", stats: { hp: 60, attack: 17, range: 8, cost: { food: 60, gold: 55 }, trainTime: 17 } },
  { civilization:"vikings",      type: "unit", slug: "berserk",           name: "Berserk",               category: "Infanterie",             age: "Châtelain", stats: { hp: 72, attack: 9, armor: { melee: 1, ranged: 1 }, cost: { food: 65, gold: 25 }, trainTime: 14 } },
  { civilization:"aztecs",       type: "unit", slug: "jaguar-warrior",    name: "Guerrier Jaguar",       category: "Infanterie lourde",      age: "Châtelain", stats: { hp: 75, attack: 11, armor: { melee: 1, ranged: 0 }, cost: { food: 60, gold: 30 }, trainTime: 13 } },
  { civilization:"mayans",       type: "unit", slug: "plumed-archer",     name: "Archer à Plumes",       category: "Infanterie à distance",  age: "Châtelain", stats: { hp: 65, attack: 5, range: 4, cost: { food: 46, gold: 48 }, trainTime: 16 } },
  { civilization:"huns",         type: "unit", slug: "tarkan",            name: "Tarkan",                category: "Cavalerie",              age: "Châtelain", stats: { hp: 100, attack: 8, armor: { melee: 1, ranged: 3 }, cost: { food: 60, gold: 60 }, trainTime: 14 } },
  { civilization:"koreans",      type: "unit", slug: "war-wagon",         name: "Chariot de Guerre",     category: "Cavalerie à distance",   age: "Châtelain", stats: { hp: 150, attack: 9, range: 4, cost: { food: 110, gold: 60 }, trainTime: 21 } },
  { civilization:"italians",     type: "unit", slug: "genoese-crossbow",  name: "Arbalétrier Génois",    category: "Infanterie à distance",  age: "Châtelain", stats: { hp: 45, attack: 6, range: 4, cost: { food: 45, gold: 40 }, trainTime: 22 } },
  { civilization:"indians",      type: "unit", slug: "elephant-archer",   name: "Archer à Éléphant",     category: "Cavalerie à distance",   age: "Châtelain", stats: { hp: 280, attack: 6, range: 4, cost: { food: 100, gold: 80 }, trainTime: 25 } },
  { civilization:"incas",        type: "unit", slug: "kamayuk",           name: "Kamayuk",               category: "Infanterie",             age: "Châtelain", stats: { hp: 60, attack: 7, range: 1, cost: { food: 60, gold: 30 }, trainTime: 10 } },
  { civilization:"magyars",      type: "unit", slug: "magyar-huszar",     name: "Hussard Magyar",        category: "Cavalerie",              age: "Châtelain", stats: { hp: 85, attack: 10, armor: { melee: 2, ranged: 3 }, cost: { food: 80, gold: 10 }, trainTime: 15 } },
  { civilization:"slavs",        type: "unit", slug: "boyar",             name: "Boïar",                 category: "Cavalerie lourde",       age: "Impérial",  stats: { hp: 130, attack: 12, armor: { melee: 4, ranged: 2 }, cost: { food: 50, gold: 80 }, trainTime: 23 } },
  { civilization:"berbers",      type: "unit", slug: "camel-archer",      name: "Archer Chamelier",      category: "Cavalerie à distance",   age: "Châtelain", stats: { hp: 60, attack: 7, range: 4, cost: { food: 50, gold: 60 }, trainTime: 25 } },
  { civilization:"ethiopians",   type: "unit", slug: "shotel-warrior",    name: "Guerrier Shotel",       category: "Infanterie",             age: "Châtelain", stats: { hp: 50, attack: 16, armor: { melee: 0, ranged: 0 }, cost: { food: 50, gold: 35 }, trainTime: 8 } },
  { civilization:"malians",      type: "unit", slug: "gbeto",             name: "Gbeto",                 category: "Infanterie à distance",  age: "Châtelain", stats: { hp: 30, attack: 10, range: 5, cost: { food: 40, gold: 30 }, trainTime: 17 } },
  { civilization:"portuguese",   type: "unit", slug: "organ-gun",         name: "Canon à Orgue",         category: "Artillerie unique",      age: "Impérial",  stats: { hp: 60, attack: 16, range: 7, cost: { wood: 70, gold: 80 }, trainTime: 21 } },
  { civilization:"burmese",      type: "unit", slug: "arambai",           name: "Arambai",               category: "Cavalerie à distance",   age: "Châtelain", stats: { hp: 80, attack: 12, range: 5, cost: { food: 80, gold: 60 }, trainTime: 21 } },
  { civilization:"khmer",        type: "unit", slug: "ballista-elephant", name: "Éléphant Baliste",      category: "Artillerie à dos",       age: "Impérial",  stats: { hp: 250, attack: 16, range: 5, cost: { food: 100, gold: 80 }, trainTime: 25 } },
  { civilization:"malay",        type: "unit", slug: "karambit-warrior",  name: "Guerrier Karambit",     category: "Infanterie",             age: "Châtelain", stats: { hp: 30, attack: 7, armor: { melee: 1, ranged: 0 }, cost: { food: 30, gold: 15 }, trainTime: 6 } },
  { civilization:"vietnamese",   type: "unit", slug: "rattan-archer",     name: "Archer en Rotin",       category: "Infanterie à distance",  age: "Châtelain", stats: { hp: 45, attack: 6, range: 4, cost: { food: 50, gold: 45 }, trainTime: 16 } },
  { civilization:"bulgarians",   type: "unit", slug: "konnik",            name: "Konnik",                category: "Cavalerie lourde",       age: "Châtelain", stats: { hp: 100, attack: 12, armor: { melee: 1, ranged: 1 }, cost: { food: 60, gold: 70 }, trainTime: 19 } },
  { civilization:"cumans",       type: "unit", slug: "kipchak",           name: "Kipchak",               category: "Cavalerie à distance",   age: "Châtelain", stats: { hp: 60, attack: 4, range: 4, cost: { food: 60, gold: 35 }, trainTime: 20 } },
  { civilization:"lithuanians",  type: "unit", slug: "leitis",            name: "Leitis",                category: "Cavalerie lourde",       age: "Châtelain", stats: { hp: 100, attack: 12, armor: { melee: 3, ranged: 2 }, cost: { food: 70, gold: 50 }, trainTime: 20 } },
  { civilization:"tatars",       type: "unit", slug: "keshik",            name: "Keshik",                category: "Cavalerie",              age: "Châtelain", stats: { hp: 100, attack: 9, armor: { melee: 1, ranged: 2 }, cost: { food: 60, gold: 40 }, trainTime: 20 } },
  { civilization:"poles",        type: "unit", slug: "obuch",             name: "Obuch",                 category: "Infanterie lourde",      age: "Châtelain", stats: { hp: 80, attack: 10, armor: { melee: 1, ranged: 0 }, cost: { food: 60, gold: 20 }, trainTime: 12 } },
  { civilization:"bohemians",    type: "unit", slug: "hussite-wagon",     name: "Chariot Hussite",       category: "Artillerie",             age: "Châtelain", stats: { hp: 220, attack: 14, range: 7, cost: { food: 110, wood: 60 }, trainTime: 25 } },
  { civilization:"burgundians",  type: "unit", slug: "coustillier",       name: "Coustillier",           category: "Cavalerie",              age: "Châtelain", stats: { hp: 100, attack: 12, armor: { melee: 2, ranged: 2 }, cost: { food: 70, gold: 50 }, trainTime: 20 } },
  { civilization:"sicilians",    type: "unit", slug: "serjeant",          name: "Sergent",               category: "Infanterie lourde",      age: "Châtelain", stats: { hp: 65, attack: 8, armor: { melee: 2, ranged: 1 }, cost: { food: 60, gold: 35 }, trainTime: 12 } },
  { civilization:"armenians",    type: "unit", slug: "composite-bowman",  name: "Archer Composite",      category: "Infanterie à distance",  age: "Châtelain", stats: { hp: 55, attack: 6, range: 5, cost: { food: 40, gold: 45 }, trainTime: 18 } },
  { civilization:"georgians",    type: "unit", slug: "monaspa",           name: "Monaspa",               category: "Cavalerie lourde",       age: "Châtelain", stats: { hp: 110, attack: 13, armor: { melee: 3, ranged: 2 }, cost: { food: 80, gold: 50 }, trainTime: 21 } },
  { civilization:"romans",       type: "unit", slug: "legionary",         name: "Légionnaire",           category: "Infanterie lourde",      age: "Châtelain", stats: { hp: 75, attack: 9, armor: { melee: 2, ranged: 1 }, cost: { food: 60, gold: 30 }, trainTime: 12 } },
  { civilization:"gurjaras",     type: "unit", slug: "shrivamsha-rider",  name: "Cavalier Shrivamsha",   category: "Cavalerie",              age: "Châtelain", stats: { hp: 80, attack: 9, armor: { melee: 0, ranged: 3 }, cost: { food: 55, gold: 35 }, trainTime: 16 } },
  { civilization:"bengalis",     type: "unit", slug: "ratha",             name: "Ratha",                 category: "Cavalerie à distance",   age: "Châtelain", stats: { hp: 130, attack: 9, range: 4, cost: { food: 80, gold: 60 }, trainTime: 21 } },
  { civilization:"dravidians",   type: "unit", slug: "urumi-swordsman",   name: "Épéiste Urumi",         category: "Infanterie",             age: "Châtelain", stats: { hp: 70, attack: 7, armor: { melee: 0, ranged: 0 }, cost: { food: 60, gold: 30 }, trainTime: 12 } },
  { civilization:"hindustanis",  type: "unit", slug: "ghulam",            name: "Ghulam",                category: "Infanterie lourde",      age: "Châtelain", stats: { hp: 70, attack: 10, armor: { melee: 4, ranged: 6 }, cost: { food: 50, gold: 35 }, trainTime: 12 } },
];

export async function syncAoe2(): Promise<SyncResult> {
  const source = "static + aoe2.net";

  // Tenter d'enrichir avec les stats de l'API aoe2.net (optionnel)
  let statsMap = new Map<string, { win_rate: number; pick_rate: number; num_games_played: number }>();
  try {
    const resp = await fetch("https://aoe2.net/api/stats/civ?game=aoe2de&leaderboard_id=3", { cache: "no-store" });
    if (resp.ok) {
      const json = await resp.json();
      const civStats: Array<{ civ_id: number; civ: string; win_rate: number; pick_rate: number; num_games_played: number }> =
        json?.civ_wins ?? json ?? [];
      for (const s of civStats) {
        const key = String(s.civ ?? "").toLowerCase().replace(/\s+/g, "-");
        if (key) statsMap.set(key, s);
      }
    }
  } catch { /* API indisponible */ }

  const civs = AOE2_CIVS.map(c => {
    const stats = statsMap.get(c.slug);
    return {
      slug:       c.slug,
      name:       c.name,
      winRate:    stats?.win_rate        != null ? Number(stats.win_rate)          : null,
      pickRate:   stats?.pick_rate       != null ? Number(stats.pick_rate) * 100   : null,
      gamesCount: stats?.num_games_played != null ? Number(stats.num_games_played) : null,
    };
  });

  try {
    const count = await upsertGameCivilizations("aoe2", civs);
    await upsertGameEntities("aoe2", AOE2_UNIQUE_UNITS);
    await createGameSyncLog({ game: "aoe2", source, status: "success", recordsUpdated: count, error: null, syncedAt: new Date().toISOString() });
    return { success: true, count, source };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await createGameSyncLog({ game: "aoe2", source, status: "error", recordsUpdated: 0, error, syncedAt: new Date().toISOString() });
    return { success: false, count: 0, source, error };
  }
}

// ─── AoE3 — données statiques ─────────────────────────────────────────────────

const AOE3_CIVS = [
  { slug: "british",           name: "Britanniques" },
  { slug: "french",            name: "Français" },
  { slug: "spanish",           name: "Espagnols" },
  { slug: "portuguese",        name: "Portugais" },
  { slug: "german",            name: "Allemands" },
  { slug: "dutch",             name: "Néerlandais" },
  { slug: "ottoman",           name: "Ottomans" },
  { slug: "russian",           name: "Russes" },
  { slug: "aztec",             name: "Aztèques" },
  { slug: "haudenosaunee",     name: "Haudenosaunee" },
  { slug: "lakota",            name: "Lakotas" },
  { slug: "chinese",           name: "Chinois" },
  { slug: "japanese",          name: "Japonais" },
  { slug: "inca",              name: "Incas" },
  { slug: "indian",            name: "Indiens" },
  { slug: "swede",             name: "Suédois" },
  { slug: "ethiopian",         name: "Éthiopiens",  dlc: "Les Royaumes d'Afrique" },
  { slug: "hausa",             name: "Haussa",      dlc: "Les Royaumes d'Afrique" },
  { slug: "mexican",           name: "Mexicains",   dlc: "Mexique" },
  { slug: "italian",           name: "Italiens",    dlc: "Chevaliers de la Méditerranée" },
  { slug: "maltese",           name: "Maltais",     dlc: "Chevaliers de la Méditerranée" },
  { slug: "american",          name: "Américains",  dlc: "La Révolution américaine" },
];

const AOE3_ENTITIES: RawEntity[] = [
  { civilization:"british",      type: "unit", slug: "longbowman",    name: "Archer Longbow",        category: "Infanterie à distance", age: "Colonisation", stats: { hp: 100, attack: 14, range: 20, cost: { food: 120, wood: 50 }, trainTime: 25 } },
  { civilization:"british",      type: "unit", slug: "rocket",        name: "Fusée Congreve",        category: "Artillerie unique",     age: "Industrie",    stats: { hp: 100, attack: 50, range: 22, cost: { food: 0, wood: 0, coin: 350 }, trainTime: 45 } },
  { civilization:"french",       type: "unit", slug: "cuirassier",    name: "Cuirassier",            category: "Cavalerie lourde",      age: "Colonisation", stats: { hp: 540, attack: 42, armor: { melee: 30, ranged: 10 }, cost: { food: 170, coin: 170 }, trainTime: 40 } },
  { civilization:"spanish",      type: "unit", slug: "lancer",        name: "Lancero",               category: "Cavalerie",             age: "Colonisation", stats: { hp: 270, attack: 24, armor: { melee: 20 }, cost: { food: 100, coin: 90 }, trainTime: 25 } },
  { civilization:"portuguese",   type: "unit", slug: "cassador",      name: "Caçador",               category: "Infanterie à distance", age: "Colonisation", stats: { hp: 130, attack: 18, range: 18, cost: { food: 100, coin: 80 }, trainTime: 20 } },
  { civilization:"german",       type: "unit", slug: "doppelsoldner", name: "Doppelsöldner",         category: "Infanterie lourde",     age: "Colonisation", stats: { hp: 360, attack: 30, armor: { melee: 30 }, cost: { food: 0, coin: 160 }, trainTime: 25 } },
  { civilization:"dutch",        type: "unit", slug: "ruyter",        name: "Ruyter",                category: "Cavalerie à distance",  age: "Colonisation", stats: { hp: 270, attack: 16, range: 16, cost: { food: 60, coin: 110 }, trainTime: 30 } },
  { civilization:"ottoman",      type: "unit", slug: "janissary",     name: "Janissaire",            category: "Infanterie à distance", age: "Colonisation", stats: { hp: 160, attack: 22, range: 18, cost: { food: 100, coin: 65 }, trainTime: 20 } },
  { civilization:"russian",      type: "unit", slug: "strelet",       name: "Strelet",               category: "Infanterie à distance", age: "Colonisation", stats: { hp: 120, attack: 12, range: 16, cost: { food: 60, wood: 60 }, trainTime: 18 } },
  { civilization:"aztec",        type: "unit", slug: "jaguar-prowl-knight", name: "Chevalier Jaguar", category: "Infanterie lourde",    age: "Colonisation", stats: { hp: 300, attack: 26, armor: { melee: 30 }, cost: { food: 140, coin: 110 }, trainTime: 25 } },
  { civilization:"haudenosaunee",type: "unit", slug: "mantlet",       name: "Mantelet",             category: "Infanterie",             age: "Colonisation", stats: { hp: 200, attack: 18, armor: { ranged: 30 }, cost: { food: 100, wood: 80 }, trainTime: 22 } },
  { civilization:"lakota",       type: "unit", slug: "wakina-rifle",  name: "Carabine Wakina",      category: "Infanterie à distance",  age: "Colonisation", stats: { hp: 140, attack: 20, range: 20, cost: { food: 100, coin: 70 }, trainTime: 20 } },
  { civilization:"chinese",      type: "unit", slug: "arquebusier",   name: "Arquebusier",           category: "Infanterie à distance", age: "Colonisation", stats: { hp: 140, attack: 16, range: 16, cost: { food: 80, coin: 80 }, trainTime: 20 } },
  { civilization:"japanese",     type: "unit", slug: "yumi-archer",   name: "Archer Yumi",           category: "Infanterie à distance", age: "Colonisation", stats: { hp: 120, attack: 14, range: 18, cost: { food: 100, coin: 60 }, trainTime: 20 } },
  { civilization:"inca",         type: "unit", slug: "bola-warrior",  name: "Guerrier à Bolas",      category: "Infanterie à distance", age: "Colonisation", stats: { hp: 130, attack: 15, range: 16, cost: { food: 80, coin: 60 }, trainTime: 20 } },
  { civilization:"indian",       type: "unit", slug: "zamburak",      name: "Zamburak",              category: "Cavalerie à distance",  age: "Colonisation", stats: { hp: 200, attack: 14, range: 18, cost: { food: 80, coin: 100 }, trainTime: 28 } },
  { civilization:"swede",        type: "unit", slug: "caroleans",     name: "Caroléen",              category: "Infanterie",            age: "Colonisation", stats: { hp: 180, attack: 18, armor: { melee: 20 }, cost: { food: 70, coin: 70 }, trainTime: 22 } },
  { civilization:"ethiopian",    type: "unit", slug: "neftenya",      name: "Neftenya",              category: "Infanterie à distance", age: "Colonisation", stats: { hp: 150, attack: 16, range: 18, cost: { food: 80, coin: 80 }, trainTime: 20 } },
  { civilization:"hausa",        type: "unit", slug: "lifidi-knight", name: "Cavalier Lifidi",       category: "Cavalerie lourde",      age: "Colonisation", stats: { hp: 400, attack: 28, armor: { ranged: 30 }, cost: { food: 100, coin: 150 }, trainTime: 35 } },
  { civilization:"mexican",      type: "unit", slug: "insurgente",    name: "Insurgent",             category: "Infanterie",            age: "Colonisation", stats: { hp: 120, attack: 12, range: 14, cost: { food: 60, coin: 60 }, trainTime: 18 } },
  { civilization:"italian",      type: "unit", slug: "bersagliere",   name: "Bersagliere",           category: "Infanterie à distance", age: "Colonisation", stats: { hp: 145, attack: 19, range: 18, cost: { food: 100, coin: 75 }, trainTime: 20 } },
  { civilization:"maltese",      type: "unit", slug: "hospitaller",   name: "Hospitalier",           category: "Infanterie lourde",     age: "Colonisation", stats: { hp: 220, attack: 20, armor: { melee: 30, ranged: 20 }, cost: { food: 100, coin: 100 }, trainTime: 25 } },
  { civilization:"american",     type: "unit", slug: "minute-man",    name: "Milicien",              category: "Infanterie",            age: "Colonisation", stats: { hp: 140, attack: 16, range: 16, cost: { food: 60, coin: 60 }, trainTime: 18 } },
];

export async function syncAoe3(): Promise<SyncResult> {
  const source = "static";
  try {
    const count = await upsertGameCivilizations("aoe3", AOE3_CIVS);
    await upsertGameEntities("aoe3", AOE3_ENTITIES);
    await createGameSyncLog({ game: "aoe3", source, status: "success", recordsUpdated: count, error: null, syncedAt: new Date().toISOString() });
    return { success: true, count, source };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await createGameSyncLog({ game: "aoe3", source, status: "error", recordsUpdated: 0, error, syncedAt: new Date().toISOString() });
    return { success: false, count: 0, source, error };
  }
}

// ─── AoM Retold — données statiques ──────────────────────────────────────────

const AOM_GODS = [
  // Grecs
  { slug: "zeus",     name: "Zeus",     data: { pantheon: "Grecs" } },
  { slug: "poseidon", name: "Poseidon", data: { pantheon: "Grecs" } },
  { slug: "hades",    name: "Hadès",    data: { pantheon: "Grecs" } },
  // Égyptiens
  { slug: "ra",       name: "Rà",       data: { pantheon: "Égyptiens" } },
  { slug: "isis",     name: "Isis",     data: { pantheon: "Égyptiens" } },
  { slug: "set",      name: "Set",      data: { pantheon: "Égyptiens" } },
  // Nordiques
  { slug: "thor",     name: "Thor",     data: { pantheon: "Nordiques" } },
  { slug: "odin",     name: "Odin",     data: { pantheon: "Nordiques" } },
  { slug: "loki",     name: "Loki",     data: { pantheon: "Nordiques" } },
  // Atlantes
  { slug: "kronos",   name: "Kronos",   data: { pantheon: "Atlantes" } },
  { slug: "gaia",     name: "Gaïa",     data: { pantheon: "Atlantes" } },
  { slug: "oranos",   name: "Oranos",   data: { pantheon: "Atlantes" } },
  // Chinois (Retold)
  { slug: "fuxi",     name: "Fuxi",     data: { pantheon: "Chinois" }, dlc: "Retold" },
  { slug: "nuwa",     name: "Nüwa",     data: { pantheon: "Chinois" }, dlc: "Retold" },
  { slug: "shennong", name: "Shennong", data: { pantheon: "Chinois" }, dlc: "Retold" },
];

const AOM_ENTITIES: RawEntity[] = [
  // ── Grecs : Zeus ──────────────────────────────────────────────────────────
  { civilization:"zeus",     type: "unit", slug: "hoplite",        name: "Hoplite",           category: "Infanterie",           age: "Archaïque", stats: { hp: 90, attack: 9, armor: { hack: 50, pierce: 10, crush: 15 }, cost: { food: 60, wood: 0, gold: 0, favor: 0 }, trainTime: 10 } },
  { civilization:"zeus",     type: "unit", slug: "cyclops",        name: "Cyclope",           category: "Unité mythologique",   age: "Héroïque",  stats: { hp: 1000, attack: 50, cost: { favor: 24 }, trainTime: 14 } },
  // ── Grecs : Poseidon ──────────────────────────────────────────────────────
  { civilization:"poseidon", type: "unit", slug: "hippocampus",    name: "Hippocampe",        category: "Unité navale mythique", age: "Héroïque",  stats: { hp: 600, attack: 40, cost: { favor: 18 }, trainTime: 12 } },
  { civilization:"poseidon", type: "unit", slug: "cavalry",        name: "Cavalerie Légère",  category: "Cavalerie",            age: "Classique", stats: { hp: 120, attack: 12, cost: { food: 80, gold: 0 }, trainTime: 15 } },
  // ── Grecs : Hadès ─────────────────────────────────────────────────────────
  { civilization:"hades",    type: "unit", slug: "cerberus",       name: "Cerbère",           category: "Unité mythologique",   age: "Héroïque",  stats: { hp: 750, attack: 35, cost: { favor: 18 }, trainTime: 12 } },
  { civilization:"hades",    type: "unit", slug: "shade",          name: "Ombre",             category: "Infanterie unique",    age: "Classique", stats: { hp: 50, attack: 6, cost: { gold: 50 }, trainTime: 8 } },
  // ── Égyptiens : Rà ───────────────────────────────────────────────────────
  { civilization:"ra",       type: "unit", slug: "pharaoh",        name: "Pharaon",           category: "Héros",                age: "Archaïque", stats: { hp: 200, attack: 16, cost: {}, trainTime: 0 } },
  { civilization:"ra",       type: "unit", slug: "sphinx",         name: "Sphinx",            category: "Unité mythologique",   age: "Héroïque",  stats: { hp: 900, attack: 55, cost: { favor: 20 }, trainTime: 14 } },
  // ── Égyptiens : Isis ──────────────────────────────────────────────────────
  { civilization:"isis",     type: "unit", slug: "phoenix",        name: "Phénix",            category: "Unité mythologique",   age: "Héroïque",  stats: { hp: 1000, attack: 45, cost: { favor: 25 }, trainTime: 14 } },
  // ── Égyptiens : Set ───────────────────────────────────────────────────────
  { civilization:"set",      type: "unit", slug: "scorpion-man",   name: "Homme-Scorpion",    category: "Unité mythologique",   age: "Classique", stats: { hp: 350, attack: 28, cost: { favor: 12 }, trainTime: 10 } },
  // ── Nordiques : Thor ──────────────────────────────────────────────────────
  { civilization:"thor",     type: "unit", slug: "dwarf",          name: "Nain",              category: "Villageois unique",    age: "Archaïque", stats: { hp: 70, attack: 6, cost: { gold: 50 }, trainTime: 14 } },
  { civilization:"thor",     type: "unit", slug: "nidhogg",        name: "Níðhöggr",          category: "Unité mythologique",   age: "Mythique",  stats: { hp: 2000, attack: 80, cost: { favor: 50 }, trainTime: 20 } },
  // ── Nordiques : Odin ──────────────────────────────────────────────────────
  { civilization:"odin",     type: "unit", slug: "fenris-wolf",    name: "Loup de Fenrir",    category: "Unité mythologique",   age: "Classique", stats: { hp: 400, attack: 30, cost: { favor: 12 }, trainTime: 10 } },
  { civilization:"odin",     type: "unit", slug: "battle-boar",    name: "Sanglier de Guerre","category": "Unité mythologique", age: "Héroïque",  stats: { hp: 700, attack: 40, cost: { favor: 18 }, trainTime: 12 } },
  // ── Nordiques : Loki ──────────────────────────────────────────────────────
  { civilization:"loki",     type: "unit", slug: "jormund-elver",  name: "Serpent de Jörmungandr", category: "Unité mythologique", age: "Héroïque", stats: { hp: 800, attack: 45, cost: { favor: 20 }, trainTime: 13 } },
  // ── Atlantes : Kronos ─────────────────────────────────────────────────────
  { civilization:"kronos",   type: "unit", slug: "chronos",        name: "Titan du Temps",    category: "Unité mythologique",   age: "Mythique",  stats: { hp: 5000, attack: 200, cost: { favor: 250 }, trainTime: 200 } },
  { civilization:"kronos",   type: "unit", slug: "automaton",      name: "Automate",          category: "Infanterie unique",    age: "Classique", stats: { hp: 180, attack: 14, cost: { gold: 100 }, trainTime: 12 } },
  // ── Atlantes : Gaïa ───────────────────────────────────────────────────────
  { civilization:"gaia",     type: "unit", slug: "satyr",          name: "Satyre",            category: "Unité mythologique",   age: "Classique", stats: { hp: 250, attack: 22, cost: { favor: 10 }, trainTime: 10 } },
  // ── Atlantes : Oranos ─────────────────────────────────────────────────────
  { civilization:"oranos",   type: "unit", slug: "nereid",         name: "Néréide",           category: "Unité mythologique",   age: "Héroïque",  stats: { hp: 500, attack: 35, cost: { favor: 18 }, trainTime: 12 } },
  // ── Chinois : Fuxi ────────────────────────────────────────────────────────
  { civilization:"fuxi",     type: "unit", slug: "vermilion-bird", name: "Oiseau Vermillon",  category: "Unité mythologique",   age: "Héroïque",  stats: { hp: 800, attack: 50, cost: { favor: 22 }, trainTime: 14 } },
  // ── Chinois : Nüwa ────────────────────────────────────────────────────────
  { civilization:"nuwa",     type: "unit", slug: "white-tiger",    name: "Tigre Blanc",       category: "Unité mythologique",   age: "Classique", stats: { hp: 400, attack: 28, cost: { favor: 12 }, trainTime: 10 } },
  // ── Chinois : Shennong ────────────────────────────────────────────────────
  { civilization:"shennong", type: "unit", slug: "black-tortoise", name: "Tortue Noire",      category: "Unité mythologique",   age: "Classique", stats: { hp: 600, attack: 20, cost: { favor: 14 }, trainTime: 12 } },
];

export async function syncAom(): Promise<SyncResult> {
  const source = "static";
  try {
    const count = await upsertGameCivilizations("aom", AOM_GODS);
    await upsertGameEntities("aom", AOM_ENTITIES);
    await createGameSyncLog({ game: "aom", source, status: "success", recordsUpdated: count, error: null, syncedAt: new Date().toISOString() });
    return { success: true, count, source };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await createGameSyncLog({ game: "aom", source, status: "error", recordsUpdated: 0, error, syncedAt: new Date().toISOString() });
    return { success: false, count: 0, source, error };
  }
}

// ─── Router ───────────────────────────────────────────────────────────────────

export async function syncGame(game: string): Promise<SyncResult> {
  if (game === "aoe4") return syncAoe4();
  if (game === "aoe2") return syncAoe2();
  if (game === "aoe3") return syncAoe3();
  if (game === "aom")  return syncAom();
  return { success: false, count: 0, source: "unknown", error: `Jeu inconnu : ${game}` };
}
