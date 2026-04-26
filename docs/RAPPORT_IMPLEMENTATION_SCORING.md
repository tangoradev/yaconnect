﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿# RAPPORT D’IMPLÉMENTATION — SCORING AVANCÉ & GAMIFICATION (PHASE 4)

## 1) Contexte & objectif

La **PHASE 4 — Scoring avancé & Gamification** introduit une couche d’intelligence unifiée pour :
- tracer toutes les actions utilisateurs,
- appliquer des règles de scoring configurables en base,
- gérer des multipliers dynamiques,
- attribuer automatiquement niveaux et badges,
- produire des leaderboards performants et cacheables,
- détecter automatiquement les ambassadeurs,
- automatiser les routines (daily/weekly) via Celery,
- fournir des écrans et un back‑office de pilotage.

Référence pays : **Côte d’Ivoire**.

## 2) Architecture — vue d’ensemble

### 2.1 Principes
- **Centralisation** : toutes les attributions de points passent par un moteur unique (`ScoreEngine`).
- **Configuration en base** : les règles ne sont pas hardcodées, elles sont persistées et modifiables.
- **Traçabilité** : toutes les actions scorées sont journalisées (`user_activity_log`).
- **Automatisation** : tâches Celery planifiées (daily/weekly) pour recalculs, sélection, archivage.
- **Performance** : cache Redis + cache DB (`leaderboard_cache`) + archivage hebdo (`leaderboard_archive`).

### 2.2 Modules backend principaux
- `ScoreEngine` : application des règles, multipliers, logs, niveaux, badges, missions, notifications.
- `leaderboard_service` : génération des classements (contributors/innovators/regions/projects).
- `ambassador_service` : détection avancée des ambassadeurs.
- `admin_gamification` : endpoints back‑office (règles, niveaux, missions, règles badges, presets, actions).
- Celery tasks : daily update leaderboards, weekly ambassadors, weekly reset strict.

## 3) Nouveau schéma de données (Phase 4)

### 3.1 Tables

**(A) user_activity_log**  
Journalise chaque action scorée.
- `user_id`
- `action_type` (clé de règle)
- `reference_id` (ex: postId, projectId)
- `points` (résultat final après multipliers)
- `metadata` (JSON)
- `created_at`

**(B) user_scores_history**  
Historique du score/level dans le temps (pour graphiques et audit).
- `user_id`
- `score`
- `level`
- `created_at`

**(C) gamification_rules**  
Règles configurables.
- `action_type` (unique)
- `points`
- `multiplier`
- `is_active`
- `metadata` (JSON) pour paramétrage des multipliers/modes

**(D) gamification_levels**  
Niveaux dynamiques en DB.
- `name` (Explorer, Actor, Leader, Ambassador)
- `min_score` (seuil)
- `sort_order`
- `is_active`

**(E) gamification_badge_rules**  
Règles d’attribution des badges (configurable).
- `badge_id` (référence `forum_badges`)
- `rule_type` (ex: FIRST_ACTION, SCORE_THRESHOLD, ON_ACTION, LEVEL_REACHED, WEEKLY_TOP)
- `action_type` (optionnel)
- `threshold` (optionnel)
- `metadata` (JSON)
- `is_active`

**(F) leaderboard_cache**  
Cache DB des leaderboards générés (avec `data` JSON).

**(G) leaderboard_archive**  
Archivage hebdomadaire strict des classements (historique).
- `type` (contributors/innovators/regions/projects)
- `period` (weekly)
- `week_start`, `week_end`
- `data` (JSON)

**(H) gamification_missions** & **user_mission_progress**  
Missions (objectifs) et progression par user.
- requirements JSON (`actions: [{action_type, count}]`)
- reward_points
- completion + claim

### 3.2 Migrations
- Création engine + tables gamification : `c1a2b3c4d5e6`
- Badges/règles par défaut : `d4e5f6a7b8c9`
- Archive hebdo : `e7f8a9b0c1d2`

## 4) ScoreEngine — moteur de scoring unifié

### 4.1 Responsabilités
`ScoreEngine.record_action(...)` :
- charge la règle DB (`gamification_rules`) via `action_type`,
- calcule les points finaux (points * multiplier règle * multiplier dynamique),
- met à jour `User.score`,
- calcule le level via `gamification_levels`,
- écrit dans `user_activity_log`,
- écrit un point dans `user_scores_history`,
- déclenche badges automatiques via `gamification_badge_rules`,
- met à jour la progression des missions et attribue le bonus,
- génère des notifications (level up, badge).

