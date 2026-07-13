# VISION — Ma Cuisine · ma-cuisine-ui-fable-v2

*La refonte n°1 changeait l'apparence. Celle-ci change la manière d'utiliser l'app.*

## Le principe

L'app actuelle (et la refonte n°1) est organisée autour des **données** : un onglet = une table (stock, courses, alertes). Cette V2 est organisée autour des **décisions** d'une famille : *quoi manger, quoi racheter, quoi scanner, où chercher, quoi faire au magasin*. On ouvre l'app et on sait quoi faire.

## Différences structurelles avec la refonte n°1

| Axe | Refonte n°1 (skin) | V2 produit (cette version) |
|---|---|---|
| **Page d'accueil** | La liste du stock | **« Aujourd'hui »** : tableau de bord décisionnel (à faire maintenant, cette semaine, courses, cuisine, ajout rapide) |
| **Priorisation** | Liste groupée par fraîcheur | **Cartes de décision** : un produit urgent = une carte avec 3 issues en un toucher (Utiliser / Racheter / Fini) |
| **Lancer un scan** | Onglet « Ajouter » parmi 5 | **Bouton central surélevé** dans la tab bar → hub de scan (feuille) ; raccourcis aussi sur l'accueil |
| **Préparer les courses** | Formulaire 6 champs + liste plate | **Ajout en une ligne** (détails optionnels), **suggestions de rachat** (produits épuisés), liste **groupée par rayon** |
| **Décider quoi manger vite** | Onglet Alertes à penser à ouvrir | Les urgences **sont** l'accueil ; « Cette semaine » en un bloc ; vue complète « À surveiller » à un toucher |
| **Naviguer** | 5 onglets plats | **4 destinations + 1 geste** (Aujourd'hui · Cuisine · ⊕ Scanner · Courses · Réglages), tab bar translucide, vues plein écran qui glissent |
| **Actions urgentes** | Badge sur l'onglet Alertes | Badge sur « Aujourd'hui » + carrousel d'action en tête d'accueil + liseré orange sur les emplacements concernés |
| **Guider un non-technicien** | Libellés propres | **Une action principale par écran**, états vides qui disent quoi faire, fin de courses guidée (ticket → nettoyage de liste), invite d'installation iPhone |
| **Stock** | Liste filtrable | **Navigation spatiale** : 4 cartes d'emplacement (Frigo, Placard sous fenêtre, Plan de travail, Placard épices) → détail ; vue « Tous les produits » conservée avec recherche et filtres |
| **Mode magasin** | Liste + case « afficher cochés » | **Plein écran** : anneau de progression, rayons, « Dans le chariot » replié, fin guidée sans `window.confirm` |

## Ce qui ne bouge pas (volontairement)

- **Toute la logique métier** : hooks Supabase (produits, courses, sessions), temps réel, estimation des DLC, modes de consommation, doublons, rapprochement ticket ↔ liste.
- **Le pipeline photo Gemini 2.5 Flash Lite** : 1 appel, image complète + 6 recadrages, JSON strict validé par Zod. Le prompt contient déjà les garde-fous anti-hallucination (mentions marketing type « LAIT ORIGINE FRANCE » → `uncertain_items`), et l'UI séparait déjà *fiables / à vérifier / incertains* : conservé tel quel.
- **Le schéma SQL, les noms de colonnes, les variables d'environnement, les 4 emplacements officiels.**
- Les composants à risque (scanners, formulaires, modales) : réutilisés tels quels, encadrés par de nouvelles vues.
