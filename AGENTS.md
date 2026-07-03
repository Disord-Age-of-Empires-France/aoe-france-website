<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Règles du projet — Age of Empires France

## Langue

- **UI** (labels, placeholders, messages d'erreur, textes) → **français**
- **Code** (variables, fonctions, types, interfaces, noms de fichiers) → **anglais**
- Ne jamais mélanger les deux dans un même contexte.

---

## Base de données

- **Turso uniquement** (`@libsql/client`). Pas de fallback SQLite local, pas de fichier `.db`, pas de `better-sqlite3`.
- Toutes les requêtes passent par `src/lib/db.ts`. Ne pas écrire de requêtes SQL ailleurs.
- Schéma : utiliser uniquement `CREATE TABLE IF NOT EXISTS` et `INSERT OR IGNORE`. Jamais de `DROP` ou `ALTER` sans confirmation explicite de l'utilisateur.
- Pour ajouter une colonne à une table existante, utiliser le pattern `try { ALTER TABLE ... ADD COLUMN } catch { /* already exists */ }` — ne jamais supposer que la colonne n'existe pas.
- Les variables de connexion viennent exclusivement des variables d'environnement (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`).

---

## Variables d'environnement requises

| Variable | Usage |
|---|---|
| `TURSO_DATABASE_URL` | URL de connexion Turso |
| `TURSO_AUTH_TOKEN` | Token d'authentification Turso |
| `AUTH_SECRET` | Secret de signature des JWT de session |
| `NEXT_PUBLIC_SITE_URL` | URL publique du site |

Ne jamais écrire de valeur de secret dans le code source, même en commentaire.

---

## Next.js — App Router

- `params` et `searchParams` sont des **Promises** dans cette version. Toujours `await params` et `await searchParams` avant utilisation.
- **Server components par défaut.** N'ajouter `"use client"` que quand l'interactivité le justifie (état local, événements DOM, hooks React).
- Stratégie de cache par défaut : `{ next: { revalidate: 60 } }` sur les fetches. Adapter selon la volatilité (ex: prix Steam → `revalidate: 1800` — déjà géré dans `src/lib/steam-price.ts`).
- Les Server Actions retournent un état consommé par `useActionState`. Les actions non-formulaires (delete, toggle) utilisent `useTransition`.
- Après toute mutation dans une Server Action, appeler `revalidatePath("/chemin/concerné")` pour invalider le cache Next.js.

---

## Authentification et accès

Utiliser les helpers de `src/lib/auth-check.ts` — ne pas réinventer la vérification manuellement :

- `requireBOAccess()` → toute page admin (editor + admin). Gère aussi le refresh de session si le rôle a changé en DB.
- `requireAdminAccess()` → pages réservées aux admins uniquement.
- `requireSelfAccess()` → profil propre de l'utilisateur connecté.

Les 3 rôles du projet : `"admin"` | `"editor"` | `"member"`. Les editors ont accès au back-office sauf les fonctions admin-only.

Pour les **pages publiques conditionnelles** (feature flag), utiliser `gateFeature` de `src/lib/public-access.ts` :
```ts
gateFeature(settings, session, settings.features.xxx);
// Les admins et editors passent toujours, les autres sont redirigés vers "/" si désactivé.
```

Dans les **Server Actions**, vérifier le rôle en première ligne avant toute mutation :
```ts
const session = await getSession();
if (!session || session.role !== "admin") throw new Error("Unauthorized");
```

---

## Audit trail

Toute mutation admin (création, modification, suppression) doit appeler `createLog()` après la mutation :
```ts
await createLog({
  userId:   session.userId,
  username: session.username,
  role:     session.role,
  action:   "article.create",   // format: entité.action
  target:   data.title,          // identifiant lisible de la cible
});
```

---

## Tailwind CSS v4

Le projet n'a **pas de `tailwind.config.js`**. La configuration est dans `src/app/globals.css` via `@theme inline`. Utiliser uniquement les tokens du projet — ne pas utiliser les utilitaires Tailwind standard comme `bg-gray-900` ou `text-zinc-500`.

**Tokens disponibles :**

| Classe Tailwind | Rôle |
|---|---|
| `bg-background` | Fond de page principal |
| `bg-surface` | Fond de carte / panel |
| `bg-surface-2` | Fond secondaire (input, badge) |
| `bg-surface-3` | Fond footer / très sombre |
| `text-foreground` | Texte principal blanc |
| `text-muted` | Texte secondaire gris |
| `text-faint` | Texte tertiaire très discret |
| `text-gold` | Couleur accent dorée (`#c8a32e`) |
| `border-border-site` | Bordure standard |

La couleur accent du site est `#c8a32e`. Quand les tokens ne suffisent pas, utiliser la valeur hexadécimale directement (ex: `text-[#c8a32e]`).

---

## TypeScript

- Pas de `any`. Pas de cast `as unknown as X` sans commentaire justifiant pourquoi.
- Interfaces explicites pour toutes les données issues de la DB (voir les types dans `db.ts`).
- `SiteSettings` est le type de retour de `getSettings()` — ne pas accéder aux settings autrement qu'à travers ses propriétés typées.
- Ne pas laisser d'imports inutilisés.

---

## Code

- **Pas de commentaires qui décrivent le WHAT** — le code bien nommé se suffit. Commenter uniquement les WHY non-évidents (contrainte cachée, workaround, invariant surprenant).
- **Pas de `console.log`** dans le code commité.
- Pas d'abstraction prématurée. Trois lignes similaires ne justifient pas un helper. Implémenter ce qui est demandé, rien de plus.
- Pas de gestion d'erreur pour des cas impossibles. Valider uniquement aux frontières (input utilisateur, APIs externes).

---

## Sécurité

- Tout input utilisateur affiché en HTML doit passer par `sanitize-html` ou `DOMPurify`.
- Les données renvoyées au client doivent être filtrées : ne jamais exposer les champs sensibles (hash de mot de passe, tokens internes, etc.).
- Jamais de clé, token ou secret dans le code source — uniquement via variables d'environnement.

---

## Erreurs

- Les erreurs dans les Server Actions sont **affichées via le système de notifications/toast côté client**.
- Retourner un objet typé `{ error: string }` plutôt que de throw dans les actions appelées depuis l'UI.
- Ne pas utiliser `error.tsx` pour les erreurs métier.

---

## UI / Composants

- **Proposer un format compact en même temps que le format complet** quand un composant peut apparaître dans des contextes de taille différente (widget, carte, modal).
- Le placement d'un élément dans une page doit être discuté si ce n'est pas évident — ne pas décider seul de la position d'un composant structurant.
- Les composants Next.js `Image` nécessitent toujours `width`/`height` explicites ou `fill` + un parent `relative`.

---

## Refactors globaux

- Lors d'une modification qui s'applique à plusieurs fichiers similaires, **lister tous les fichiers concernés avant de commencer** (glob complet) pour n'en oublier aucun.
- Vérifier systématiquement les 4 pages de présentation : `aoe2/presentation`, `aoe3/presentation`, `aoe4/presentation`, `aom-retold/presentation`.

---

## Git

- Conventional Commits : `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `style:`.
- Jamais de commit sans avoir listé les fichiers modifiés (`git status`) et vérifié le diff.
- Ne pas commiter sans que l'utilisateur l'ait demandé explicitement.
- Mettre à jour `CHANGELOG.md` et `src/lib/version.ts` à chaque nouvelle version livrée.

---

## Comportement de l'agent

- Si une tâche est ambiguë ou qu'un choix structurant existe, **poser la question avant d'implémenter**.
- Ne pas implémenter de fonctionnalités non demandées (pas de "j'en ai profité pour aussi…").
- Quand plusieurs fichiers doivent être modifiés de façon identique, les traiter en parallèle (appels d'outils simultanés).

### Clarification systématique avant toute implémentation

Avant de coder quoi que ce soit, **toujours clarifier la demande** en posant des questions ou en proposant des options concrètes. L'objectif est de livrer quelque chose de qualité du premier coup plutôt que d'itérer plusieurs fois sur un malentendu.

Questions types à poser selon le contexte :
- **UI** : quel format (compact/complet) ? quelle position dans la page ? responsive ou desktop only ?
- **Fonctionnalité** : qui y a accès (membres, admin, tous) ? feature flag nécessaire ? données persistées ou statiques ?
- **Composant réutilisable** : dans combien d'endroits apparaît-il ? quelles variations prévues ?
- **Page** : contenu dynamique ou statique ? lié à d'autres pages existantes ?

Si la demande est claire et sans ambiguïté, implémenter directement sans poser de questions inutiles.
