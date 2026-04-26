**Objectif du Module 2 (CMS léger & moderne)**  
Permettre au Bureau/Admin de publier rapidement du contenu institutionnel minimal (pages fixes + actualités), sans alourdir l’architecture, avec une UX d’édition moderne, du versioning simple, et une diffusion publique performante.

**1) Périmètre fonctionnel (MVP → complet)**

**1.1 MVP (indispensable)**

- Pages (statique gérée) : “À propos”, “Mission”, “Contact”, “FAQ”, “Mentions légales”.
- Actualités : liste + détail, brouillon/publication, date de publication.
- Catégories & tags pour actualités.
- Médias : upload image (cover + inline) avec optimisation WebP + stockage /static/cms/.
- SEO de base : title, meta_description, slug unique.
- Back‑office :
    - CRUD Pages
    - CRUD Articles
    - Gestion médias (upload + bibliothèque simple)
- Public :
    - /news et /news/:slug
    - /p/:slug (pages)

**1.2 Complet (niveau “moderne”)**

- Éditeur riche (blocks) ou Markdown + preview.
- Révisions (history) + “restaurer une version”.
- Planification : publication différée + expiration/archivage.
- Multi‑bannières (si tu veux relier au Module 5) : placement “Home hero”, “Sidebar”, etc.
- Recherche (PostgreSQL FTS) sur pages+articles.
- Analytics léger : vues par page/article (agrégé).
- Permissions :
    - Admin (full)
    - Éditeur (publier/éditer)
    - Auteur (éditer ses drafts)
- Workflow : Draft → Review → Published.

**2) Modèle de données (Backend / SQLAlchemy + Alembic)**

**2.1 Tables**

- cms_pages
    - id (uuid), slug (unique), title, content (JSON blocks ou markdown), excerpt, status (DRAFT/PUBLISHED), published_at, updated_at, created_by
    - SEO : meta_title, meta_description
- cms_posts (actualités)
    - champs similaires + cover_image_url, category_id, tags\[\] (via table pivot)
- cms_categories
- cms_tags
- cms_post_tags (pivot)
- cms_media
    - id, file_url, mime, width, height, size_bytes, created_by, created_at
- cms_revisions
    - id, entity_type (page/post), entity_id, snapshot (JSON), created_by, created_at

**2.2 Contraintes & index**

- slug index + unique.
- index sur status, published_at.
- FTS (option) via to_tsvector('french', title + content) + index GIN.

**3) API (FastAPI)**

**3.1 Routes publiques**

- GET /api/v1/cms/pages/{slug}
- GET /api/v1/cms/posts (filters: category, tag, q, skip/limit)
- GET /api/v1/cms/posts/{slug}
- GET /api/v1/cms/categories
- GET /api/v1/cms/tags

**3.2 Routes admin**

- POST/PUT/DELETE /api/v1/admin/cms/pages
- POST/PUT/DELETE /api/v1/admin/cms/posts
- POST /api/v1/admin/cms/media (multipart)
- GET /api/v1/admin/cms/media (bibliothèque)
- GET /api/v1/admin/cms/revisions?entity_type=...&entity_id=...
- POST /api/v1/admin/cms/revisions/{revision_id}/restore

**3.3 Règles métier**

- Un contenu ne devient public que si status=PUBLISHED et published_at <= now.
- Slug généré automatiquement (titre → slug), éditable mais unique.
- À chaque publication (ou save), écrire une révision (selon stratégie).

**4) Frontend (React) — UX moderne**

**4.1 Pages publiques**

- /news : listing + filtres + pagination
- /news/:slug : article + cover + share
- /p/:slug : page CMS (About/FAQ/…)
- Intégration nav/footer : liens dynamiques vers pages publiées (option “pinned”).

**4.2 Admin CMS**

- /admin/cms/pages : liste + statut + actions
- /admin/cms/pages/:id/edit : éditeur + preview + publish
- /admin/cms/posts / /admin/cms/posts/:id/edit
- /admin/cms/media : grille + upload + copier URL

**\*\*4.3 Éditeur**

- Option A (simple/robuste) : Markdown + preview (rapide à livrer).
- Option B (moderne) : éditeur block (type “Notion-like”) mais plus coûteux (lib à valider dans le repo).

**5) Sécurité & permissions**

- Réutiliser le garde‑fou admin existant (dépendances get_current_admin).
- Ajouter rôles “Editor/Author” si souhaité (sinon tout admin).
- Upload média : whitelist MIME, limite taille, Pillow validate + conversion WebP, stockage isolé backend/static/cms/.

**6) Migration / contenu initial**

- Migrations Alembic : création tables CMS.
- Seed minimal :
    - Pages : about, contact, faq (draft)
    - Catégories : “Communiqués”, “Événements”, “Opportunités”
- Un bouton admin optionnel “Initialiser CMS” (comme pour gamification presets).

**7) Vérification (qualité)**

- Tests API (httpx) :
    - publier une page → accessible public
    - draft → 404 public
    - upload média → URL servie via /static
- Vérifs UI :
    - éditer → preview → publish → affichage public
- Lint/build :
    - npm run build (frontend)
    - (backend) lancer l’app + smoke test endpoints

**8) Ordre d’implémentation recommandé**

1.  Backend : modèles + migrations + schémas Pydantic
2.  Backend : routes publiques + admin + upload média
3.  Frontend public : pages /news + /p/:slug
4.  Frontend admin : CRUD + éditeur + media library
5.  Révisions + restore
6.  Planification publication + recherche FTS (option)

Si tu veux, je peux enchaîner directement en l’implémentant dans le repo (backend + frontend + migrations) selon l’option éditeur **Markdown** (le meilleur ratio “léger & moderne” dans ton codebase actuel).