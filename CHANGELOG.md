# Changelog

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

---

## [1.2.0] — 2026-07-03

### Ajouté

#### Civilopédie — Unités, Bâtiments & Technologies
- Pages de détail par civilisation / dieu majeur pour AoE II, AoE III, AoE IV et AoM : Retold
- Composant `EntityGrid` : affichage tabulaire des entités groupées par catégorie
  - **Unités** : PV, DPS (auto-calculé), portée, armure (mêlée/distance), vitesse, coût, badge unique, badge d'âge, avantages/inconvénients, lieu de production
  - **Bâtiments** : PV, coût, temps de construction, avantages/inconvénients
  - **Technologies** : coût, temps de recherche, catégorie, effet en italique
- Icônes natives des entités (servies depuis GitHub ou les CDN du jeu)
- Badge doré « Unique » sur les unités/bâtiments spécifiques à une civilisation
- Couleurs de ressources distinctes : nourriture (ambre), bois (lime), or (jaune), pierre (stone), faveur (violet)
- Badges d'armure abrégés M (mêlée) / D (distance) / É (écrasement)

#### Données jeu AoE IV — Intégration aoe4world/data
- Synchronisation des données depuis [`aoe4world/data`](https://github.com/aoe4world/data) (extraction directe des fichiers du jeu)
- Fetch des 3 fichiers `units/all-unified.json`, `buildings/all-unified.json`, `technologies/all-unified.json` en parallèle
- Déduplication des unités non-uniques (conservation de la version âge max, `civilization = null`)
- Calcul automatique du DPS : `round((damage / speed) × 10) / 10`
- Parsing des avantages/inconvénients depuis le champ description (lignes `+ ` / `- `)
- Table `game_entities` en base avec index `UNIQUE(game, civilization, type, slug)`

#### Page d'administration — Synchronisation des données
- Section « Données du jeu » dans le back-office (`/admin/game-data`)
- Déclenchement manuel de la sync AoE IV depuis GitHub
- Retour du nombre d'entités synchronisées par type

#### Système de notifications
- Cloche de notifications en temps réel dans la navbar
- API `GET /api/notifications` + `POST /api/notifications/[id]/read`

---

## [1.1.0] — 2026-07-02

### Ajouté

#### Double authentification (2FA)
- Authentification TOTP via application (Google Authenticator, Authy, 1Password…)
- QR code de configuration généré côté serveur, saisie du premier code pour confirmer l'activation
- 8 codes de secours à usage unique (format `XXXX-XXXX`, hachés en SHA-256 en base)
- Clés de sécurité physiques WebAuthn / FIDO2 (YubiKey, clés NFC…) comme alternative au TOTP
- Plusieurs clés par compte, renommage et suppression depuis le profil
- Flux de vérification `/2fa` avec onglets TOTP / Clé de sécurité selon les méthodes disponibles
- Option « Se souvenir de cet appareil 30 jours » (token haché en base, cookie httpOnly)
- Administrateurs : réinitialisation TOTP et/ou WebAuthn d'un utilisateur depuis `/admin/utilisateurs/[id]`
- Statut 2FA visible sur la fiche utilisateur dans le back-office

#### Infrastructure
- Table `webauthn_credentials` : stockage des clés publiques (base64url), compteur anti-rejeu, transports
- Table `trusted_devices` : appareils mémorisés après une 2FA validée
- Cookies courts-vécus signés pour l'état 2FA en attente (`pending_2fa`) et le challenge WebAuthn (`wa_challenge`)

---

## [1.0.0] — 2026-07-02

Première version publique du site **Age of Empires France**.

### Ajouté

#### Site public
- Page d'accueil avec section actualités, jeux mis en avant et événements
- Pages de présentation pour AoE II: DE, AoE III: DE, AoE IV et AoM: Retold
- Widget d'achat compact sur les pages de présentation (prix Steam en temps réel, liens par plateforme)
- Page dédiée `/acheter` listant tous les liens d'achat par jeu avec prix et badges promotionnels
- Page coaching avec annuaire des coachs (rang, civilisations, tarifs, format)
- Forum communautaire : sections, topics, réponses, réactions emoji, épinglage
- Système d'actualités avec catégories, miniatures et pagination
- Profils membres publics avec liaison comptes Steam et Xbox (gamertag manuel)
- Page Discord communautaire
- Mode maintenance avec message et date de fin configurables

#### Système d'authentification
- Connexion par email/mot de passe avec sessions sécurisées (cookie signé)
- Gestion des rôles : membre, modérateur, administrateur
- Profil utilisateur éditable (avatar, pseudo, biographie)

#### Back-office (`/admin`)
- Tableau de bord avec statistiques rapides
- Gestion complète des actualités (CRUD, publication, miniatures)
- Gestion du forum : modération, signalements, bans temporaires/permanents
- Gestion des utilisateurs (création, édition, changement de rôle)
- Gestion des coachs (CRUD avec rangs AoE4, civilisations, tarifs)
- Gestion de la boutique : liens d'achat par jeu et plateforme (Steam, Xbox, MS Store, Game Pass…)
- Gestion du bot Discord (commandes personnalisées avec réponses)
- Paramètres du site : navigation, feature flags, Steam App IDs, textes promotionnels
- Journal d'activité admin (logs horodatés)

#### Infrastructure
- Base de données Turso (libSQL / SQLite edge) avec schéma versionné
- Fetch prix Steam via l'API publique avec cache serveur de 30 minutes
- Feature flags dynamiques sans redéploiement
- Navigation configurable depuis le back-office (activation/désactivation par section)
- Liens affiliés avec badge `*` et mention légale automatique
- Version du site affichée dans le footer (`v1.0.0`)

---
