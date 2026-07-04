# Premium Planner Web PWA Application

Une application de planification personnelle premium inspirée de l'ergonomie de **Things 3**, **Sunsama**, et **Fantastical**. Conçue en **React + TypeScript + Tailwind CSS**, elle est rapide, fonctionne 100% en local et offline (PWA), et intègre des interactions tactiles avancées.

## Fonctionnalités Principales

*   📅 **Vues du Calendrier** : Naviguez entre les vues **Jour** (frise horaire interactive), **Semaine** (tableau de bord hebdomadaire), et **Mois** (grille d'indicateurs colorés).
*   👆 **Interactions Tactiles (Gestes Swipe)** :
    *   **Swipe vers la droite** : Marque la tâche ou l'événement comme complété (effet vert et vibration haptique).
    *   **Swipe vers la gauche** : Révèle les actions rapides de gestion (Modifier, Supprimer, et Reporter).
*   🛠️ **Gestion des Tâches** : Création rapide ou avancée de tâches avec dates d'échéance, sous-tâches interactives, priorités de couleur, et récurrences.
*   🏷️ **Catégories Personnalisées** : Organisez vos tâches avec des couleurs et des icônes issues de la bibliothèque de symboles de l'application.
*   📊 **Analytics & Streaks** : Un tableau de bord de productivité pour suivre vos accomplissements hebdomadaires et vos séries de jours actifs.
*   💾 **Fonctionnement Offline & Sauvegardes** :
    *   Stockage instantané dans IndexedDB (via Dexie.js).
    *   Possibilité d'importer ou d'exporter vos données au format JSON en un clic.
*   🔍 **Recherche Globale** : Un moteur de recherche réactif ouvert par raccourci clavier (**Cmd+K** ou **Ctrl+K**).
*   🌙 **Mode Sombre/Clair** : Adaptation automatique selon les préférences de votre système d'exploitation.

---

## Stack Technique

*   **Frontend** : [React](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
*   **Styling & Animations** : [Tailwind CSS](https://tailwindcss.com/) + [Framer Motion](https://www.framer.com/motion/)
*   **Base de données locale** : [Dexie.js](https://dexie.org/) (IndexedDB wrapper)
*   **Gestion d'état** : [Zustand](https://zustand-demo.pmnd.rs/) (Store global léger et réactif)
*   **Dates** : [date-fns](https://date-fns.org/)

---

## 🔐 Comptes utilisateurs, authentification & synchronisation (SaaS)

L'application dispose désormais d'un vrai backend (`server/`) qui transforme le planificateur local en application multi-utilisateurs avec comptes, sauvegarde automatique et synchronisation multi-appareils.

### Architecture

* **Frontend** (`src/`) : inchangé dans son fonctionnement local (Dexie/IndexedDB reste le cache local instantané, offline-first), auquel s'ajoute :
  * `src/features/auth/` : pages Connexion, Inscription, Mot de passe oublié, Réinitialisation.
  * `src/store/authStore.ts` : état d'authentification (zustand).
  * `src/lib/api.ts` : client HTTP (cookies httpOnly + CSRF + refresh automatique).
  * `src/lib/syncEngine.ts` : moteur de synchronisation (pull à la connexion, push automatique après chaque changement, gestion de conflits par version).
  * `src/components/ProfileModal.tsx` : édition du profil, changement de mot de passe, suppression de compte.
* **Backend** (`server/`) : API Node.js / Express / SQLite (`better-sqlite3`), indépendante, à lancer séparément.
  * Mots de passe hashés avec **Argon2id**.
  * Sessions via **JWT access token** (15 min, cookie httpOnly) + **refresh token opaque** avec rotation, stocké hashé en base (révocable).
  * Protection **CSRF** (double-submit cookie), **CORS** strict, en-têtes de sécurité **Helmet**.
  * **Rate limiting** sur les tentatives de connexion/inscription/réinitialisation + verrouillage de compte après 5 échecs (15 min).
  * Validation stricte des entrées côté serveur (**Zod**), requêtes SQL exclusivement **paramétrées** (aucune concaténation → pas d'injection SQL possible).
  * Isolation stricte des données : chaque ligne de données est liée à `user_id` (clé étrangère, suppression en cascade).

### Lancer le backend

```bash
cd server
cp .env.example .env      # puis personnalisez les secrets JWT_ACCESS_SECRET / JWT_REFRESH_SECRET
npm install
npm run dev                # démarre l'API sur http://localhost:4000
```

> `better-sqlite3` et `argon2` contiennent des modules natifs compilés à l'installation : assurez-vous d'avoir un accès internet complet et les outils de build habituels (`python3`, `make`, `g++`) lors du premier `npm install`.

### Lancer le frontend

```bash
cp .env.example .env       # VITE_API_URL doit pointer vers l'URL du backend
npm install
npm run dev
```

### Notes de mise en production

* Servez le frontend et le backend sous le **même domaine** (ex. reverse-proxy Nginx sur `/api`) ou passez les cookies en `SameSite=None; Secure` avec HTTPS.
* Passez `COOKIE_SECURE=true` et `NODE_ENV=production` dès que le site est servi en HTTPS.
* Branchez un vrai fournisseur d'e-mail transactionnel (Resend, SendGrid, Postmark...) dans `server/src/routes/auth.js` (route `/forgot-password`) pour envoyer réellement le lien de réinitialisation — actuellement il est journalisé côté serveur (`console.log`) pour permettre les tests sans dépendance externe.
* Le stockage des données applicatives (tâches, événements, habitudes, catégories) utilise un document JSON versionné par utilisateur (`user_data`) plutôt que des tables relationnelles par entité : cela reproduit fidèlement le modèle de données existant côté client (Dexie) sans le dupliquer, tout en gardant une isolation stricte par utilisateur et une résolution de conflits simple par version.

---

## Lancer uniquement le frontend (nécessite tout de même le backend pour se connecter)

Depuis cette mise à jour, l'accès au planning nécessite un compte : le frontend seul ne suffit plus, le backend (`server/`) doit être démarré pour que les écrans de connexion/inscription fonctionnent. Voir la section précédente pour les deux commandes à lancer.

1.  **Naviguer dans le dossier du projet** :
    ```bash
    cd premium-planner-app
    ```
2.  **Installer les dépendances** :
    ```bash
    npm install
    ```
3.  **Lancer le serveur de développement** :
    ```bash
    npm run dev
    ```
4.  **Accéder à l'application** : Ouvrez votre navigateur sur l'adresse locale affichée dans le terminal (généralement `http://localhost:5173`).

---

## Structure du Code

```text
premium-planner-app/
├── public/              # Fichiers statiques, icône et PWA manifest
├── src/
│   ├── components/      # Composants UI partagés (Button, Card, Modal, Chip...)
│   ├── db/              # Configuration Dexie.js (schéma IndexedDB et seeder de démarrage)
│   ├── features/        # Fonctionnalités métier modulaires
│   │   ├── planning/    # Vues de planning (DayView, WeekView, MonthView, EventCard...)
│   │   ├── tasks/       # Gestion des tâches (TaskList, TaskItem, TaskModal...)
│   │   ├── stats/       # Graphique SVG (CircleChart) et Dashboard analytics
│   │   └── categories/  # Filtres et éditeur de catégories colorées
│   ├── hooks/           # Hooks React personnalisés (Haptic, Notifications)
│   ├── lib/             # Helpers utilitaires (cn, hexToRgba, isLightColor)
│   ├── store/           # Zustand stores (plannerStore et uiStore)
│   ├── types/           # Interfaces TypeScript strictes
│   ├── App.tsx          # Chef d'orchestre de l'application
│   ├── main.tsx         # Point d'entrée de l'application
│   └── index.css        # Styles généraux (Google Font, variables et utilitaires)
```
