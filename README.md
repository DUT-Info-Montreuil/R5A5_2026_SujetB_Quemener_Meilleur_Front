# 🏆 Gestion de tournois — Front-end

Interface web de gestion de tournois d'e-sport : consultation des tournois et de leur arbre, création et rejoin d'équipes, messagerie d'équipe, administration des tournois.
Projet réalisé dans le cadre du **BUT Informatique de Montreuil** (R5.A.05 — 2026, sujet B).

Ce dépôt contient uniquement le **front-end**. Il communique avec l'API du dépôt **Back-end** :
👉 <https://github.com/DUT-Info-Montreuil/R5A5_2026_SujetB_Quemener_Meilleur_Back>

Dépôt front : <https://github.com/DUT-Info-Montreuil/R5A5_2026_SujetB_Quemener_Meilleur_Front>

---

## 📚 Technologies utilisées

| Technologie | Version | Rôle |
|---|---|---|
| [React](https://react.dev/) | 19.3.0 | Bibliothèque d'interface |
| [React Router](https://reactrouter.com/) | 7.18.4 | Navigation entre les pages |
| [TypeScript](https://www.typescriptlang.org/) | 6.0.3 | Typage statique |
| [Vite](https://vite.dev/) | 8.3.5 | Serveur de développement et build |
| [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react) | 6.1.1 | Support React dans Vite |
| [ESLint](https://eslint.org/) + typescript-eslint | 10.10.0 / 8.70.0 | Analyse du code |
| [Node.js](https://nodejs.org/) | 20.19+ (testé en 22) | Environnement d'exécution |

> Versions réellement installées avec `npm ci` à partir du `package-lock.json`. Aucune bibliothèque d'interface ni de requêtes tierce : les appels HTTP utilisent `fetch` via un petit client maison (`src/api/client.ts`).

---

## 🗂️ Structure

```
front-tournois/
├── index.html
├── vite.config.ts
├── package.json
└── src/
    ├── main.tsx / App.tsx     # Point d'entrée et routes
    ├── api/                   # Client HTTP + un fichier par ressource (auth, tournois, équipes, matchs, messages, demandes, utilisateurs)
    ├── pages/                 # AuthPage, TournamentsPage, TournamentDetailPage, TeamPage, AdminPage
    ├── routes/                # TournoiDetailRoute, TeamRoute
    ├── components/            # Sidebar, BracketSection (arbre), ApiState, team/*
    └── hooks/                 # useAuth (session), Parseid
```

---

## ⚙️ Installation

### Prérequis
- **Node.js 20.19+ ou 22.12+** (npm est fourni avec)
- **Git**
- Le **back-end lancé** (voir son README) : sans lui, l'interface s'affiche mais aucune donnée n'est chargée.

### 1. Récupérer le projet
```bash
git clone https://github.com/DUT-Info-Montreuil/R5A5_2026_SujetB_Quemener_Meilleur_Front.git
cd R5A5_2026_SujetB_Quemener_Meilleur_Front/front-tournois
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. (Optionnel) Configurer l'adresse de l'API
Par défaut, le front appelle l'API sur `http://localhost:8000`, ce qui correspond au lancement par défaut du back-end : **aucune configuration n'est nécessaire en local**.

Pour utiliser une autre adresse, créez un fichier `.env` dans `front-tournois/` :
```env
VITE_API_BASE_URL=http://localhost:8000
# Afficher les logs d'appels API en console même en production (optionnel)
VITE_API_LOGS=true
```

---

## ▶️ Lancer l'application

Il faut démarrer **les deux** applications :

1. **Back-end** (dans son dépôt, depuis la racine) :
   ```bash
   PYTHONPATH=. python -m uvicorn launcher:app --app-dir backTournoi/main --reload
   ```
   → API sur <http://127.0.0.1:8000>
2. **Front-end** (dans `front-tournois/`) :
   ```bash
   npm run dev
   ```
   → Interface sur <http://localhost:5173>

> ⚠️ Le back-end n'autorise (CORS) que l'origine `http://localhost:5173`. Si Vite démarre sur un autre port (5173 déjà pris), les requêtes seront bloquées : fermez l'application qui occupe le port ou modifiez `allow_origins` dans `backTournoi/main/launcher.py`.

### Scripts disponibles

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement avec rechargement à chaud |
| `npm run build` | Vérification TypeScript puis build de production dans `dist/` |
| `npm run preview` | Prévisualise le build de production |
| `npm run lint` | Analyse du code avec ESLint |

---

## 🚀 Utiliser l'application

### Visiteur (sans compte)
- **Tournois** (`/tournois`) : liste des tournois.
- **Détail d'un tournoi** (`/tournois/:id`) : informations, équipes inscrites et arbre des matchs.
- **Détail d'une équipe** (`/equipes/:id`) : composition de l'équipe.

### Créer un compte et se connecter
1. Cliquez sur la connexion dans la barre latérale (`/connexion`).
2. **Créer un compte** : login (3 à 50 caractères), mot de passe (8 à 50 caractères) et confirmation du mot de passe.
3. Ou **se connecter** avec un compte existant.

La session est conservée dans le navigateur (jeton JWT valable 8 h) ; elle est fermée automatiquement à l'expiration du jeton.

### Joueur (compte non-administrateur)
- **Créer une équipe** dans un tournoi dont les inscriptions sont ouvertes (vous en devenez le capitaine).
- **Demander à rejoindre** une équipe ; le **capitaine** accepte ou refuse les demandes depuis la page de l'équipe.
- **Messagerie d'équipe** : échanger avec les membres de votre équipe.
- Un joueur ne peut être que dans **une équipe par tournoi**.

### Administrateur
Page **Administration** (`/admin`), visible uniquement pour les comptes admin :
- Créer un tournoi (nom, description, petite finale).
- Faire évoluer le statut : `OUVERT` → `FERME` (« Clore les inscriptions ») → `EN_COURS` (« Démarrer » : **génère l'arbre**) → `TERMINE`.
- Saisir les scores des matchs : le vainqueur avance automatiquement dans l'arbre.

Un compte administrateur par défaut est créé par le back-end (voir le README du back : `admin` / `admindefou`, à changer avant toute mise en production).

---

## 🔗 Lien avec le back-end

| Front (`src/api/`) | Routes de l'API appelées |
|---|---|
| `auth.ts` | `/auth/register`, `/auth/login`, `/auth/me` |
| `tournois.ts` | `/tournois/`, `/tournois/{id}`, `/tournois/{id}/arbre` |
| `equipes.ts` | `/equipes/`, `/equipes/{id}` |
| `matchs.ts` | `/matchs/`, `/matchs/{id}` |
| `demandesAdhesion.ts` | `/demandes/`, `/demandes/{id}/accepter`, `/demandes/{id}/refuser` |
| `messages.ts` | `/messages/` |
| `utilisateurs.ts` | `/utilisateurs/`, `/utilisateurs/{id}` |

Le jeton JWT est envoyé dans l'en-tête `Authorization: Bearer <jeton>` à chaque requête. En cas d'erreur « Impossible de joindre l'API », vérifiez que le back-end est démarré et que le front tourne bien sur le port 5173.

---

## 📄 Licence

Distribué sous licence **MIT** — voir le fichier [LICENSE](LICENSE).
