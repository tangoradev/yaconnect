﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿# RAPPORT D’IMPLÉMENTATION — MODULE “PROJECTS” (PHASE 3)

## 1) Contexte & objectif

Le module **PROJECTS / Community Incubator** transforme des discussions du forum en **projets structurés**, suivis sur un cycle complet :

**idée → discussion → projet → validation → recommandation/promotion → archivage**

Objectifs clés :
- Détecter des idées à fort potentiel depuis le forum (réactions / commentaires).
- Permettre la création de projets structurés (wizard + médias).
- Mettre en place une validation communautaire (votes support/oppose + taux d’approbation).
- Assurer une intégration forte avec le moteur de gamification (score) et notifications.
- Réduire au minimum l’intervention admin grâce à l’automatisation (tâches planifiées + cache).

Référence pays : **Côte d’Ivoire** (régions déjà présentes côté plateforme).

## 2) Résumé des livrables

### Backend (FastAPI / PostgreSQL / SQLAlchemy)
- Modèles SQLAlchemy : projets, médias, commentaires, votes, historique de statuts.
- Migrations Alembic : création tables + enums + indexes + extension enum notifications + indexes FTS.
- Services métier : CRUD projets, vote/commentaire, conversion depuis post forum, transitions automatiques, scoring, notifications.
- Routes API : `/api/v1/projects/*` + routes admin `/api/v1/admin/projects/*`.
- Recherche : passage à PostgreSQL Full‑Text Search (topics / posts / projects).
- Cache & automatisation : intégration Redis optionnelle, endpoints top/trending + tâches Celery (daily/weekly).

### Frontend (React)
- Pages publiques : listing projets, détail projet, wizard multi‑étapes de soumission.
- Intégration forum : bouton “Convertir en projet” sur la page de détail d’un post.
- Back‑office admin : page “Projets” (liste, filtres, actions Recommander / Ambassadeur / Archiver).

## 3) Modèle de données (base)

### 3.1 Tables

Tables ajoutées :
- `projects`
- `project_media`
- `project_comments`
- `project_votes`
- `project_status_history`

### 3.2 Enums

Workflow statuts projet :
- `DRAFT`
- `IN_DISCUSSION`
- `COMMUNITY_VALIDATION`
- `RECOMMENDED`
- `AMBASSADOR_PROJECT`
- `ARCHIVED`

Types média :
- `image`, `document`, `video`

Votes :
- `support`, `oppose`

### 3.3 Indexation & performance

Index SQL appliqués pour scalabilité :
- Index FK : `project_id`, `region_id`, `created_by`
- Index fonctionnels / tri : `created_at`, `updated_at`, `status`
- Contrainte unicité votes : `(project_id, user_id)` pour garantir 1 vote/user/projet.

## 4) Règles métier & workflow automatisé

### 4.1 Création projet

Création via API : un utilisateur authentifié soumet un projet structuré.
- Statut par défaut : **IN_DISCUSSION** (ou DRAFT si enregistré en brouillon)
- Score (gamification) :
  - **Projet soumis** (non DRAFT) : +10

### 4.2 Validation communautaire

Chaque projet :
- reçoit des **votes** `support`/`oppose`
- expose :
  - `total_votes`
  - `support_votes`, `oppose_votes`
  - `approval_percentage` (support / total)

Transitions automatisées :
- `IN_DISCUSSION` → `COMMUNITY_VALIDATION` quand `total_votes >= 20`
- `IN_DISCUSSION` ou `COMMUNITY_VALIDATION` → `RECOMMENDED` quand :
  - `total_votes >= 30` ET `approval_percentage >= 70%`
- `RECOMMENDED` → `AMBASSADOR_PROJECT` via promotion hebdomadaire des meilleurs trending (automation)

### 4.3 Archivage

Archivage possible via :
- Admin (back‑office)
- Propriétaire (dans les règles autorisées côté service)

## 5) Intégration forum → projets

### 5.1 Conversion d’un post en projet

Endpoint dédié :
- `POST /api/v1/projects/convert-from-post/{post_id}`

Comportement :
- Pré‑remplit les champs :
  - `title` (post.title ou extrait du contenu)
  - `problem_statement` (contenu du post)
  - `objectives` (placeholder “à préciser avec la communauté”)
  - `region_id` : région du user convertisseur (fallback)
- Empêche la duplication : 1 post → 1 projet (via `source_post_id`)

### 5.2 Auto‑détection d’idées “high potential”

Tâche planifiée (daily) :
- calcule un score simple à partir des réactions/commentaires forum
- stocke une liste de `post_id` “à convertir” dans Redis (`forum:high_potential_posts`)

Endpoint de suggestions :
- `GET /api/v1/forum/suggestions/projects`

Retourne :
- l’extrait du post + score + indicateur “déjà converti” + `project_id` si existant.

## 6) Notifications (intégration extension forum)

