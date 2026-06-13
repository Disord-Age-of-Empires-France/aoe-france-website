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
    ],
    "write"
  );

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
    publishedAt: row.published_at ? String(row.published_at) : null,
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
  publishedAt: string | null;
}

export interface User {
  id:            string;
  username:      string;
  passwordHash:  string;
  displayName:   string;
  email:         string;
  role:          UserRole;
  discordId:     string | null;
  discordAvatar: string;
  createdAt:     string;
  lastLogin:     string | null;
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

export async function getArticles(): Promise<Article[]> {
  await ensureReady();
  const { rows } = await client.execute("SELECT * FROM articles ORDER BY date DESC");
  return rows.map(toArticle);
}

export async function getPublishedArticles(): Promise<Article[]> {
  await ensureReady();
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
  const publishedAt = data.status === "published" ? createdAt : null;
  await client.execute({
    sql: `INSERT INTO articles
            (id, badge, badgeColor, categories, title, description, content, date, status, thumbnail, created_at, published_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, data.badge, data.badgeColor, JSON.stringify(data.categories), data.title, data.description, data.content, data.date, data.status, data.thumbnail, createdAt, publishedAt],
  });
  return { ...data, id, createdAt, publishedAt };
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
  };
  const entries = Object.entries(data).filter(([k]) => DB_COL[k]);
  if (!entries.length) return;
  const setClauses: string[]  = entries.map(([k]) => `${DB_COL[k]} = ?`);
  const args: InValue[] = entries.map(([k, val]) =>
    k === "categories" ? JSON.stringify(val) : String(val ?? "")
  );
  // Set published_at the first time status becomes "published"
  if (data.status === "published") {
    setClauses.push("published_at = COALESCE(published_at, ?)");
    args.push(new Date().toISOString());
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
  discordInvite?:       string;
  siteName?:            string;
  feature_news?:        boolean;
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
  if (data.discordInvite       !== undefined) pairs.push(["discordInvite",       data.discordInvite]);
  if (data.siteName            !== undefined) pairs.push(["siteName",            data.siteName]);
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
  return { ...data, id, createdAt, lastLogin: null, discordId: null, discordAvatar: "" };
}

export async function updateUser(
  id: string,
  data: Partial<{ username: string; passwordHash: string; displayName: string; email: string; role: UserRole }>
): Promise<void> {
  await ensureReady();
  const COL: Record<string, string> = {
    username:     "username",
    passwordHash: "password_hash",
    displayName:  "display_name",
    email:        "email",
    role:         "role",
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
    discordAvatar: data.discordAvatar, createdAt, lastLogin: null,
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
