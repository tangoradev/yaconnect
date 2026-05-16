﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿# GUIDE UTILISATEUR — MODULE ÉVÉNEMENTS (GRIN17)

## 1) Objectif du module

Le module **Événements** permet de :
- découvrir les événements (par région),
- consulter une page événement immersive avec **bannière (hero)**,
- s’inscrire / annuler son inscription,
- (côté organisation) suivre les inscriptions, marquer les présences et attribuer les récompenses,
- créer un événement, avec possibilité d’ajouter une **bannière visuelle** (image).

## 2) Accès rapide (URLs)

Utilisateurs :
- Liste : `/events`
- Détail : `/events/{id}`
- Création : `/events/create` (connexion requise)

Admin :
- Gestion events : `/admin/events`
- Archives (inscriptions/présences/récompenses) : `/admin/events-archives`

## 3) Parcours utilisateur (grand public)

### 3.1 Consulter la liste des événements
1. Ouvrir le menu principal puis cliquer sur **Événements**.
2. La page affiche une grille de cartes (cards) avec :
   - une miniature de bannière (si disponible),
   - le titre,
   - la date,
   - le lieu,
   - le nombre d’inscrits.

**Filtrer par région**
- Utiliser le filtre **Région** pour afficher uniquement les événements d’une zone.

### 3.2 Ouvrir le détail d’un événement
1. Cliquer sur une carte événement.
2. Vous arrivez sur la page détail avec :
   - une section **hero** (bannière) en haut,
   - le titre, les dates, le lieu sur une superposition (overlay),
   - la description et les informations pratiques.

**Si aucune bannière n’a été ajoutée**
- Un fond dégradé par défaut s’affiche automatiquement.

### 3.3 S’inscrire à un événement
Conditions :
- vous devez être connecté,
- l’événement doit être **publié** (status PUBLISHED),
- s’il y a une capacité, il doit rester des places.

Étapes :
1. Sur la page détail, aller au bloc **Inscription**.
2. Cliquer sur **Je m’inscris**.
3. Le compteur d’inscrits est mis à jour.

### 3.4 Annuler son inscription
1. Sur la page détail, si vous êtes inscrit, cliquer sur **Annuler mon inscription**.
2. Votre statut d’inscription est changé en CANCELLED.

## 4) Création d’un événement (utilisateur connecté)

### 4.1 Créer un événement depuis la page Événements
1. Ouvrir `/events`.
2. Cliquer sur **Créer un événement**.
3. Remplir :
   - bannière (optionnelle),
   - titre,
   - description,
   - région,
   - lieu,
   - début / fin,
   - capacité (optionnelle),
   - statut (brouillon ou publié).
4. Cliquer sur **Créer**.

### 4.2 Ajouter une bannière (upload)
Sur la page de création :
- glisser‑déposer une image dans le cadre de bannière,
- ou cliquer sur “parcourir”.

Fonctions :
- **aperçu** immédiat (preview),
- **remplacer** l’image,
- **retirer** l’image.

Contraintes :
- formats : JPEG, PNG ou WebP,
- taille max : 10MB.

### 4.3 Créer un événement depuis un projet (pré-remplissage)
But : créer un événement “en contexte” d’un projet.

Étapes :
1. Ouvrir un projet (`/projects/{id}`).
2. Cliquer sur **Créer un événement**.
3. Vous arrivez sur `/events/create?project_id=...` :
   - le champ “Projet associé” est pré-rempli,
   - la région peut être pré-sélectionnée si elle est connue.
4. Compléter les champs manquants puis **Créer**.

## 5) Guide Admin — Gestion et opérations

### 5.1 Page Admin “Gestion des Événements”
Chemin : `/admin/events`

Objectifs :
- visualiser la liste des événements,
- vérifier l’état des bannières,
- uploader/changer la bannière,
- supprimer la bannière,
- ouvrir l’événement côté public.

**Uploader/Changer une bannière**
1. Trouver l’événement dans la liste.
2. Cliquer sur l’icône d’upload.
3. Choisir une image (JPEG/PNG/WebP).
4. La bannière est automatiquement :
   - redimensionnée (max 1600px),
   - convertie en WebP,
   - stockée côté serveur,
   - appliquée sur la page détail.

**Supprimer une bannière**
1. Cliquer sur l’icône poubelle.
2. Confirmer.
3. La page détail revient au fond dégradé par défaut.

### 5.2 Page Admin “Archives événements”
Chemin : `/admin/events-archives`

Objectifs :
- voir toutes les inscriptions d’un événement,
- filtrer par statut (REGISTERED / ATTENDED / CANCELLED),
- marquer la présence,
- attribuer la récompense (après présence).

**Marquer un participant “Présent”**
1. Sélectionner un événement.
2. Trouver l’utilisateur.
3. Cliquer sur **Présent**.
4. Le statut passe à **ATTENDED** et la date de présence est renseignée.

**Attribuer la récompense**
Pré-requis :
- le statut doit être **ATTENDED**.

Étapes :
1. Cliquer sur **Récompenser**.
2. La date de récompense est renseignée.

## 6) Questions fréquentes (FAQ)

**Pourquoi je ne peux pas m’inscrire ?**
- Vous n’êtes pas connecté, ou
- l’événement n’est pas publié, ou
- il n’y a plus de places (capacité atteinte).

**Pourquoi mon image est différente après upload ?**
- L’image est convertie en WebP pour performance et homogénéité.
- La largeur est limitée à 1600px pour réduire le poids.

**Une bannière peut-elle être malveillante ?**
- Non : le serveur valide le type MIME et l’image est réellement ouverte et ré-encodée (conversion WebP), ce qui neutralise les contenus non‑image.

## 7) Bonnes pratiques (Côte d’Ivoire)

- Utiliser des photos “localisées” (Abidjan, Yamoussoukro, Bouaké, etc.) pour améliorer le taux de clic.
- Préférer un texte court dans le visuel (la page overlay affiche déjà titre/date/lieu).
- Choisir une bannière contrastée : l’overlay améliore la lisibilité mais une image trop claire peut réduire l’impact.
