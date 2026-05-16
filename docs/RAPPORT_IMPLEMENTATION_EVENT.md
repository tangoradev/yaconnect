﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿# RAPPORT D’IMPLÉMENTATION — MODULE ÉVÉNEMENTS (PHASE 5)

## 1) Contexte & objectif

Le **Module Événements (Phase 5)** fournit un cycle de vie complet :

**projet → événement → inscription → présence → récompense**

Objectifs principaux :
- proposer une expérience visuelle “premium” via une **bannière (hero)** sur la page événement,
- supporter la création/édition d’événements associés à des projets et des régions,
- gérer les inscriptions et la capacité,
- permettre la validation des présences et l’attribution de la récompense depuis l’admin,
- ajouter un système d’upload d’images sécurisé avec transformation côté serveur.

Pays de référence : **Côte d’Ivoire**.

## 2) Architecture — vue d’ensemble

### 2.1 Backend
Briques principales :
- **Models** : `Event`, `EventRegistration` + enums de statut
- **Service** : `event_service` (CRUD, register/cancel, attendance, reward, archives)
- **Routers**
  - Public : `/api/v1/events`
  - Admin : `/api/v1/admin/events` + endpoints d’archives/attendance/reward
- **Upload bannière** : endpoint multipart + traitement image (resize → WebP) + stockage local `/static/events/`

### 2.2 Frontend
Pages :
- `/events` : listing avec cards et thumbnails
- `/events/:eventId` : détail avec **hero banner full-width** + overlay
- `/events/create` : création avec **drag & drop**, preview, remplacer

Admin :
- `/admin/events` : liste + upload/suppression de bannière
- `/admin/events-archives` : inscriptions, présences et récompenses

## 3) Schéma de données (DB)

### 3.1 Table `events`
Champs :
- `id` (uuid)
- `title`
- `description`
- `project_id` (uuid, nullable)
- `region_id` (int, nullable)
- `location`
- `start_date`
- `end_date`
- `capacity` (int, nullable)
- `banner_url` (string, nullable) **(nouveau champ)**
- `created_by` (uuid)
- `status` (enum: DRAFT, PUBLISHED, COMPLETED, CANCELLED)
- `created_at`
- `updated_at`

### 3.2 Table `event_registrations`
Champs :
- `id` (uuid)
- `event_id` (uuid)
- `user_id` (uuid)
- `status` (enum: REGISTERED, CANCELLED, ATTENDED)
- `registered_at`
- `attended_at` (nullable)
- `reward_granted_at` (nullable)

Contraintes :
- unique `(event_id, user_id)` pour éviter les doublons d’inscription.

