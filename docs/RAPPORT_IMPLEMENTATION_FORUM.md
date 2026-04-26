# RAPPORT D’IMPLÉMENTATION — MODULE FORUM (PHASE 2) — YACONNECT

**Projet :** YACONNECT — Plateforme communautaire nationale (Côte d’Ivoire)  
**Module :** Forum communautaire (Phase 2)  
**Objectif :** Faire du forum un moteur d’engagement autonome (leader detection, discussions, rankings, réduction charge admin)  
**Date :** 28/03/2026  
**Statut :** Implémentation livrée (MVP avancé) + améliorations UI/UX + upload d’images + notifications/badges (base)  

---

## 1) Résumé Exécutif

La Phase 2 a renforcé le forum existant pour en faire un espace d’échanges structuré et gamifié, avec :

- des thématiques alignées sur les **Centres d’intérêts** (ex. Biodiversité),
- un **système de points** et de **niveaux**,
- des **réactions qualifiées** (au-delà du “Like”),
- des **notifications** (réponses, réactions, mentions, badges/niveaux),
- un **classement** (leaderboard) et une vue “tendances”,
- une **barre de recherche** (version simple),
- un **upload d’images** (optimisation et stockage en WebP).

Certaines exigences “production-grade” (ex. full-text search PostgreSQL tsvector, Celery/Redis schedules, cache Redis, spam detection avancée) restent à finaliser pour atteindre le niveau “150k users + forte autonomie” sans compromis.

---

## 2) Stack Technique & Architecture

### Backend
- **FastAPI**, **SQLAlchemy**, **PostgreSQL**, **Alembic**
- **JWT Auth** + contrôle d’accès (RBAC)
- Endpoints structurés par routeurs (forum, auth, users, intérêts, admin, extensions forum)
- Exposition de fichiers statiques (images) via `/static`

### Frontend
- **React** + **TailwindCSS**
- Layout forum en 3 colonnes (thèmes / fil / panneaux)
- Routage dédié (`/forum`, `/forum/post/:id`, `/forum/search`, `/forum/notifications`, `/forum/leaderboard`)

---

## 3) Modèle de Données (Base de données)

### Entités Forum (existantes)
- `ForumTopic` : thématiques de discussion
- `ForumPost` : discussions
- `ForumComment` : commentaires
- `ForumReaction` : réactions qualifiées (Pertinent, Innovant, Impact environnemental, Solidaire, Inspirant)
- `ForumReport` : signalements (auto-modération)

### Entités ajoutées (Phase 2 — extension)
- `forum_notifications` : notifications (type, référence, message, read/unread)
- `forum_badges` : badges (nom, description, icône, points requis)
- `user_badges` : association utilisateur-badge
- `forum_trending_cache` : table dédiée au cache de tendance (préparée)

### Indexation / Performance (état)
- Index de base via PK/FK + champs existants
- À compléter : index ciblés sur `post_id`, `topic_id`, `user_id`, `created_at` (selon volumétrie réelle) + tsvector pour recherche

---

## 4) API — Capacités Fonctionnelles

### 4.1 Thématiques (Topics) alignées sur les Centres d’Intérêts
- Les thématiques du forum sont synchronisées avec les “Intérêts” de la plateforme.
- À l’affichage, si un intérêt n’a pas encore son topic, il est créé automatiquement.

### 4.2 Discussions (Posts)
- Création de post par utilisateur connecté (JWT)
- Listing : fil global + filtrage par topic
- Détail : consultation du post + commentaires
- Support média : upload image (optimisé) ou lien

### 4.3 Commentaires (Comments)
- Création et listing par post
- Mentions `@username` : parsing côté backend et notification (version actuelle basée sur correspondance simple)

### 4.4 Réactions (Reactions)
- Réaction qualifiée (toggle)
- Attribution de points au créateur du post (pas à l’auteur de la réaction)
- Notification au créateur du post sur nouvelle réaction

### 4.5 Modération communautaire (Reports)
- Signalement post
- Auto-masquage au-delà d’un seuil (ex. 5 signalements)

### 4.6 Notifications
- Consultation des notifications utilisateur (`GET /notifications`)
- Marquage “lu” (`POST /notifications/{id}/read`)
- Marquage “tout lu” (`POST /notifications/read-all`)
- Compteur non-lues (`GET /notifications/count`)

