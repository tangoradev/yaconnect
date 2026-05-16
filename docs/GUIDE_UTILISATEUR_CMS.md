# Guide Utilisateur — Module CMS (YaConnect)

## 1. Objectif du module

Le module CMS permet de publier rapidement du contenu institutionnel :
- **Pages** (contenus statiques) : À propos, Mission, Contact, FAQ, Mentions légales, etc.
- **Articles / Actualités** : publications datées visibles sur la page Actualités.
- **Catégories & Tags** : organisation des articles.
- **Médias** : bibliothèque d’images (upload et réutilisation).
- **Révisions** : historique et restauration d’une version précédente.

## 2. Accès et rôles

### 2.1 Accès au back-office CMS

- URL : `/admin/cms`
- L’accès est réservé aux utilisateurs ayant un rôle **Admin** ou **SuperAdmin**.

### 2.2 Accès public

- Actualités :
  - Liste : `/news`
  - Détail : `/news/:slug`
- Pages :
  - `/p/:slug` (et alias `/page/:slug` si nécessaire)

## 3. Principes clés (règles de publication)

### 3.1 Visibilité publique

Un contenu (page ou article) est visible publiquement uniquement si :
- `status = PUBLISHED`
- et `published_at` est vide **ou** `published_at <= maintenant`

Si le contenu est en `DRAFT` (brouillon) ou planifié dans le futur, il n’est pas accessible publiquement.

### 3.2 Slug

- Le **slug** est une partie de l’URL (ex. `mon-article` dans `/news/mon-article`).
- Il est **unique**.
- Il peut être saisi manuellement (ou généré automatiquement si laissé vide).

### 3.3 SEO (référencement)

- **Meta title** : titre SEO (optionnel).
- **Meta description** : description SEO (optionnelle).

Si ces champs sont vides, l’application utilise le titre et/ou l’extrait quand c’est possible.

## 4. Démarrage (initialisation du CMS)

### 4.1 Initialiser le contenu par défaut

Sur `/admin/cms`, bouton **Initialiser** :
- Ajoute des catégories par défaut (si manquantes)
- Ajoute des tags par défaut (si manquants)
- Ajoute des pages par défaut (si manquantes)

Cette action est **idempotente** : tu peux la relancer sans risquer de dupliquer les mêmes slugs.

### 4.2 Vérifier côté public

Après initialisation :
- Les pages par défaut sont créées en **DRAFT** (non publiques tant que non publiées).
- Pour les rendre visibles : passer `status` à `PUBLISHED`.

## 5. Back-office CMS : navigation et écrans

Le back-office CMS est organisé par onglets :
- **Articles**
- **Pages**
- **Catégories**
- **Tags**
- **Médias**

Un panneau **Révisions** s’affiche à droite lorsque tu sélectionnes un article ou une page.

## 6. Articles (Actualités)

### 6.1 Créer un article

1. Aller dans l’onglet **Articles**
2. Cliquer sur **Nouveau**
3. Remplir les champs principaux :
   - **Titre** (obligatoire)
   - **Slug** (optionnel)
   - **Statut** : Brouillon / Publié / Archivé
   - **Date publication** (optionnel) : planification
   - **Catégorie** (optionnel)
   - **Tags** (optionnel)
   - **Image couverture** (upload)
   - **Extrait** (optionnel) : résumé affiché dans la liste
   - **Meta title / Meta description** (optionnels)
   - **Contenu** : texte principal
4. Cliquer sur **Sauver**

### 6.2 Publier immédiatement

Pour publier tout de suite :
- `Statut = PUBLISHED`
- `Date publication` vide (ou date passée)

Le contenu devient visible sur `/news` puis `/news/:slug`.

### 6.3 Planifier une publication

Pour publier plus tard :
- `Statut = PUBLISHED`
- `Date publication` dans le futur

Le contenu restera invisible publiquement jusqu’à la date choisie.

### 6.4 Mettre à jour / supprimer un article

- **Édition** : sélectionner un article dans la liste, modifier puis **Sauver**
- **Suppression** : sélectionner puis cliquer **Supprimer**

### 6.5 Image de couverture (upload)

