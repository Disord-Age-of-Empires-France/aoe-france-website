# Age of Empires France — Site officiel

Le point de ralliement des joueurs francophones passionnés par les jeux **Age of Empires**. Actualités, guides, forum communautaire, coaching et bien plus.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| UI | [React 19](https://react.dev), [Tailwind CSS v4](https://tailwindcss.com) |
| Langage | TypeScript 5 |
| Base de données | [Turso](https://turso.tech) (libSQL / SQLite edge) |
| Icônes | [Lucide React](https://lucide.dev) |
| Markdown | Marked + DOMPurify + sanitize-html |
| Auth | Sessions serveur (cookie signé JWT), TOTP 2FA, WebAuthn (FIDO2) |
| 2FA TOTP | [otpauth](https://github.com/hectorm/otpauth), [qrcode](https://github.com/soldair/node-qrcode) |
| 2FA WebAuthn | [@simplewebauthn/server](https://simplewebauthn.dev) + browser |

---

## Fonctionnalités

### Public
- **Accueil** — Actualités récentes, événements et jeux mis en avant
- **Actualités** — Articles avec catégories, miniatures et filtres par jeu
- **Forum** — Sections thématiques, topics, réactions, modération
- **Profils membres** — Liaison comptes Steam / Xbox, statistiques, historique
- **Pages de présentation** — AoE II, AoE III, AoE IV, AoM: Retold avec widget d'achat
- **Civilopédie** — fiches par civilisation/dieu avec unités, bâtiments et technologies (stats DPS, armure, coût, portée…)
- **Coaching** — Annuaire des coachs avec rangs, civilisations et tarifs
- **Acheter** — Liens d'achat par jeu et plateforme avec prix Steam en temps réel
- **Communauté** — Serveur Discord, tournois, événements, partenaires

### Sécurité & authentification
- Connexion par email/mot de passe avec sessions sécurisées (cookie signé JWT)
- Gestion des rôles : `member`, `editor`, `admin`
- Double authentification (2FA) via application TOTP (Google Authenticator, Authy…)
- Double authentification via clés de sécurité physiques WebAuthn / FIDO2 (YubiKey…)
- Codes de secours pour la récupération TOTP
- Appareils de confiance (mémorisation 30 jours)
- Réinitialisation 2FA par un administrateur

### Back-office (`/admin`)
- Gestion des actualités (création, édition, publication)
- Gestion du forum et modération (signalements, bans)
- Gestion des utilisateurs et des rôles, statut 2FA visible et réinitialisable
- Gestion des coachs (CRUD complet)
- Gestion de la boutique (liens d'achat par jeu et plateforme)
- Bot Discord (commandes personnalisées)
- Paramètres du site : navigation, feature flags, Steam App IDs, textes promo
- **Données du jeu** — synchronisation des entités AoE IV depuis [aoe4world/data](https://github.com/aoe4world/data)
- Journal d'activité (logs admin)
- Mode maintenance avec date de fin configurable

---

## Prérequis

- Node.js ≥ 20
- Un compte [Turso](https://turso.tech) (gratuit pour commencer)

---

## Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/votre-org/aoe-france-website.git
cd aoe-france-website

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env.local
# Remplir TURSO_DATABASE_URL et TURSO_AUTH_TOKEN

# 4. Lancer en développement
npm run dev
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

---

## Variables d'environnement

| Variable | Description | Requis |
|---|---|---|
| `TURSO_DATABASE_URL` | URL de la base Turso (`libsql://...`) | Oui |
| `TURSO_AUTH_TOKEN` | Token d'authentification Turso | Oui |
| `AUTH_SECRET` | Secret de signature des cookies de session | Oui |
| `NEXT_PUBLIC_SITE_URL` | URL publique du site (ex: `https://aoe-france.com`) | Oui |

---

## Scripts disponibles

```bash
npm run dev      # Serveur de développement (HMR)
npm run build    # Build de production
npm run start    # Démarrer le serveur de production
npm run lint     # Lint ESLint
```

---

## Structure du projet

```
src/
├── app/                    # Pages et routes (App Router Next.js)
│   ├── (jeux)/             # Pages publiques par jeu
│   │   ├── aoe2/
│   │   ├── aoe3/
│   │   ├── aoe4/
│   │   └── aom-retold/
│   ├── admin/              # Back-office (protégé)
│   │   ├── actualites/
│   │   ├── bot/
│   │   ├── coaching/
│   │   ├── forum/
│   │   ├── logs/
│   │   ├── parametres/
│   │   ├── store/
│   │   └── utilisateurs/
│   ├── actions/            # Server Actions (mutations)
│   ├── api/                # Route Handlers (REST)
│   ├── coaching/
│   ├── communaute/
│   ├── forum/
│   └── profil/
├── components/             # Composants React réutilisables
│   ├── admin/              # Composants spécifiques au BO
│   ├── forum/
│   └── aoe4/
└── lib/                    # Logique métier et utilitaires
    ├── db.ts               # Client Turso + toutes les requêtes
    ├── session.ts          # Gestion des sessions et cookies 2FA
    ├── totp.ts             # Génération et vérification TOTP / codes de secours
    ├── webauthn.ts         # Configuration Relying Party WebAuthn
    ├── steam-price.ts      # Fetch prix Steam (cache 30 min)
    ├── levels.ts           # Système de niveaux / XP
    ├── discord.ts          # Intégration Discord
    └── version.ts          # Version de l'application
```

---

## Feature flags

Les fonctionnalités peuvent être activées/désactivées depuis `/admin/parametres` sans redéploiement :

| Flag | Description |
|---|---|
| `feature_forum` | Active le forum communautaire |
| `feature_coaching` | Active la page coaching et l'annuaire des coachs |
| `feature_aoe2/3/4/aom` | Active la section d'un jeu |
| `feature_members` | Active les profils membres publics |
| `maintenance_mode` | Active le mode maintenance |

---

## Déploiement

Le projet est optimisé pour un déploiement sur **Vercel** :

```bash
# Via CLI Vercel
npx vercel --prod
```

Configurer les variables d'environnement dans le dashboard Vercel avant le premier déploiement.

---

## Licence

Projet privé — tous droits réservés © 2026 Age of Empires France.