### 3.3 Migrations
- Création tables + enums : [f1e2d3c4b5a6_add_events_module_phase5.py](file:///d:/yaconnect/backend/app/migrations/versions/f1e2d3c4b5a6_add_events_module_phase5.py)

## 4) API — endpoints publics

Router : [events.py](file:///d:/yaconnect/backend/app/routers/events.py)

- `GET /api/v1/events` : liste (filtres: `region_id`, `status`, pagination `skip/limit`)
- `POST /api/v1/events` : création (auth requise)
- `GET /api/v1/events/{event_id}` : détail (inclut `registrations_count`, `remaining_capacity`)
- `PUT /api/v1/events/{event_id}` : update (créateur ou admin)

Inscription :
- `POST /api/v1/events/{event_id}/register`
- `POST /api/v1/events/{event_id}/cancel`
- `GET /api/v1/events/{event_id}/registration` : “mon inscription”

Bannières :
- `POST /api/v1/events/{event_id}/upload-banner` : upload multipart
- `DELETE /api/v1/events/{event_id}/banner` : suppression

## 5) API — endpoints admin (archives/présence/récompense)

Router : [admin_events.py](file:///d:/yaconnect/backend/app/routers/admin_events.py)

- `GET /api/v1/admin/events` : liste admin
- `POST /api/v1/admin/events` : création admin
- `PUT /api/v1/admin/events/{event_id}` : édition admin
- `POST /api/v1/admin/events/{event_id}/attendance/{user_id}` : marque présence
- `GET /api/v1/admin/events/{event_id}/registrations` : liste inscriptions (inclut infos user)
- `POST /api/v1/admin/events/{event_id}/reward/{user_id}` : marque récompense (après présence)

Schémas :
- Event : [event.py](file:///d:/yaconnect/backend/app/schemas/event.py)

## 6) Upload banner — sécurité, traitement & stockage

### 6.1 Contraintes
- Formats acceptés : JPEG, PNG, WebP (validation MIME + validation via Pillow)
- Taille max : 10 MB

### 6.2 Traitement backend
- lecture en mémoire du fichier uploadé
- chargement via Pillow
- resize si largeur > 1600px (ratio conservé)
- conversion en WebP qualité 80

### 6.3 Stockage
- chemin : `backend/static/events/{event_id}.webp`
- URL persistée : `/static/events/{event_id}.webp`
- `StaticFiles` sert `/static` depuis le dossier `backend/static`

Dépendance :
- ajout Pillow : [requirements.txt](file:///d:/yaconnect/backend/requirements.txt)

## 7) UX/UI — hero banner & performance

### 7.1 Hero banner (page détail)
- full width + responsive
- overlay gradient (lisibilité)
- typographie large (titre)
- indicateurs (date, location) avec icônes

Composant :
- [EventBanner.jsx](file:///d:/yaconnect/frontend/src/components/events/EventBanner.jsx)

Fallback :
- si pas de `banner_url`, fond gradient par défaut.

### 7.2 Cards événements
- thumbnail bannière (lazy loading)
- fallback gradient si absente

Composant :
- [EventCard.jsx](file:///d:/yaconnect/frontend/src/components/events/EventCard.jsx)

### 7.3 Création événement (bannière)
- drag & drop, preview, remplacer/retirer
- validation côté UI (mime/size)

Composant :
- [BannerUploader.jsx](file:///d:/yaconnect/frontend/src/components/events/BannerUploader.jsx)

## 8) Admin panel — opérations bannières & archives

### 8.1 Gestion bannières
Page :
- [EventsAdmin.jsx](file:///d:/yaconnect/frontend/src/pages/admin/EventsAdmin.jsx)

Fonctions :
- upload/change bannière (multipart vers endpoint public, autorisé admin)
- suppression bannière
- lien vers la page publique de l’événement

### 8.2 Archives événements (inscriptions/présences)
Page :
- [EventsArchivesAdmin.jsx](file:///d:/yaconnect/frontend/src/pages/admin/EventsArchivesAdmin.jsx)

Fonctions :
- sélection d’un événement
- filtrage par statut REGISTERED / ATTENDED / CANCELLED
- action “Présent” (attendance)
- action “Récompenser” (reward)

## 9) Création d’événement depuis un projet

Objectif :
- favoriser l’adoption en créant rapidement un événement lié à un projet.

Implémentation :
- lien “Créer un événement” sur la page projet → `/events/create?project_id=...`
  - [ProjectDetail.jsx](file:///d:/yaconnect/frontend/src/components/projects/ProjectDetail.jsx)
- formulaire event lit `project_id`, pré-remplit `project_id` et `region_id` (si dispo)
  - [EventCreate.jsx](file:///d:/yaconnect/frontend/src/pages/events/EventCreate.jsx)

## 10) Intégration scoring

Conformément aux exigences : **pas de changement dans la logique de scoring**.

Le module déclenche des actions “neutres” (force points à 0) pour tracer :
- `EVENT_CREATE`
- `EVENT_REGISTER`
- `EVENT_CANCEL`
- `EVENT_ATTEND`
- `EVENT_REWARD_GRANTED`

## 11) Vérifications effectuées

- migrations Alembic appliquées (events + registrations)
- endpoints testés : create/list/register/cancel/upload/delete banner
- endpoints admin testés : registrations/attendance/reward
- build frontend OK (`npm run build`)

## 12) Améliorations futures

- ajout d’un QR code “check-in” sécurisé (token + scan) pour auto-attendance
- export CSV des inscriptions/presences pour reporting
- stockage bannières sur objet storage (S3/MinIO) si besoin d’élasticité
- politique de cache CDN pour `/static/events/*`