### 4.7 Badges / Gamification
- Attribution automatique de badges selon règles (premier post, seuil points, ambassadeur)
- Endpoint utilisateur : `GET /forum/badges/me`
- Endpoint admin : initialisation badges (`POST /admin/forum/init-badges`)

### 4.8 Leaderboard
- Endpoint : `GET /forum/leaderboard`
- Classement basé principalement sur le score utilisateur (enrichi par nombre de badges côté réponse)

### 4.9 Recherche
- Endpoint : `GET /forum/search?q=...`
- Implémentation actuelle : recherche basique (`ILIKE`) sur topics et posts
- À finaliser : PostgreSQL Full-Text Search (tsvector/tsquery), index GIN, ranking

---

## 5) Gamification — Règles de Score & Niveaux

### Points (implémentés)
- Création post : **+5**
- Création commentaire : **+3**
- Réactions reçues : **+2 à +6** selon type (ex. Impact environnemental = +6)

### Niveaux (implémentés)
- Explorateur → Acteur → Leader → Ambassadeur (seuils configurés dans le backend)
- Notification automatique lors d’un passage de niveau

### Ambassadeur (implémenté — version simple)
- Calcul “top 3%” basé principalement sur le score
- Badge “Ambassador” attribué automatiquement
- À finaliser : critères additionnels “activité régulière” + “absence flags modération” + fenêtre temporelle

---

## 6) Upload d’Images — Contraintes & Optimisation

### Frontend
- Remplacement du champ “lien uniquement” par un upload (sélecteur fichier + prévisualisation)
- Contrôle taille : **max 10 Mo**
- Acceptation formats : `image/*` (JPEG, PNG, GIF, WebP, etc.)

### Backend
- Endpoint post accepte `multipart/form-data`
- Validation type : uniquement images
- Traitement : redimensionnement (max 1200×1200) + conversion **WebP** (qualité 80)
- Stockage : `static/images` et exposition via `/static/images/...`

---

## 7) Frontend — Parcours Utilisateur & UI/UX

### Composants ajoutés / améliorés
- SearchBar : recherche forum
- NotificationBell : compteur notifications non lues (polling)
- BadgeDisplay : affichage badges utilisateur
- CreatePostModal : création discussion (thème, titre, message, image upload)

### Pages ajoutées
- `/forum/search`
- `/forum/leaderboard`
- `/forum/notifications`

### Expérience “temps réel”
- Polling pour compteur notifications
- À finaliser : polling ciblé sur commentaires/réactions (ou WebSocket)

---

## 8) Sécurité, CORS & Déploiement Local

### CORS
- Les origines frontend Vite (5173, 5174) sont autorisées côté backend.

### Auth
- Les endpoints de création (post/comment/réaction/notifications) nécessitent un utilisateur connecté.

---

## 9) Tests & Vérifications (manuel)

Scénarios validés en environnement local :
- affichage forum + filtrage par thème
- création d’une discussion (avec ou sans image)
- affichage image servie depuis `/static`
- réactions + notifications + compteur non-lu
- recherche (basique) + pages UI dédiées

À compléter :
- tests automatisés API (pytest) sur routes critiques
- tests de charge (leaderboard, feed, search)
- validation sécurité upload (scan mime/extension, protection contre images malformées)

---

## 10) Écarts Restants vs Exigences “Production-Ready”

### À finaliser (priorité haute)
- Recherche PostgreSQL Full-Text Search (topics/posts/comments) + index GIN + ranking
- Jobs planifiés : **Celery + Redis** (daily trending/leaderboard; weekly ambassadors/reset)
- Cache Redis (trending, leaderboard, top contributors)
- Modération avancée : détection spam, filtrage mots-clés, restrictions temporaires récidivistes
- Dashboard modération admin (vue reports, actions, sanctions)

### À optimiser
- Index DB selon métriques et requêtes réelles
- Pagination robuste (feed, commentaires, recherche, notifications)
- Observabilité : logs structurés, métriques, traces (Sentry/Prometheus)

---

## 11) Conclusion

La Phase 2 du module Forum est livrée avec des fondations solides : engagement (réactions + gamification), notifications, création de discussions avec upload d’images optimisées, pages dédiées (recherche, notifications, leaderboard) et alignement des thématiques sur les centres d’intérêts.

Pour atteindre un niveau “production-ready 150k utilisateurs” avec réduction maximale de charge admin, la prochaine itération doit prioriser : full-text search PostgreSQL, jobs Celery/Redis, cache Redis et modération avancée.