Le champ **Image couverture** est un upload :
- Cliquer sur **Importer**
- Sélectionner une image (acceptation navigateur : `image/*`)
- L’image est envoyée au serveur et convertie en **WEBP**
- L’URL `/static/cms/...webp` est automatiquement assignée comme couverture

Actions utiles :
- **Retirer** : supprime la couverture (vide le champ)
- **Copier URL** : copie le chemin de l’image

### 6.6 Aperçu du contenu

Dans la section **Contenu**, le bouton **Aperçu** affiche un rendu texte pour contrôler rapidement le résultat.

## 7. Pages (contenu statique)

### 7.1 Créer une page

1. Aller dans l’onglet **Pages**
2. Cliquer sur **Nouveau**
3. Renseigner :
   - **Titre** (obligatoire)
   - **Slug** (optionnel)
   - **Statut**
   - **Date publication** (optionnel)
   - **Extrait** (optionnel)
   - **Meta title / Meta description** (optionnels)
   - **Contenu**
4. Cliquer sur **Sauver**

### 7.2 Accès public à une page

Une fois publiée, la page est accessible via :
- `/p/:slug` (principal)
- `/page/:slug` (alias)

Exemples :
- `/p/a-propos`
- `/p/mentions-legales`

### 7.3 Aperçu du contenu

Le bouton **Aperçu** permet une lecture rapide avant publication.

## 8. Catégories

### 8.1 Ajouter une catégorie

1. Onglet **Catégories**
2. Saisir un nom
3. Cliquer **Ajouter**

Le slug est généré automatiquement et garanti unique.

### 8.2 Supprimer une catégorie

Dans la liste des catégories : cliquer **Supprimer**.

## 9. Tags

### 9.1 Ajouter un tag

1. Onglet **Tags**
2. Saisir un nom
3. Cliquer **Ajouter**

### 9.2 Supprimer un tag

Dans la liste des tags : cliquer **Supprimer**.

## 10. Médias (bibliothèque)

### 10.1 Envoyer une image

1. Onglet **Médias**
2. Cliquer **Envoyer une image**
3. Choisir un fichier image

Après upload :
- l’image apparaît dans la grille
- elle est stockée dans `/static/cms/` côté serveur

### 10.2 Utiliser une image en couverture

Dans la grille médias :
- Cliquer **Couverture** sur une vignette pour renseigner la couverture de l’article en cours.

### 10.3 Copier l’URL d’un média

Dans la grille médias :
- Cliquer **Copier** pour copier le chemin (`/static/cms/...webp`)

## 11. Révisions (historique) et restauration

### 11.1 Comment les révisions sont créées

Une révision est créée automatiquement :
- à la création d’un article / d’une page
- et avant chaque modification sauvegardée

### 11.2 Consulter les révisions

1. Sélectionner un **article** ou une **page**
2. Dans la colonne **Révisions**, voir la liste datée

### 11.3 Restaurer une révision

1. Dans la liste des révisions, cliquer **Restaurer**
2. Le contenu revient à l’état de cette révision

## 12. Bonnes pratiques

- Utiliser des titres clairs et des slugs stables.
- Renseigner un **extrait** pour améliorer l’affichage de la liste Actualités.
- Utiliser une image de couverture ; le système convertit en WEBP et redimensionne si nécessaire.
- Utiliser `published_at` pour préparer des contenus à l’avance.

## 13. Dépannage

### 13.1 “Je ne vois pas mon article sur /news”

Vérifier :
- `status = PUBLISHED`
- `published_at` vide ou dans le passé

### 13.2 “J’ai une 404 sur /news/:slug”

Causes fréquentes :
- article en brouillon
- publication planifiée dans le futur
- slug modifié

### 13.3 Erreur réseau (connection refused)

Vérifier que l’API backend est démarrée et que `VITE_API_URL` pointe vers la bonne URL (ex. `http://127.0.0.1:8002/api/v1`).

## 14. Glossaire

- **CMS** : gestionnaire de contenu.
- **Slug** : identifiant URL lisible (ex. `a-propos`).
- **DRAFT** : brouillon, non public.
- **PUBLISHED** : publié (potentiellement public selon la date).
- **ARCHIVED** : archivé.
- **published_at** : date/heure de publication (planification).
- **Meta title / Meta description** : champs SEO.
