# YaConnect

Plateforme web communautaire pour connecter des citoyens, projets et initiatives : forum, projets, événements, gamification et CMS (actualités & pages).

## Fonctionnalités

- Authentification (JWT) + accès administrateur
- Forum (topics, posts, recherche, notifications)
- Projets (création, consultation, interactions)
- Événements (listing, détail, inscriptions, back-office)
- Gamification (scores, missions, classements)
- CMS (pages + articles + catégories/tags + médias + révisions)

## Stack technique

- **Frontend** : React + Vite + TailwindCSS + Axios + React Router
- **Backend** : FastAPI + SQLAlchemy + Alembic + PostgreSQL
- **Auth** : JWT
- **Médias** : upload image + conversion WEBP (Pillow)
- **Statique** : `/static` servi par FastAPI

## Structure du repo

- `frontend/` : application React (Vite)
- `backend/` : API FastAPI
- `docs/` : documents projet
- Docs à la racine : cahier des charges, rapports d’implémentation, guides, etc.

## Démarrage rapide (local)

### Pré-requis
- Node.js (version récente)
- Python 3.10+
- PostgreSQL

### 1) Backend (FastAPI)

```bash
cd backend
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1

pip install -r requirements.txt
```

Configurer la base de données (variables d’environnement selon ta config) puis lancer les migrations :

```bash
python -m alembic upgrade head
```

Démarrer l’API :

```bash
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8002
```

API (par défaut) : `http://127.0.0.1:8002/api/v1`

### 2) Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

Frontend : `http://localhost:5173`

## Variables d’environnement

### Frontend
- `VITE_API_URL` (optionnel) : URL de l’API, ex.
  - `http://127.0.0.1:8002/api/v1`

Par défaut, le frontend utilise :
- `http://127.0.0.1:8002/api/v1`

### Backend
Selon ta configuration FastAPI (fichier `settings`), tu auras typiquement :
- URL PostgreSQL
- Clé JWT / paramètres sécurité
- CORS origins

## CMS (module actualités & pages)

- **Public**
  - `/news` : liste des articles publiés
  - `/news/:slug` : détail d’un article
  - `/page/:slug` : page CMS

- **Admin**
  - `/admin/cms` : gestion pages, articles, catégories, tags, médias, révisions
  - Bouton **Initialiser** : crée des catégories/tags/pages de base (si vide)

## Scripts utiles

### Frontend
```bash
npm run dev
npm run lint
npm run build
npm run preview
```

### Backend
```bash
python -m alembic upgrade head
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8002
```

## Documentation

Voir notamment :
- `Cahier_de_Charges.md`
- `GUIDE_UTILISATEUR_FORUM.md`
- `IMPLEMENTATION_REPORT_*.md`

## Contribution

Les PR sont bienvenues :
- ouvrir une issue pour décrire le besoin/bug
- proposer une PR claire (petites unités, tests/validations quand possible)

## Licence

À définir.
