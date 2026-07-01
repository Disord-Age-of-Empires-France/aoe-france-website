import { createClient, type InValue } from "@libsql/client";
import { randomUUID } from "node:crypto";
import { hashPassword } from "./password";
import type { UserRole } from "./session";
import { ARTICLE_CATEGORIES, type ArticleStatus } from "./categories";
export { ARTICLE_CATEGORIES, type ArticleStatus } from "./categories";

// ─── Client ──────────────────────────────────────────────────────────────────

if (!process.env.TURSO_DATABASE_URL) throw new Error("TURSO_DATABASE_URL is not set");
if (!process.env.TURSO_AUTH_TOKEN)  throw new Error("TURSO_AUTH_TOKEN is not set");

const client = createClient({
  url:       process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

let _ready: Promise<void> | null = null;

function ensureReady(): Promise<void> {
  if (!_ready) _ready = migrate();
  return _ready;
}

// ─── Migration ───────────────────────────────────────────────────────────────

async function migrate() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS articles (
      id          TEXT    PRIMARY KEY,
      badge       TEXT    NOT NULL DEFAULT '',
      badgeColor  TEXT    NOT NULL DEFAULT 'blue',
      title       TEXT    NOT NULL DEFAULT '',
      description TEXT    NOT NULL DEFAULT '',
      content     TEXT    NOT NULL DEFAULT '',
      date        TEXT    NOT NULL DEFAULT '',
      published   INTEGER NOT NULL DEFAULT 0,
      thumbnail   TEXT    NOT NULL DEFAULT ''
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      username      TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name  TEXT NOT NULL DEFAULT '',
      email         TEXT NOT NULL DEFAULT '',
      role          TEXT NOT NULL DEFAULT 'editor',
      created_at    TEXT NOT NULL,
      last_login    TEXT
    )
  `);

  // Discord OAuth columns
  try { await client.execute("ALTER TABLE users ADD COLUMN discord_id TEXT"); } catch { /* already exists */ }
  try { await client.execute("ALTER TABLE users ADD COLUMN discord_avatar TEXT NOT NULL DEFAULT ''"); } catch { /* already exists */ }
  try { await client.execute("ALTER TABLE users ADD COLUMN avatar TEXT NOT NULL DEFAULT ''"); } catch { /* already exists */ }
  try { await client.execute("ALTER TABLE users ADD COLUMN bio TEXT NOT NULL DEFAULT ''"); } catch { /* already exists */ }
  try { await client.execute("ALTER TABLE users ADD COLUMN location TEXT NOT NULL DEFAULT ''"); } catch { /* already exists */ }
  try { await client.execute("ALTER TABLE users ADD COLUMN website TEXT NOT NULL DEFAULT ''"); } catch { /* already exists */ }
  try { await client.execute("ALTER TABLE users ADD COLUMN social_links TEXT NOT NULL DEFAULT '[]'"); } catch { /* already exists */ }
  try { await client.execute("ALTER TABLE users ADD COLUMN display_name_changed_at TEXT"); } catch { /* already exists */ }
  try { await client.execute("ALTER TABLE users ADD COLUMN profile_public INTEGER NOT NULL DEFAULT 1"); } catch { /* already exists */ }
  try {
    await client.execute(
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_discord_id ON users(discord_id) WHERE discord_id IS NOT NULL"
    );
  } catch { /* already exists */ }

  // Article — status + categories columns
  try { await client.execute("ALTER TABLE articles ADD COLUMN status TEXT NOT NULL DEFAULT 'draft'"); } catch { /* already exists */ }
  try { await client.execute("ALTER TABLE articles ADD COLUMN categories TEXT NOT NULL DEFAULT '[]'"); } catch { /* already exists */ }
  try { await client.execute("ALTER TABLE articles ADD COLUMN created_at TEXT NOT NULL DEFAULT ''"); } catch { /* already exists */ }
  try { await client.execute("ALTER TABLE articles ADD COLUMN published_at TEXT"); } catch { /* already exists */ }
  try { await client.execute("ALTER TABLE articles ADD COLUMN scheduled_at TEXT"); } catch { /* already exists */ }
  try { await client.execute("ALTER TABLE articles ADD COLUMN created_by TEXT"); } catch { /* already exists */ }
  // Migrate published boolean → status
  await client.execute("UPDATE articles SET status = 'published' WHERE published = 1 AND status = 'draft'");
  // Backfill published_at for already-published articles
  await client.execute("UPDATE articles SET published_at = date WHERE status = 'published' AND published_at IS NULL AND date != ''");

  // Bot commands table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS bot_commands (
      id                  TEXT    PRIMARY KEY,
      name                TEXT    NOT NULL DEFAULT '',
      usage               TEXT    NOT NULL DEFAULT '',
      description         TEXT    NOT NULL DEFAULT '',
      category            TEXT    NOT NULL DEFAULT 'Général',
      preview_title       TEXT    NOT NULL DEFAULT '',
      preview_color       TEXT    NOT NULL DEFAULT '#5865f2',
      preview_description TEXT    NOT NULL DEFAULT '',
      preview_fields      TEXT    NOT NULL DEFAULT '[]',
      preview_footer      TEXT    NOT NULL DEFAULT '',
      has_image           INTEGER NOT NULL DEFAULT 0,
      order_index         INTEGER NOT NULL DEFAULT 0,
      created_at          TEXT    NOT NULL DEFAULT '',
      updated_at          TEXT    NOT NULL DEFAULT ''
    )
  `);

  // Seed bot commands
  const statsFields = JSON.stringify([
    { name: "🥇 ELO",              value: "1 363",                           inline: true  },
    { name: "🏅 Rang",             value: "Diamond III",                     inline: true  },
    { name: "📊 Position globale", value: "#1 535",                          inline: true  },
    { name: "🎮 Parties",          value: "100",                             inline: true  },
    { name: "✅ Victoires",         value: "56",                              inline: true  },
    { name: "❌ Défaites",          value: "44",                              inline: true  },
    { name: "📈 Win rate",          value: "56,0 %",                         inline: true  },
    { name: "🔥 Série en cours",   value: "-1 Défaite(s) ❄️",               inline: true  },
    { name: "📅 Dernière partie",   value: "6 juin 2026 (il y a 7 jours)",   inline: false },
    { name: "📆 Saison précédente", value: "Saison 12 · 1 117 ELO · Platinum II", inline: false },
    { name: "🏆 Meilleur ELO",      value: "1 453 · Conqueror I (Saison 11)", inline: false },
  ]);
  const majFields = JSON.stringify([
    { name: "Jeu",  value: "AoE IV",      inline: true },
    { name: "Patch", value: "16.2.10604", inline: true },
    { name: "Date",  value: "13 juin 2026", inline: true },
  ]);
  const seedAt = "2026-06-13T00:00:00.000Z";
  await client.batch([
    {
      sql: `INSERT OR IGNORE INTO bot_commands
              (id, name, usage, description, category, preview_title, preview_color,
               preview_description, preview_fields, preview_footer, has_image, order_index, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        "bot-cmd-stats", "stats", "/stats  Age of Empires IV  Dirtus&SabrinaClaudio",
        "Affiche les statistiques détaillées d'un joueur AoE IV : ELO, rang, victoires, défaites, win rate, historique de saisons...",
        "Stats",
        "Age of Empires IV · Stats joueur", "#5865f2",
        "⚔️ **Dirtus&SabrinaClaudio**\nMode : Ranked 1v1 🏆 Saison 13 *(en cours)*",
        statsFields, "Données via aoe4world.com · Page 1/2 · v1.0",
        0, 0, seedAt, seedAt,
      ],
    },
    {
      sql: `INSERT OR IGNORE INTO bot_commands
              (id, name, usage, description, category, preview_title, preview_color,
               preview_description, preview_fields, preview_footer, has_image, order_index, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        "bot-cmd-maj", "maj", "/maj",
        "Affiche les dernières notes de patch officielles pour Age of Empires IV, récupérées automatiquement depuis ageofempires.com.",
        "Infos",
        "Age of Empires IV – Patch 16.2.10604", "#c8a32e",
        "Joyeux mois de mai à notre communauté Age of Empires IV, et merci pour tous vos commentaires après notre récente mise à jour et notre correctif. Nous abordons un certain nombre de problèmes d'équilibre et de bugs avec les cartes précédemment publiées...",
        majFields, "Source : ageofempires.com · v1.0",
        1, 1, seedAt, seedAt,
      ],
    },
  ], "write");

  // Bot commands — image_url column
  try { await client.execute("ALTER TABLE bot_commands ADD COLUMN image_url TEXT NOT NULL DEFAULT ''"); } catch { /* already exists */ }

  // Audit logs table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS logs (
      id         TEXT PRIMARY KEY,
      user_id    TEXT,
      username   TEXT NOT NULL DEFAULT '',
      role       TEXT NOT NULL DEFAULT '',
      action     TEXT NOT NULL,
      target     TEXT,
      target_id  TEXT,
      created_at TEXT NOT NULL
    )
  `);

  // Default settings + feature flags
  await client.batch(
    [
      { sql: "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", args: ["discordInvite", "#discord"] },
      { sql: "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", args: ["siteName", "Age of Empires France"] },
      { sql: "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", args: ["feature_news", "1"] },
      { sql: "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", args: ["feature_guides", "1"] },
      { sql: "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", args: ["feature_community", "1"] },
      { sql: "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", args: ["feature_game_aoe2", "1"] },
      { sql: "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", args: ["feature_game_aoe3", "1"] },
      { sql: "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", args: ["feature_game_aoe4", "1"] },
      { sql: "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", args: ["feature_game_aom",  "1"] },
      { sql: "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", args: ["navbar_items_aoe2",      '["presentation","civilisations","guides","tournois"]'] },
      { sql: "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", args: ["navbar_items_aoe3",      '["presentation","civilisations","guides","tournois"]'] },
      { sql: "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", args: ["navbar_items_aoe4",      '["presentation","civilisations","guides","tournois"]'] },
      { sql: "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", args: ["navbar_items_aom",       '["presentation","dieux-majeurs","guides","tournois"]'] },
      { sql: "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", args: ["navbar_items_news",      '["patch-notes","evenements","tournois"]'] },
      { sql: "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", args: ["navbar_items_guides",    '["aoe2","aoe3","aoe4","aom"]'] },
      { sql: "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", args: ["navbar_items_community", '["discord","tournois","evenements","partenaires"]'] },
      { sql: "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", args: ["maintenance_mode",    "0"] },
      { sql: "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", args: ["maintenance_message", ""] },
      { sql: "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", args: ["maintenance_end",     ""] },
    ],
    "write"
  );

  // Forum tables
  await client.execute(`
    CREATE TABLE IF NOT EXISTS forum_categories (
      id          TEXT    PRIMARY KEY,
      slug        TEXT    UNIQUE NOT NULL,
      name        TEXT    NOT NULL DEFAULT '',
      description TEXT    NOT NULL DEFAULT '',
      color       TEXT    NOT NULL DEFAULT 'amber',
      icon        TEXT    NOT NULL DEFAULT '',
      position    INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT    NOT NULL
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS forum_topics (
      id                   TEXT    PRIMARY KEY,
      category_id          TEXT    NOT NULL,
      user_id              TEXT    NOT NULL,
      title                TEXT    NOT NULL DEFAULT '',
      content              TEXT    NOT NULL DEFAULT '',
      pinned               INTEGER NOT NULL DEFAULT 0,
      locked               INTEGER NOT NULL DEFAULT 0,
      views                INTEGER NOT NULL DEFAULT 0,
      created_at           TEXT    NOT NULL,
      last_reply_at        TEXT,
      last_reply_user_id   TEXT
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS forum_replies (
      id         TEXT PRIMARY KEY,
      topic_id   TEXT NOT NULL,
      user_id    TEXT NOT NULL,
      content    TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      edited_at  TEXT
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS forum_reactions (
      id          TEXT PRIMARY KEY,
      target_id   TEXT NOT NULL,
      target_type TEXT NOT NULL,
      user_id     TEXT NOT NULL,
      emoji       TEXT NOT NULL,
      created_at  TEXT NOT NULL,
      UNIQUE(target_id, target_type, user_id, emoji)
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS forum_reports (
      id          TEXT PRIMARY KEY,
      target_id   TEXT NOT NULL,
      target_type TEXT NOT NULL,
      user_id     TEXT NOT NULL,
      reason      TEXT NOT NULL DEFAULT '',
      resolved    INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL
    )
  `);
  // Forum topic moderation status (default 'approved' pour les topics existants)
  try { await client.execute("ALTER TABLE forum_topics ADD COLUMN status TEXT NOT NULL DEFAULT 'approved'"); } catch { /* already exists */ }
  try { await client.execute("ALTER TABLE forum_topics ADD COLUMN deleted_reason TEXT"); } catch { /* already exists */ }
  try { await client.execute("ALTER TABLE forum_topics ADD COLUMN rejected_reason TEXT"); } catch { /* already exists */ }

  // Default forum categories
  const forumSeedAt = "2026-06-30T00:00:00.000Z";
  await client.batch([
    { sql: "INSERT OR IGNORE INTO forum_categories (id, slug, name, description, color, icon, position, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", args: ["fcat-general", "general", "Général", "Discussions générales sur la communauté AoE France.", "amber", "💬", 0, forumSeedAt] },
    { sql: "INSERT OR IGNORE INTO forum_categories (id, slug, name, description, color, icon, position, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", args: ["fcat-aoe2",    "aoe2",    "AoE II: DE", "Stratégies, build orders et discussions autour d'Age of Empires II.", "purple", "⚔️", 1, forumSeedAt] },
    { sql: "INSERT OR IGNORE INTO forum_categories (id, slug, name, description, color, icon, position, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", args: ["fcat-aoe3",    "aoe3",    "AoE III: DE", "Stratégies et discussions autour d'Age of Empires III.", "green",  "🌿", 2, forumSeedAt] },
    { sql: "INSERT OR IGNORE INTO forum_categories (id, slug, name, description, color, icon, position, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", args: ["fcat-aoe4",    "aoe4",    "AoE IV", "Stratégies et discussions autour d'Age of Empires IV.", "blue",   "🏰", 3, forumSeedAt] },
    { sql: "INSERT OR IGNORE INTO forum_categories (id, slug, name, description, color, icon, position, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", args: ["fcat-aom",     "aom",     "AoM: Retold", "Panthéons, dieux et stratégies d'Age of Mythology: Retold.", "amber", "⚡", 4, forumSeedAt] },
  ], "write");

  // Seed first admin from env vars if no users exist
  const { rows: countRows } = await client.execute("SELECT COUNT(*) as cnt FROM users");
  const userCount = Number((countRows[0] as Record<string, unknown>)?.cnt ?? 0);
  if (userCount === 0) {
    const seedUsername = process.env.ADMIN_USERNAME ?? "admin";
    const seedPassword = process.env.ADMIN_PASSWORD ?? "AoEFrance2024!";
    await client.execute({
      sql: `INSERT INTO users (id, username, password_hash, display_name, email, role, created_at)
            VALUES (?, ?, ?, ?, '', 'admin', ?)`,
      args: [randomUUID(), seedUsername, hashPassword(seedPassword), seedUsername, new Date().toISOString()],
    });
  }
}

// ─── Type helpers ─────────────────────────────────────────────────────────────

function toArticle(row: Record<string, unknown>): Article {
  let categories: string[] = [];
  try { categories = JSON.parse(String(row.categories ?? "[]")); } catch { /* invalid json */ }
  // Backward compat: seed from badge if categories empty
  if (categories.length === 0 && row.badge) categories = [String(row.badge)];

  const firstCat = ARTICLE_CATEGORIES.find(c => c.value === categories[0]);
  const statusStr = String(row.status ?? "");
  const status: ArticleStatus =
    statusStr === "published" ? "published" :
    statusStr === "archived"  ? "archived"  :
    Number(row.published) === 1 ? "published" : "draft";

  return {
    id:          String(row.id),
    categories,
    badge:       categories[0] ?? String(row.badge ?? ""),
    badgeColor:  firstCat?.color ?? String(row.badgeColor ?? "blue"),
    title:       String(row.title),
    description: String(row.description),
    content:     String(row.content),
    date:        String(row.date),
    status,
    thumbnail:   String(row.thumbnail ?? ""),
    createdAt:   String(row.created_at ?? ""),
    publishedAt:  row.published_at  ? String(row.published_at)  : null,
    scheduledAt:  row.scheduled_at  ? String(row.scheduled_at)  : null,
    createdBy:    row.created_by    ? String(row.created_by)    : null,
  };
}

function toUser(row: Record<string, unknown>): User {
  const role = String(row.role);
  return {
    id:            String(row.id),
    username:      String(row.username),
    passwordHash:  String(row.password_hash ?? ""),
    displayName:   String(row.display_name ?? ""),
    email:         String(row.email ?? ""),
    role:          (["admin", "editor", "member"].includes(role) ? role : "member") as UserRole,
    discordId:     row.discord_id ? String(row.discord_id) : null,
    discordAvatar: String(row.discord_avatar ?? ""),
    avatar:        String(row.avatar ?? ""),
    bio:           String(row.bio ?? ""),
    location:      String(row.location ?? ""),
    website:       String(row.website ?? ""),
    socialLinks:   (() => { try { return JSON.parse(String(row.social_links ?? "[]")); } catch { return []; } })(),
    displayNameChangedAt: row.display_name_changed_at ? String(row.display_name_changed_at) : null,
    profilePublic: row.profile_public !== 0,
    createdAt:     String(row.created_at),
    lastLogin:     row.last_login ? String(row.last_login) : null,
  };
}

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface Article {
  id:          string;
  categories:  string[];
  badge:       string;
  badgeColor:  string;
  title:       string;
  description: string;
  content:     string;
  date:        string;
  status:      ArticleStatus;
  thumbnail:   string;
  createdAt:   string;
  publishedAt:  string | null;
  scheduledAt:  string | null;
  createdBy:    string | null;
}

export interface User {
  id:                   string;
  username:             string;
  passwordHash:         string;
  displayName:          string;
  email:                string;
  role:                 UserRole;
  discordId:            string | null;
  discordAvatar:        string;
  avatar:               string;
  bio:                  string;
  location:             string;
  website:              string;
  socialLinks:          { type: string; url: string }[];
  displayNameChangedAt: string | null;
  profilePublic:        boolean;
  createdAt:            string;
  lastLogin:            string | null;
}

export interface BotCommandField {
  name:   string;
  value:  string;
  inline: boolean;
}

export interface BotCommand {
  id:                 string;
  name:               string;
  usage:              string;
  description:        string;
  category:           string;
  previewTitle:       string;
  previewColor:       string;
  previewDescription: string;
  previewFields:      BotCommandField[];
  previewFooter:      string;
  hasImage:           boolean;
  imageUrl:           string;
  orderIndex:         number;
  createdAt:          string;
  updatedAt:          string;
}

export interface SiteSettings {
  discordInvite: string;
  siteName:      string;
  maintenance: {
    active:  boolean;
    message: string;
    endAt:   string | null;
  };
  features: {
    news:      boolean;
    guides:    boolean;
    community: boolean;
    games: {
      aoe2: boolean;
      aoe3: boolean;
      aoe4: boolean;
      aom:  boolean;
    };
  };
  navItems: {
    aoe2:      string[];
    aoe3:      string[];
    aoe4:      string[];
    aom:       string[];
    news:      string[];
    guides:    string[];
    community: string[];
  };
}

// ─── Articles ─────────────────────────────────────────────────────────────────

async function publishScheduledArticles(): Promise<void> {
  const now = new Date().toISOString();
  await client.execute({
    sql:  `UPDATE articles SET status = 'published',
                date = scheduled_at,
                published_at = COALESCE(published_at, scheduled_at),
                scheduled_at = NULL
           WHERE status = 'draft' AND scheduled_at IS NOT NULL AND scheduled_at <= ?`,
    args: [now],
  });
}

export async function getArticles(): Promise<Article[]> {
  await ensureReady();
  await publishScheduledArticles();
  const { rows } = await client.execute("SELECT * FROM articles ORDER BY date DESC");
  return rows.map(toArticle);
}

export async function getPublishedArticles(): Promise<Article[]> {
  await ensureReady();
  await publishScheduledArticles();
  const { rows } = await client.execute(
    "SELECT * FROM articles WHERE status = 'published' ORDER BY date DESC"
  );
  return rows.map(toArticle);
}

export async function getArticle(id: string): Promise<Article | undefined> {
  await ensureReady();
  const { rows } = await client.execute({ sql: "SELECT * FROM articles WHERE id = ?", args: [id] });
  return rows[0] ? toArticle(rows[0] as unknown as Record<string, unknown>) : undefined;
}

export async function createArticle(
  data: Omit<Article, "id" | "createdAt" | "publishedAt">
): Promise<Article> {
  await ensureReady();
  const id        = randomUUID();
  const createdAt = new Date().toISOString();
  const publishedAt  = data.status === "published" ? createdAt : null;
  const scheduledAt  = data.status === "draft" ? (data.scheduledAt ?? null) : null;
  await client.execute({
    sql: `INSERT INTO articles
            (id, badge, badgeColor, categories, title, description, content, date, status, thumbnail, created_at, published_at, scheduled_at, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, data.badge, data.badgeColor, JSON.stringify(data.categories), data.title, data.description, data.content, data.date, data.status, data.thumbnail, createdAt, publishedAt, scheduledAt, data.createdBy ?? null],
  });
  return { ...data, id, createdAt, publishedAt, scheduledAt };
}

export async function updateArticle(
  id: string,
  data: Partial<Omit<Article, "id" | "createdAt" | "publishedAt">>
): Promise<void> {
  await ensureReady();
  const DB_COL: Record<string, string> = {
    badge: "badge", badgeColor: "badgeColor", categories: "categories",
    title: "title", description: "description", content: "content",
    date: "date", status: "status", thumbnail: "thumbnail",
    scheduledAt: "scheduled_at",
  };
  const entries = Object.entries(data).filter(([k]) => DB_COL[k]);
  if (!entries.length) return;
  const setClauses: string[]  = entries.map(([k]) => `${DB_COL[k]} = ?`);
  const args: InValue[] = entries.map(([k, val]) =>
    k === "categories" ? JSON.stringify(val) : String(val ?? "")
  );
  // Publish: set date + published_at once, clear scheduled_at
  if (data.status === "published") {
    const now = new Date().toISOString();
    setClauses.push("published_at = COALESCE(published_at, ?)");
    args.push(now);
    setClauses.push("date = COALESCE(published_at, ?)");
    args.push(now);
    setClauses.push("scheduled_at = NULL");
  }
  // Archive: clear scheduled_at
  if (data.status === "archived") {
    setClauses.push("scheduled_at = NULL");
  }
  await client.execute({
    sql:  `UPDATE articles SET ${setClauses.join(", ")} WHERE id = ?`,
    args: [...args, id],
  });
}

export async function deleteArticle(id: string): Promise<void> {
  await ensureReady();
  await client.execute({ sql: "DELETE FROM articles WHERE id = ?", args: [id] });
}

// ─── Settings ─────────────────────────────────────────────────────────────────

function parseNavItems(json: string | undefined, defaults: string[]): string[] {
  if (!json) return defaults;
  try { return JSON.parse(json) as string[]; } catch { return defaults; }
}

export async function getSettings(): Promise<SiteSettings> {
  await ensureReady();
  const { rows } = await client.execute("SELECT key, value FROM settings");
  const map: Record<string, string> = {};
  for (const row of rows) map[String(row.key)] = String(row.value);
  return {
    discordInvite: map.discordInvite ?? "#discord",
    siteName:      map.siteName      ?? "Age of Empires France",
    maintenance: {
      active:  map.maintenance_mode === "1" && (!map.maintenance_end || new Date(map.maintenance_end).getTime() > Date.now()),
      message: map.maintenance_message ?? "",
      endAt:   map.maintenance_end || null,
    },
    features: {
      news:      map.feature_news      !== "0",
      guides:    map.feature_guides    !== "0",
      community: map.feature_community !== "0",
      games: {
        aoe2: map.feature_game_aoe2 !== "0",
        aoe3: map.feature_game_aoe3 !== "0",
        aoe4: map.feature_game_aoe4 !== "0",
        aom:  map.feature_game_aom  !== "0",
      },
    },
    navItems: {
      aoe2:      parseNavItems(map.navbar_items_aoe2,      ["presentation", "civilisations", "guides", "tournois"]),
      aoe3:      parseNavItems(map.navbar_items_aoe3,      ["presentation", "civilisations", "guides", "tournois"]),
      aoe4:      parseNavItems(map.navbar_items_aoe4,      ["presentation", "civilisations", "guides", "tournois"]),
      aom:       parseNavItems(map.navbar_items_aom,       ["presentation", "dieux-majeurs", "guides", "tournois"]),
      news:      parseNavItems(map.navbar_items_news,      ["patch-notes", "evenements", "tournois"]),
      guides:    parseNavItems(map.navbar_items_guides,    ["aoe2", "aoe3", "aoe4", "aom"]),
      community: parseNavItems(map.navbar_items_community, ["discord", "tournois", "evenements", "partenaires"]),
    },
  };
}

export async function updateSettings(data: {
  discordInvite?:        string;
  siteName?:             string;
  maintenance_mode?:     boolean;
  maintenance_message?:  string;
  maintenance_end?:      string;
  feature_news?:         boolean;
  feature_guides?:      boolean;
  feature_community?:   boolean;
  feature_game_aoe2?:   boolean;
  feature_game_aoe3?:   boolean;
  feature_game_aoe4?:   boolean;
  feature_game_aom?:    boolean;
  navbar_items_aoe2?:      string[];
  navbar_items_aoe3?:      string[];
  navbar_items_aoe4?:      string[];
  navbar_items_aom?:       string[];
  navbar_items_news?:      string[];
  navbar_items_guides?:    string[];
  navbar_items_community?: string[];
}): Promise<void> {
  await ensureReady();
  const pairs: [string, string][] = [];
  if (data.discordInvite        !== undefined) pairs.push(["discordInvite",        data.discordInvite]);
  if (data.siteName             !== undefined) pairs.push(["siteName",             data.siteName]);
  if (data.maintenance_mode     !== undefined) pairs.push(["maintenance_mode",     data.maintenance_mode ? "1" : "0"]);
  if (data.maintenance_message  !== undefined) pairs.push(["maintenance_message",  data.maintenance_message]);
  if (data.maintenance_end      !== undefined) pairs.push(["maintenance_end",      data.maintenance_end]);
  if (data.feature_news        !== undefined) pairs.push(["feature_news",        data.feature_news        ? "1" : "0"]);
  if (data.feature_guides      !== undefined) pairs.push(["feature_guides",      data.feature_guides      ? "1" : "0"]);
  if (data.feature_community   !== undefined) pairs.push(["feature_community",   data.feature_community   ? "1" : "0"]);
  if (data.feature_game_aoe2   !== undefined) pairs.push(["feature_game_aoe2",   data.feature_game_aoe2   ? "1" : "0"]);
  if (data.feature_game_aoe3   !== undefined) pairs.push(["feature_game_aoe3",   data.feature_game_aoe3   ? "1" : "0"]);
  if (data.feature_game_aoe4   !== undefined) pairs.push(["feature_game_aoe4",   data.feature_game_aoe4   ? "1" : "0"]);
  if (data.feature_game_aom    !== undefined) pairs.push(["feature_game_aom",    data.feature_game_aom    ? "1" : "0"]);
  if (data.navbar_items_aoe2      !== undefined) pairs.push(["navbar_items_aoe2",      JSON.stringify(data.navbar_items_aoe2)]);
  if (data.navbar_items_aoe3      !== undefined) pairs.push(["navbar_items_aoe3",      JSON.stringify(data.navbar_items_aoe3)]);
  if (data.navbar_items_aoe4      !== undefined) pairs.push(["navbar_items_aoe4",      JSON.stringify(data.navbar_items_aoe4)]);
  if (data.navbar_items_aom       !== undefined) pairs.push(["navbar_items_aom",       JSON.stringify(data.navbar_items_aom)]);
  if (data.navbar_items_news      !== undefined) pairs.push(["navbar_items_news",      JSON.stringify(data.navbar_items_news)]);
  if (data.navbar_items_guides    !== undefined) pairs.push(["navbar_items_guides",    JSON.stringify(data.navbar_items_guides)]);
  if (data.navbar_items_community !== undefined) pairs.push(["navbar_items_community", JSON.stringify(data.navbar_items_community)]);
  if (!pairs.length) return;
  await client.batch(
    pairs.map(([key, value]) => ({ sql: "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", args: [key, value] as [string, string] })),
    "write"
  );
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getUsers(): Promise<User[]> {
  await ensureReady();
  const { rows } = await client.execute("SELECT * FROM users ORDER BY created_at ASC");
  return rows.map(r => toUser(r as unknown as Record<string, unknown>));
}

export async function getUser(id: string): Promise<User | undefined> {
  await ensureReady();
  const { rows } = await client.execute({ sql: "SELECT * FROM users WHERE id = ?", args: [id] });
  return rows[0] ? toUser(rows[0] as unknown as Record<string, unknown>) : undefined;
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  await ensureReady();
  const { rows } = await client.execute({
    sql:  "SELECT * FROM users WHERE username = ?",
    args: [username],
  });
  return rows[0] ? toUser(rows[0] as unknown as Record<string, unknown>) : undefined;
}

export async function createUser(data: {
  username:     string;
  passwordHash: string;
  displayName:  string;
  email:        string;
  role:         UserRole;
}): Promise<User> {
  await ensureReady();
  const id        = randomUUID();
  const createdAt = new Date().toISOString();
  await client.execute({
    sql:  `INSERT INTO users (id, username, password_hash, display_name, email, role, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, data.username, data.passwordHash, data.displayName, data.email, data.role, createdAt],
  });
  return { ...data, id, createdAt, lastLogin: null, discordId: null, discordAvatar: "", avatar: "", bio: "", location: "", website: "", socialLinks: [], displayNameChangedAt: null, profilePublic: true };
}

export async function updateUser(
  id: string,
  data: Partial<{ username: string; passwordHash: string; displayName: string; displayNameChangedAt: string; email: string; role: UserRole; avatar: string; discordAvatar: string; bio: string; location: string; website: string; socialLinks: string; profilePublic: string }>
): Promise<void> {
  await ensureReady();
  const COL: Record<string, string> = {
    username:             "username",
    passwordHash:         "password_hash",
    displayName:          "display_name",
    displayNameChangedAt: "display_name_changed_at",
    email:                "email",
    role:                 "role",
    avatar:               "avatar",
    discordAvatar:        "discord_avatar",
    bio:                  "bio",
    location:             "location",
    website:              "website",
    socialLinks:          "social_links",
    profilePublic:        "profile_public",
  };
  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  if (!entries.length) return;
  const set  = entries.map(([k]) => `${COL[k]} = ?`).join(", ");
  const args: InValue[] = entries.map(([, v]) => String(v));
  await client.execute({ sql: `UPDATE users SET ${set} WHERE id = ?`, args: [...args, id] });
}

export async function updateUserLastLogin(id: string): Promise<void> {
  await ensureReady();
  await client.execute({
    sql:  "UPDATE users SET last_login = ? WHERE id = ?",
    args: [new Date().toISOString(), id],
  });
}

export async function deleteUser(id: string): Promise<void> {
  await ensureReady();
  await client.execute({ sql: "DELETE FROM users WHERE id = ?", args: [id] });
}

export async function countAdminUsers(): Promise<number> {
  await ensureReady();
  const { rows } = await client.execute(
    "SELECT COUNT(*) as cnt FROM users WHERE role = 'admin'"
  );
  return Number((rows[0] as unknown as Record<string, unknown>)?.cnt ?? 0);
}

export async function getUserByDiscordId(discordId: string): Promise<User | undefined> {
  await ensureReady();
  const { rows } = await client.execute({
    sql:  "SELECT * FROM users WHERE discord_id = ?",
    args: [discordId],
  });
  return rows[0] ? toUser(rows[0] as unknown as Record<string, unknown>) : undefined;
}

export async function createDiscordUser(data: {
  discordId:    string;
  username:     string;
  displayName:  string;
  email:        string;
  discordAvatar: string;
}): Promise<User> {
  await ensureReady();
  const id        = randomUUID();
  const createdAt = new Date().toISOString();
  await client.execute({
    sql:  `INSERT INTO users
             (id, username, password_hash, display_name, email, role, discord_id, discord_avatar, created_at)
           VALUES (?, ?, '', ?, ?, 'member', ?, ?, ?)`,
    args: [id, data.username, data.displayName, data.email, data.discordId, data.discordAvatar, createdAt],
  });
  return {
    id, username: data.username, passwordHash: "", displayName: data.displayName,
    email: data.email, role: "member", discordId: data.discordId,
    discordAvatar: data.discordAvatar, avatar: "", bio: "", location: "", website: "", socialLinks: [],
    displayNameChangedAt: null, profilePublic: true, createdAt, lastLogin: null,
  };
}

// ─── Logs ─────────────────────────────────────────────────────────────────────

export interface Log {
  id:        string;
  userId:    string | null;
  username:  string;
  role:      string;
  action:    string;
  target:    string | null;
  targetId:  string | null;
  createdAt: string;
}

function toLog(row: Record<string, unknown>): Log {
  return {
    id:        String(row.id),
    userId:    row.user_id ? String(row.user_id) : null,
    username:  String(row.username ?? ""),
    role:      String(row.role ?? ""),
    action:    String(row.action),
    target:    row.target   ? String(row.target)    : null,
    targetId:  row.target_id ? String(row.target_id) : null,
    createdAt: String(row.created_at),
  };
}

export async function createLog(data: {
  userId:   string | null;
  username: string;
  role:     string;
  action:   string;
  target?:  string;
  targetId?: string;
}): Promise<void> {
  await ensureReady();
  await client.execute({
    sql:  `INSERT INTO logs (id, user_id, username, role, action, target, target_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      randomUUID(),
      data.userId   ?? null,
      data.username,
      data.role,
      data.action,
      data.target   ?? null,
      data.targetId ?? null,
      new Date().toISOString(),
    ],
  });
}

// ─── Bot commands ─────────────────────────────────────────────────────────────

function toBotCommand(row: Record<string, unknown>): BotCommand {
  let previewFields: BotCommandField[] = [];
  try { previewFields = JSON.parse(String(row.preview_fields ?? "[]")); } catch { /* invalid json */ }
  return {
    id:                 String(row.id),
    name:               String(row.name ?? ""),
    usage:              String(row.usage ?? ""),
    description:        String(row.description ?? ""),
    category:           String(row.category ?? "Général"),
    previewTitle:       String(row.preview_title ?? ""),
    previewColor:       String(row.preview_color ?? "#5865f2"),
    previewDescription: String(row.preview_description ?? ""),
    previewFields,
    previewFooter:      String(row.preview_footer ?? ""),
    hasImage:           Number(row.has_image ?? 0) === 1,
    imageUrl:           String(row.image_url ?? ""),
    orderIndex:         Number(row.order_index ?? 0),
    createdAt:          String(row.created_at ?? ""),
    updatedAt:          String(row.updated_at ?? ""),
  };
}

export async function getBotCommands(): Promise<BotCommand[]> {
  await ensureReady();
  const { rows } = await client.execute(
    "SELECT * FROM bot_commands ORDER BY order_index ASC, created_at ASC"
  );
  return rows.map(r => toBotCommand(r as unknown as Record<string, unknown>));
}

export async function getBotCommand(id: string): Promise<BotCommand | undefined> {
  await ensureReady();
  const { rows } = await client.execute({
    sql: "SELECT * FROM bot_commands WHERE id = ?",
    args: [id],
  });
  return rows[0] ? toBotCommand(rows[0] as unknown as Record<string, unknown>) : undefined;
}

export async function createBotCommand(
  data: Omit<BotCommand, "id" | "createdAt" | "updatedAt">
): Promise<BotCommand> {
  await ensureReady();
  const id  = randomUUID();
  const now = new Date().toISOString();
  await client.execute({
    sql: `INSERT INTO bot_commands
            (id, name, usage, description, category, preview_title, preview_color,
             preview_description, preview_fields, preview_footer, has_image, image_url, order_index, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id, data.name, data.usage, data.description, data.category,
      data.previewTitle, data.previewColor, data.previewDescription,
      JSON.stringify(data.previewFields), data.previewFooter,
      data.hasImage ? 1 : 0, data.imageUrl ?? "", data.orderIndex, now, now,
    ],
  });
  return { ...data, id, createdAt: now, updatedAt: now };
}

export async function updateBotCommand(
  id: string,
  data: Partial<Omit<BotCommand, "id" | "createdAt" | "updatedAt">>
): Promise<void> {
  await ensureReady();
  const COL: Record<string, string> = {
    name: "name", usage: "usage", description: "description", category: "category",
    previewTitle: "preview_title", previewColor: "preview_color",
    previewDescription: "preview_description", previewFields: "preview_fields",
    previewFooter: "preview_footer", hasImage: "has_image", imageUrl: "image_url", orderIndex: "order_index",
  };
  const entries = Object.entries(data).filter(([k]) => COL[k]);
  if (!entries.length) return;
  const set  = entries.map(([k]) => `${COL[k]} = ?`).join(", ");
  const args: InValue[] = entries.map(([k, v]) => {
    if (k === "previewFields") return JSON.stringify(v);
    if (k === "hasImage")      return (v ? 1 : 0) as number;
    if (k === "imageUrl")      return String(v ?? "");
    return String(v ?? "");
  });
  await client.execute({
    sql:  `UPDATE bot_commands SET ${set}, updated_at = ? WHERE id = ?`,
    args: [...args, new Date().toISOString(), id],
  });
}

export async function deleteBotCommand(id: string): Promise<void> {
  await ensureReady();
  await client.execute({ sql: "DELETE FROM bot_commands WHERE id = ?", args: [id] });
}

export async function getLogs(limit = 200): Promise<Log[]> {
  await ensureReady();
  const { rows } = await client.execute({
    sql:  "SELECT * FROM logs ORDER BY created_at DESC LIMIT ?",
    args: [limit],
  });
  return rows.map(r => toLog(r as unknown as Record<string, unknown>));
}

// ─── Forum ────────────────────────────────────────────────────────────────────

export interface ForumCategory {
  id: string; slug: string; name: string; description: string;
  color: string; icon: string; position: number; createdAt: string;
  topicCount: number; replyCount: number;
  lastTopicTitle: string | null; lastActivity: string | null; lastUsername: string | null;
}

export type ForumTopicStatus = "pending" | "approved" | "rejected" | "deleted";

export interface ForumTopic {
  id: string; categoryId: string; categorySlug: string; categoryName: string;
  userId: string; username: string; displayName: string; avatar: string; role: UserRole;
  title: string; content: string; pinned: boolean; locked: boolean;
  status: ForumTopicStatus;
  deletedReason: string | null;
  rejectedReason: string | null;
  views: number; replyCount: number; createdAt: string;
  lastReplyAt: string | null; lastReplyUsername: string | null; lastReplyDisplayName: string | null;
}

export interface ForumReply {
  id: string; topicId: string;
  userId: string; username: string; displayName: string; avatar: string; role: UserRole;
  content: string; createdAt: string; editedAt: string | null;
}

export interface ForumReaction { emoji: string; count: number; userReacted: boolean; }

export interface ForumReport {
  id: string; targetId: string; targetType: "topic" | "reply";
  userId: string; username: string; reason: string; resolved: boolean; createdAt: string;
  topicId: string | null; topicTitle: string | null; categorySlug: string | null;
}

function row2cat(r: Record<string, unknown>, stats?: { topicCount: number; replyCount: number; lastTopicTitle: string | null; lastActivity: string | null; lastUsername: string | null }): ForumCategory {
  return {
    id: String(r.id), slug: String(r.slug), name: String(r.name),
    description: String(r.description ?? ""), color: String(r.color ?? "amber"),
    icon: String(r.icon ?? ""), position: Number(r.position ?? 0),
    createdAt: String(r.created_at),
    topicCount: stats?.topicCount ?? Number(r.topic_count ?? 0),
    replyCount: stats?.replyCount ?? Number(r.reply_count ?? 0),
    lastTopicTitle: stats?.lastTopicTitle ?? (r.last_topic_title ? String(r.last_topic_title) : null),
    lastActivity: stats?.lastActivity ?? (r.last_activity ? String(r.last_activity) : null),
    lastUsername: stats?.lastUsername ?? (r.last_username ? String(r.last_username) : null),
  };
}

function row2topic(r: Record<string, unknown>): ForumTopic {
  const role = (["admin","editor","member"].includes(String(r.role ?? "")) ? String(r.role) : "member") as UserRole;
  const status = (["pending","approved","rejected","deleted"].includes(String(r.status ?? "")) ? String(r.status) : "approved") as ForumTopicStatus;
  return {
    id: String(r.id), categoryId: String(r.category_id), categorySlug: String(r.category_slug ?? ""),
    categoryName: String(r.category_name ?? ""), userId: String(r.user_id),
    username: String(r.username ?? ""), displayName: String(r.display_name ?? "") || String(r.username ?? ""),
    avatar: String(r.avatar || r.discord_avatar || ""), role,
    title: String(r.title ?? ""), content: String(r.content ?? ""),
    pinned: Number(r.pinned) !== 0, locked: Number(r.locked) !== 0,
    status,
    deletedReason: r.deleted_reason ? String(r.deleted_reason) : null,
    rejectedReason: r.rejected_reason ? String(r.rejected_reason) : null,
    views: Number(r.views ?? 0), replyCount: Number(r.reply_count ?? 0),
    createdAt: String(r.created_at),
    lastReplyAt: r.last_reply_at ? String(r.last_reply_at) : null,
    lastReplyUsername: r.last_reply_username ? String(r.last_reply_username) : null,
    lastReplyDisplayName: r.last_reply_display_name ? String(r.last_reply_display_name) : null,
  };
}

function row2reply(r: Record<string, unknown>): ForumReply {
  const role = (["admin","editor","member"].includes(String(r.role ?? "")) ? String(r.role) : "member") as UserRole;
  return {
    id: String(r.id), topicId: String(r.topic_id), userId: String(r.user_id),
    username: String(r.username ?? ""), displayName: String(r.display_name ?? "") || String(r.username ?? ""),
    avatar: String(r.avatar || r.discord_avatar || ""), role,
    content: String(r.content ?? ""), createdAt: String(r.created_at),
    editedAt: r.edited_at ? String(r.edited_at) : null,
  };
}

export async function getForumCategories(): Promise<ForumCategory[]> {
  await ensureReady();
  const { rows } = await client.execute(`
    SELECT fc.*,
      (SELECT COUNT(*) FROM forum_topics ft WHERE ft.category_id = fc.id AND ft.status = 'approved') AS topic_count,
      (SELECT COUNT(*) FROM forum_replies fr JOIN forum_topics ft ON fr.topic_id = ft.id WHERE ft.category_id = fc.id AND ft.status = 'approved') AS reply_count,
      (SELECT ft2.title FROM forum_topics ft2 WHERE ft2.category_id = fc.id AND ft2.status = 'approved' ORDER BY COALESCE(ft2.last_reply_at, ft2.created_at) DESC LIMIT 1) AS last_topic_title,
      (SELECT COALESCE(ft2.last_reply_at, ft2.created_at) FROM forum_topics ft2 WHERE ft2.category_id = fc.id AND ft2.status = 'approved' ORDER BY COALESCE(ft2.last_reply_at, ft2.created_at) DESC LIMIT 1) AS last_activity,
      (SELECT u.display_name FROM forum_topics ft2 LEFT JOIN users u ON u.id = COALESCE(ft2.last_reply_user_id, ft2.user_id) WHERE ft2.category_id = fc.id AND ft2.status = 'approved' ORDER BY COALESCE(ft2.last_reply_at, ft2.created_at) DESC LIMIT 1) AS last_username
    FROM forum_categories fc ORDER BY fc.position ASC
  `);
  return rows.map(r => row2cat(r as unknown as Record<string, unknown>));
}

export async function getForumCategory(slug: string): Promise<ForumCategory | undefined> {
  await ensureReady();
  const { rows } = await client.execute({ sql: "SELECT * FROM forum_categories WHERE slug = ?", args: [slug] });
  if (!rows[0]) return undefined;
  return row2cat(rows[0] as unknown as Record<string, unknown>);
}

export async function getForumTopics(categoryId: string, page = 1, limit = 20): Promise<{ topics: ForumTopic[]; total: number }> {
  await ensureReady();
  const offset = (page - 1) * limit;
  const [{ rows }, { rows: countRows }] = await Promise.all([
    client.execute({
      sql: `SELECT ft.*, fc.slug AS category_slug, fc.name AS category_name,
              u.username, u.display_name, u.avatar, u.discord_avatar, u.role,
              (SELECT COUNT(*) FROM forum_replies fr WHERE fr.topic_id = ft.id) AS reply_count,
              (SELECT u2.username FROM users u2 WHERE u2.id = ft.last_reply_user_id) AS last_reply_username,
              (SELECT u2.display_name FROM users u2 WHERE u2.id = ft.last_reply_user_id) AS last_reply_display_name
            FROM forum_topics ft
            JOIN forum_categories fc ON fc.id = ft.category_id
            JOIN users u ON u.id = ft.user_id
            WHERE ft.category_id = ? AND ft.status = 'approved'
            ORDER BY ft.pinned DESC, COALESCE(ft.last_reply_at, ft.created_at) DESC
            LIMIT ? OFFSET ?`,
      args: [categoryId, limit, offset],
    }),
    client.execute({ sql: "SELECT COUNT(*) as cnt FROM forum_topics WHERE category_id = ? AND status = 'approved'", args: [categoryId] }),
  ]);
  return { topics: rows.map(r => row2topic(r as unknown as Record<string, unknown>)), total: Number((countRows[0] as unknown as Record<string, unknown>)?.cnt ?? 0) };
}

export async function getForumTopic(id: string): Promise<ForumTopic | undefined> {
  await ensureReady();
  const { rows } = await client.execute({
    sql: `SELECT ft.*, fc.slug AS category_slug, fc.name AS category_name,
            u.username, u.display_name, u.avatar, u.discord_avatar, u.role,
            (SELECT COUNT(*) FROM forum_replies fr WHERE fr.topic_id = ft.id) AS reply_count,
            (SELECT u2.username FROM users u2 WHERE u2.id = ft.last_reply_user_id) AS last_reply_username,
            (SELECT u2.display_name FROM users u2 WHERE u2.id = ft.last_reply_user_id) AS last_reply_display_name
          FROM forum_topics ft
          JOIN forum_categories fc ON fc.id = ft.category_id
          JOIN users u ON u.id = ft.user_id
          WHERE ft.id = ?`,
    args: [id],
  });
  return rows[0] ? row2topic(rows[0] as unknown as Record<string, unknown>) : undefined;
}

export async function getForumReplies(topicId: string, page = 1, limit = 30): Promise<{ replies: ForumReply[]; total: number }> {
  await ensureReady();
  const offset = (page - 1) * limit;
  const [{ rows }, { rows: countRows }] = await Promise.all([
    client.execute({
      sql: `SELECT fr.*, u.username, u.display_name, u.avatar, u.discord_avatar, u.role
            FROM forum_replies fr JOIN users u ON u.id = fr.user_id
            WHERE fr.topic_id = ? ORDER BY fr.created_at ASC LIMIT ? OFFSET ?`,
      args: [topicId, limit, offset],
    }),
    client.execute({ sql: "SELECT COUNT(*) as cnt FROM forum_replies WHERE topic_id = ?", args: [topicId] }),
  ]);
  return { replies: rows.map(r => row2reply(r as unknown as Record<string, unknown>)), total: Number((countRows[0] as unknown as Record<string, unknown>)?.cnt ?? 0) };
}

export async function createForumTopic(data: { id: string; categoryId: string; userId: string; title: string; content: string; status?: ForumTopicStatus }): Promise<void> {
  await ensureReady();
  await client.execute({
    sql: "INSERT INTO forum_topics (id, category_id, user_id, title, content, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [data.id, data.categoryId, data.userId, data.title, data.content, data.status ?? "pending", new Date().toISOString()],
  });
}

export async function getPendingForumTopics(): Promise<ForumTopic[]> {
  await ensureReady();
  const { rows } = await client.execute(`
    SELECT ft.*, fc.slug AS category_slug, fc.name AS category_name,
           u.username, u.display_name, u.avatar, u.discord_avatar, u.role,
           0 AS reply_count, NULL AS last_reply_username, NULL AS last_reply_display_name
    FROM forum_topics ft
    JOIN forum_categories fc ON fc.id = ft.category_id
    JOIN users u ON u.id = ft.user_id
    WHERE ft.status = 'pending'
    ORDER BY ft.created_at ASC
  `);
  return rows.map(r => row2topic(r as unknown as Record<string, unknown>));
}

export async function getDeletedForumTopics(): Promise<ForumTopic[]> {
  await ensureReady();
  const { rows } = await client.execute(`
    SELECT ft.*, fc.slug AS category_slug, fc.name AS category_name,
           u.username, u.display_name, u.avatar, u.discord_avatar, u.role,
           (SELECT COUNT(*) FROM forum_replies fr WHERE fr.topic_id = ft.id) AS reply_count,
           NULL AS last_reply_username, NULL AS last_reply_display_name
    FROM forum_topics ft
    JOIN forum_categories fc ON fc.id = ft.category_id
    JOIN users u ON u.id = ft.user_id
    WHERE ft.status = 'deleted'
    ORDER BY ft.created_at DESC
  `);
  return rows.map(r => row2topic(r as unknown as Record<string, unknown>));
}

export async function getUserForumTopics(userId: string): Promise<ForumTopic[]> {
  await ensureReady();
  const { rows } = await client.execute({
    sql: `SELECT ft.*, fc.slug AS category_slug, fc.name AS category_name,
                 u.username, u.display_name, u.avatar, u.discord_avatar, u.role,
                 (SELECT COUNT(*) FROM forum_replies fr WHERE fr.topic_id = ft.id) AS reply_count,
                 NULL AS last_reply_username, NULL AS last_reply_display_name
          FROM forum_topics ft
          JOIN forum_categories fc ON fc.id = ft.category_id
          JOIN users u ON u.id = ft.user_id
          WHERE ft.user_id = ?
          ORDER BY ft.created_at DESC`,
    args: [userId],
  });
  return rows.map(r => row2topic(r as unknown as Record<string, unknown>));
}

export async function approveForumTopic(id: string): Promise<void> {
  await ensureReady();
  await client.execute({ sql: "UPDATE forum_topics SET status = 'approved' WHERE id = ?", args: [id] });
}

export async function rejectForumTopic(id: string, reason: string): Promise<void> {
  await ensureReady();
  await client.execute({ sql: "UPDATE forum_topics SET status = 'rejected', rejected_reason = ? WHERE id = ?", args: [reason || null, id] });
}

export async function createForumReply(data: { id: string; topicId: string; userId: string; content: string }): Promise<void> {
  await ensureReady();
  const now = new Date().toISOString();
  await client.execute({ sql: "INSERT INTO forum_replies (id, topic_id, user_id, content, created_at) VALUES (?, ?, ?, ?, ?)", args: [data.id, data.topicId, data.userId, data.content, now] });
  await client.execute({ sql: "UPDATE forum_topics SET last_reply_at = ?, last_reply_user_id = ? WHERE id = ?", args: [now, data.userId, data.topicId] });
}

export async function deleteForumTopic(id: string, reason: string): Promise<void> {
  await ensureReady();
  await client.execute({ sql: "UPDATE forum_topics SET status = 'deleted', deleted_reason = ? WHERE id = ?", args: [reason || null, id] });
}

export async function deleteForumReply(id: string): Promise<void> {
  await ensureReady();
  await client.execute({ sql: "DELETE FROM forum_reactions WHERE target_id = ? AND target_type = 'reply'", args: [id] });
  await client.execute({ sql: "DELETE FROM forum_replies WHERE id = ?", args: [id] });
}

export async function toggleForumTopicPin(id: string): Promise<void> {
  await ensureReady();
  await client.execute({ sql: "UPDATE forum_topics SET pinned = CASE WHEN pinned = 1 THEN 0 ELSE 1 END WHERE id = ?", args: [id] });
}

export async function toggleForumTopicLock(id: string): Promise<void> {
  await ensureReady();
  await client.execute({ sql: "UPDATE forum_topics SET locked = CASE WHEN locked = 1 THEN 0 ELSE 1 END WHERE id = ?", args: [id] });
}

export async function incrementForumTopicViews(id: string): Promise<void> {
  await ensureReady();
  await client.execute({ sql: "UPDATE forum_topics SET views = views + 1 WHERE id = ?", args: [id] });
}

export async function getForumReactions(targetIds: string[], targetType: string, userId?: string): Promise<Record<string, ForumReaction[]>> {
  await ensureReady();
  if (!targetIds.length) return {};
  const placeholders = targetIds.map(() => "?").join(",");
  const { rows } = await client.execute({
    sql: `SELECT target_id, emoji, COUNT(*) as cnt, ${userId ? `MAX(CASE WHEN user_id = ? THEN 1 ELSE 0 END)` : "0"} AS user_reacted
          FROM forum_reactions WHERE target_id IN (${placeholders}) AND target_type = ?
          GROUP BY target_id, emoji ORDER BY cnt DESC`,
    args: userId ? [userId, ...targetIds, targetType] : [...targetIds, targetType],
  });
  const result: Record<string, ForumReaction[]> = {};
  for (const r of rows) {
    const row = r as unknown as Record<string, unknown>;
    const tid = String(row.target_id);
    if (!result[tid]) result[tid] = [];
    result[tid].push({ emoji: String(row.emoji), count: Number(row.cnt), userReacted: Number(row.user_reacted) === 1 });
  }
  return result;
}

export async function toggleForumReaction(targetId: string, targetType: string, userId: string, emoji: string): Promise<void> {
  await ensureReady();
  const { rows } = await client.execute({ sql: "SELECT id FROM forum_reactions WHERE target_id = ? AND target_type = ? AND user_id = ? AND emoji = ?", args: [targetId, targetType, userId, emoji] });
  if (rows.length > 0) {
    await client.execute({ sql: "DELETE FROM forum_reactions WHERE target_id = ? AND target_type = ? AND user_id = ? AND emoji = ?", args: [targetId, targetType, userId, emoji] });
  } else {
    await client.execute({ sql: "INSERT INTO forum_reactions (id, target_id, target_type, user_id, emoji, created_at) VALUES (?, ?, ?, ?, ?, ?)", args: [randomUUID(), targetId, targetType, userId, emoji, new Date().toISOString()] });
  }
}

export async function createForumReport(data: { targetId: string; targetType: string; userId: string; reason: string }): Promise<void> {
  await ensureReady();
  await client.execute({ sql: "INSERT INTO forum_reports (id, target_id, target_type, user_id, reason, created_at) VALUES (?, ?, ?, ?, ?, ?)", args: [randomUUID(), data.targetId, data.targetType, data.userId, data.reason, new Date().toISOString()] });
}

export async function getForumReports(resolved = false): Promise<ForumReport[]> {
  await ensureReady();
  const { rows } = await client.execute({
    sql: `SELECT r.*, u.username,
            CASE WHEN r.target_type = 'topic' THEN r.target_id
                 ELSE (SELECT fr.topic_id FROM forum_replies fr WHERE fr.id = r.target_id) END AS topic_id,
            CASE WHEN r.target_type = 'topic' THEN (SELECT ft.title FROM forum_topics ft WHERE ft.id = r.target_id)
                 ELSE (SELECT ft.title FROM forum_topics ft JOIN forum_replies fr ON fr.topic_id = ft.id WHERE fr.id = r.target_id) END AS topic_title,
            CASE WHEN r.target_type = 'topic' THEN (SELECT fc.slug FROM forum_categories fc JOIN forum_topics ft ON ft.category_id = fc.id WHERE ft.id = r.target_id)
                 ELSE (SELECT fc.slug FROM forum_categories fc JOIN forum_topics ft ON ft.category_id = fc.id JOIN forum_replies fr ON fr.topic_id = ft.id WHERE fr.id = r.target_id) END AS category_slug
          FROM forum_reports r LEFT JOIN users u ON u.id = r.user_id
          WHERE r.resolved = ? ORDER BY r.created_at DESC`,
    args: [resolved ? 1 : 0],
  });
  return rows.map(r => {
    const row = r as unknown as Record<string, unknown>;
    return {
      id: String(row.id), targetId: String(row.target_id),
      targetType: String(row.target_type) as "topic" | "reply",
      userId: String(row.user_id), username: String(row.username ?? ""),
      reason: String(row.reason ?? ""), resolved: Number(row.resolved) !== 0,
      createdAt: String(row.created_at),
      topicId: row.topic_id ? String(row.topic_id) : null,
      topicTitle: row.topic_title ? String(row.topic_title) : null,
      categorySlug: row.category_slug ? String(row.category_slug) : null,
    };
  });
}

export async function resolveForumReport(id: string): Promise<void> {
  await ensureReady();
  await client.execute({ sql: "UPDATE forum_reports SET resolved = 1 WHERE id = ?", args: [id] });
}

export async function createForumCategory(data: { id: string; slug: string; name: string; description: string; color: string; icon: string; position: number }): Promise<void> {
  await ensureReady();
  await client.execute({ sql: "INSERT INTO forum_categories (id, slug, name, description, color, icon, position, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", args: [data.id, data.slug, data.name, data.description, data.color, data.icon, data.position, new Date().toISOString()] });
}

export async function updateForumCategory(id: string, data: Partial<{ name: string; description: string; color: string; icon: string; position: number; slug: string }>): Promise<void> {
  await ensureReady();
  const COL: Record<string, string> = { name: "name", description: "description", color: "color", icon: "icon", position: "position", slug: "slug" };
  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  if (!entries.length) return;
  const set = entries.map(([k]) => `${COL[k]} = ?`).join(", ");
  await client.execute({ sql: `UPDATE forum_categories SET ${set} WHERE id = ?`, args: [...entries.map(([, v]) => String(v!)), id] });
}

export async function deleteForumCategory(id: string): Promise<void> {
  await ensureReady();
  const { rows } = await client.execute({ sql: "SELECT id FROM forum_topics WHERE category_id = ?", args: [id] });
  for (const r of rows) {
    const topicId = String((r as unknown as Record<string, unknown>).id);
    await client.execute({ sql: "DELETE FROM forum_replies WHERE topic_id = ?", args: [topicId] });
    await client.execute({ sql: "DELETE FROM forum_reactions WHERE target_id = ? OR target_id IN (SELECT id FROM forum_replies WHERE topic_id = ?)", args: [topicId, topicId] });
    await client.execute({ sql: "DELETE FROM forum_topics WHERE id = ?", args: [topicId] });
  }
  await client.execute({ sql: "DELETE FROM forum_categories WHERE id = ?", args: [id] });
}

export async function searchForum(query: string, limit = 30): Promise<ForumTopic[]> {
  await ensureReady();
  const q = `%${query}%`;
  const { rows } = await client.execute({
    sql: `SELECT ft.*, fc.slug AS category_slug, fc.name AS category_name,
            u.username, u.display_name, u.avatar, u.discord_avatar, u.role,
            (SELECT COUNT(*) FROM forum_replies fr WHERE fr.topic_id = ft.id) AS reply_count,
            NULL AS last_reply_username, NULL AS last_reply_display_name
          FROM forum_topics ft
          JOIN forum_categories fc ON fc.id = ft.category_id
          JOIN users u ON u.id = ft.user_id
          WHERE ft.title LIKE ? OR ft.content LIKE ?
          ORDER BY ft.created_at DESC LIMIT ?`,
    args: [q, q, limit],
  });
  return rows.map(r => row2topic(r as unknown as Record<string, unknown>));
}

export async function getForumReply(id: string): Promise<ForumReply | undefined> {
  await ensureReady();
  const { rows } = await client.execute({
    sql: `SELECT fr.*, u.username, u.display_name, u.avatar, u.discord_avatar, u.role
          FROM forum_replies fr JOIN users u ON u.id = fr.user_id WHERE fr.id = ?`,
    args: [id],
  });
  return rows[0] ? row2reply(rows[0] as unknown as Record<string, unknown>) : undefined;
}