Le module réutilise le système existant `ForumNotification` en ajoutant de nouveaux types :
- `PROJECT_VOTE`
- `PROJECT_COMMENT`
- `PROJECT_STATUS_CHANGE`
- `PROJECT_RECOMMENDED`
- `PROJECT_CONVERTED`

Notifications déclenchées automatiquement :
- Vote sur un projet → notif au propriétaire (si voteur != owner)
- Commentaire → notif au propriétaire (si commentateur != owner)
- Changement de statut / recommandation → notif au propriétaire
- Conversion d’un post → notif à l’auteur original du post (si convertisseur différent)

## 7) Recherche (PostgreSQL Full‑Text Search)

La recherche “forum” a été étendue pour inclure les **projects** avec un classement par pertinence.

Approche :
- `to_tsvector('french', ...)` + `plainto_tsquery('french', q)` + `ts_rank_cd`
- Index GIN sur :
  - `forum_topics` (title + description)
  - `forum_posts` (title + content)
  - `projects` (title + description + problem_statement + objectives + partners_needed)

Résultat unifié :
- types : `topic`, `post`, `project`
- champs : id, type, title, content, created_at, author_id, relevance

## 8) Cache Redis & endpoints “Top / Trending”

### 8.1 Redis côté API

Redis est initialisé en option au démarrage :
- si Redis indisponible : **fallback** sur calcul DB (pas d’échec API)

Clés principales :
- `projects:trending:ids`
- `projects:top:ids`
- `forum:high_potential_posts`

### 8.2 Endpoints

Projets :
- `GET /api/v1/projects/trending`
- `GET /api/v1/projects/top`

Les endpoints tentent de lire Redis, sinon recalculent en DB et réécrivent un cache court.

## 9) Celery (tâches planifiées)

Configuration :
- Broker/result backend via settings (Redis)
- Beat schedule : daily/weekly

Tâches :
- `update_trending_projects` (daily)
- `detect_high_potential_forum_posts` (daily)
- `weekly_project_promotion` (weekly)

Ces tâches minimisent l’intervention admin en :
- calculant la liste trending pour affichage rapide
- pré‑sélectionnant des idées du forum à convertir
- promouvant les meilleurs projets (ex : `RECOMMENDED` → `AMBASSADOR_PROJECT`)

## 10) API — routes principales

### 10.1 Public / Auth
- `GET /api/v1/projects/`
- `POST /api/v1/projects/`
- `GET /api/v1/projects/{id}`
- `PUT /api/v1/projects/{id}`
- `POST /api/v1/projects/{id}/vote`
- `POST /api/v1/projects/{id}/comment`
- `POST /api/v1/projects/{id}/media`
- `POST /api/v1/projects/convert-from-post/{post_id}`
- `GET /api/v1/projects/top`
- `GET /api/v1/projects/trending`

### 10.2 Admin
- `GET /api/v1/admin/projects`
- `PUT /api/v1/admin/projects/{project_id}/status`

## 11) Frontend — UX & parcours

### 11.1 Pages
- `/projects` : liste + filtres + sections “tendances/populaires” + suggestions d’idées du forum.
- `/projects/create` : wizard multi‑étapes (infos → impact → médias → validation).
- `/projects/{id}` : détail projet (problème, objectifs, médias, votes, commentaires, stats).

### 11.2 Composants clés
- `ProjectCard` : résumé projet + barre d’approbation
- `ProjectVote` : support/oppose + stats
- `ProjectComments` : fil dédié
- `ProjectStatusBadge` : badge workflow

### 11.3 Forum → Projet
Sur la page `/forum/post/:postId` :
- bouton “Convertir en projet” (utilisateur authentifié)
- redirection automatique vers `/projects/{id}` après conversion

## 12) Back‑office Admin UI — Projets

Page admin :
- `/admin/projects`

Fonctionnalités :
- liste projets (jusqu’à 100)
- recherche texte
- filtres : région / statut / tri
- actions rapides :
  - **Recommander** (statut `RECOMMENDED`)
  - **Promouvoir Ambassadeur** (statut `AMBASSADOR_PROJECT`)
  - **Archiver** (statut `ARCHIVED`)

## 13) Vérifications réalisées

- Migrations : base à jour sur head (Alembic).
- Build frontend : `npm run build` OK.
- Navigation UI : `/projects`, `/projects/:id`, `/projects/create`, `/admin/projects` OK.
- API : création projet + vote/commentaire + changement de statut admin vérifiés.

## 14) Points d’attention & améliorations recommandées

Pour une mise en production “150k users” :
- Ajouter pagination server‑side/virtualisation table admin si volume important.
- Ajouter un “audit log” admin dédié aux actions projets (qui a promu/archivé).
- Ajouter une politique de rate‑limit sur votes/commentaires (optionnel via Redis).
- Ajuster les seuils d’automatisation (votes/approval) par configuration “PlatformSettings”.
- Sécuriser upload documents (liste blanche mime, antivirus, stockage objet type S3).