### 4.2 Multipliers dynamiques
Multipliers implémentés (config dans `gamification_rules.metadata`) :
- **New user boost** : multiplicateur pour les comptes récents (ex: 7 jours).
- **Region activity boost** : bonus pour les régions “top” (selon leaderboard regions).
- **Weekly challenge bonus** : bonus si missions actives.

## 5) Règles de scoring — configuration DB

Exemples de règles seedées (Côte d’Ivoire) :
- `FORUM_POST_CREATE` : +5
- `FORUM_COMMENT_CREATE` : +3
- `FORUM_REACTION_RECEIVED_*` : +2 à +6 selon type
- `PROJECT_SUBMIT` : +10
- `PROJECT_RECOMMENDED` : +25
- `PROJECT_VOTE_CAST` : +1
- `PROJECT_COMMENT_CREATE` : +2
- `MISSION_COMPLETED` : +bonus (points portés par la mission)

Toutes ces règles sont éditables depuis l’admin.

## 6) Badges — moteur automatique (configurable)

### 6.1 Types de règles gérées
- **FIRST_ACTION** : 1ère occurrence d’une action (ex: 1er post).
- **SCORE_THRESHOLD** : seuil de score (ex: 100 points).
- **ON_ACTION** : badge au déclenchement d’une action (ex: projet recommandé).
- **LEVEL_REACHED** : badge quand un niveau est atteint.
- **WEEKLY_TOP** : badge attribué au top du leaderboard hebdo (reset strict).

### 6.2 Badges seedés
- First Post
- First 100 Points
- Project Recommended
- Ambassador
- Top Contributor Weekly

## 7) Détection avancée des ambassadeurs

Service dédié :
- sélection “top 3%” (sur base `User.score`)
- **activité consistante** sur 90 jours (>= 45 jours distincts d’activité)
- **aucun flag modération** (`ForumReport ACTION_TAKEN` sur 90 jours)
- **pas de posts masqués** sur 90 jours
- **contribution projets** (au moins 1 action `PROJECT_%`)

Actions réalisées :
- promotion du `community_level` à `Ambassador`
- attribution du badge “Ambassador”
- notification
- log `AMBASSADOR_ASSIGNED` dans `user_activity_log`

## 8) Leaderboards — génération, cache, API

### 8.1 Types de classements
- Top contributors : points agrégés sur période (weekly/90 days).
- Top innovators : points + volume d’actions liées aux projets.
- Top regions : agrégation par `User.region_id`.
- Top projects : calcul de score agrégé votes/commentaires (weekly).

### 8.2 Cache
- Cache DB : `leaderboard_cache`
- Cache Redis : clés `leaderboard:{type}:{period}:{limit}`

### 8.3 API
- `GET /api/v1/leaderboards`
  - params: `type`, `period`, `limit`
  - réponse : `type`, `period`, `updated_at`, `items[]`

## 9) Weekly reset strict — archives + badge hebdo

Activation via règle :
- `WEEKLY_RESET_STRICT` avec `metadata.enabled=true`

Tâche Celery :
- archive la semaine terminée (`leaderboard_archive`)
- purge cache hebdo (DB + Redis)
- attribue le badge “Top Contributor Weekly” au top 1 (configurable `rank_max`)

## 10) Automations Celery (Phase 4)

Daily :
- refresh leaderboards (cache DB + Redis)

Weekly :
- sélection ambassadeurs
- weekly reset strict (archives + badge hebdo)

## 11) Back‑office Admin Gamification

Page : `/admin/gamification`

Fonctions :
- éditer règles points/multipliers
- éditer niveaux (seuils)
- créer/éditer missions
- éditer règles badges
- boutons :
  - reset presets CI (seed complet)
  - refresh leaderboards
  - détecter ambassadeurs

## 12) Frontend — nouvelles pages & composants

### 12.1 Pages
- `/dashboard/gamification` : score, niveau, progression, badges, missions, activité, charts.
- `/leaderboards` : charts + tables top users/regions/projects.

### 12.2 Composants
- ScoreDisplay
- LevelProgress
- BadgeGrid
- LeaderboardChart
- ActivityTimeline

## 13) Vérifications effectuées

- `alembic upgrade head` OK (migrations Phase 4 + archive).
- build frontend `npm run build` OK.
- endpoint admin reset presets CI fonctionnel.
- tâche `weekly_reset_strict()` exécutable et archive `leaderboard_archive` alimentée.

## 14) Points d’attention & améliorations futures

- Ajouter un écran “archives hebdo” dans l’admin (exploration `leaderboard_archive`).
- Ajouter une configuration avancée des missions (fenêtre hebdo, catégories, objectifs progressifs).
- Renforcer la “rank change notification” (diff rang N vs N‑1 sur archive).
- Optimiser les agrégations très volumineuses (mat views, partitions sur `user_activity_log` si besoin).
