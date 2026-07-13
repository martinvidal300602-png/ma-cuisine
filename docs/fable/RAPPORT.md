# RAPPORT — ma-cuisine-ui-fable-v2

*V2 produit construite le 12 juin 2026. Build : ✓ `npm run build` passe sans erreur.*

## Résumé

Refonte **structurelle** de l'expérience, à logique métier constante : l'app s'organise désormais autour des décisions du quotidien (accueil « Aujourd'hui »), le scan devient le geste central (bouton surélevé), le stock se parcourt par emplacement comme la vraie cuisine, et les courses se déroulent en deux temps clairs (préparation par rayon → mode magasin plein écran avec fin guidée). Voir `VISION.md` pour le détail des différences avec la refonte n°1.

## Dossier créé

`ma-cuisine-ui-fable-v2/` — duplication propre du projet, le projet original n'a pas été modifié.

## Fichiers créés

| Fichier | Rôle |
|---|---|
| `src/pages/Today.jsx` | Accueil décisionnel « Aujourd'hui » |
| `src/pages/Cuisine.jsx` | Stock spatial : 4 emplacements → détail → vue « Tout » |
| `src/pages/Courses.jsx` | Préparation des courses : ajout 1 ligne, suggestions, rayons, CTA magasin |
| `src/components/UI/TabBar.jsx` | Tab bar 4 onglets + bouton Scanner central |
| `src/components/UI/Sheet.jsx` | Feuille modale basse (style iOS) |
| `src/components/UI/MobileHeader.jsx` | En-tête d'écran avec retour |
| `src/components/UI/EmptyState.jsx` | États vides actionnables |
| `src/components/UI/ProgressRing.jsx` | Anneau de progression (mode magasin) |
| `src/components/UI/PwaInstallHint.jsx` | Invite « Ajouter à l'écran d'accueil » (masquée si déjà installée) |
| `src/components/Dashboard/TodayFocus.jsx` | Carrousel « À faire maintenant » |
| `src/components/Dashboard/DecisionCard.jsx` | 1 produit urgent = 3 issues (Utiliser / Racheter / Fini) |
| `src/components/Dashboard/KitchenOverview.jsx` | Les 4 emplacements en un coup d'œil |
| `src/components/Dashboard/ShoppingPanel.jsx` | État des courses + suggestions de rachat |
| `src/components/Dashboard/QuickActions.jsx` | Raccourcis des 4 modes d'ajout |
| `src/components/Scan/ScanHub.jsx` | Feuille de choix du mode d'ajout |
| `src/components/Scan/AddFlow.jsx` | Vue plein écran des modes + logique doublons (déplacée de l'ancienne page Ajouter) |
| `src/components/Add/DuplicateResolver.jsx` | Résolveur de doublons extrait (fusion / nouveau / ignorer) |

## Fichiers modifiés

`src/App.jsx` (nouveau shell de navigation), `src/components/Shopping/ShopMode.jsx` (mode magasin plein écran : progression, rayons, fin guidée — mêmes props + `onScanReceipt` optionnel), `src/components/Shopping/ShoppingActiveBanner.jsx` (restyle), `src/components/Inventory/ProductList.jsx` et `FilterBar.jsx` (props additives `showEmplacementFilter`, `initialSearch` — comportement par défaut inchangé), `src/pages/Settings.jsx` (+ invite PWA), `src/index.css` (couche « app native » : blur, sheets, FAB, snap, safe areas), `public/manifest.json` (couleurs du thème), `package.json` (nom + dépendance).

## Fichiers supprimés (remplacés, aucune fonctionnalité perdue)

`pages/Home.jsx` → Aujourd'hui + Cuisine · `pages/AddProduct.jsx` → ScanHub + AddFlow (logique doublons déplacée à l'identique) · `pages/Alerts.jsx` → intégrée à l'accueil + vue « À surveiller » (réutilise `AlertsList`, conservé) · `pages/ShoppingList.jsx` → `pages/Courses.jsx` · `UI/BottomNav.jsx` → `UI/TabBar.jsx` · `Add/AddMenu.jsx` → `Scan/ScanHub.jsx`.

## Dépendances ajoutées

`lucide-react` (icônes, tree-shaken). Rien d'autre.

## Fonctionnalités conservées (vérifiées)

Stock temps réel ; ajout manuel ; modification (quantité inline, stepper, « Utiliser », fiche) ; suppression ; 4 emplacements officiels inchangés ; scan code-barres caméra + saisie (ZXing → OpenFoodFacts → fiche pré-remplie) ; **analyse photo Gemini 2.5 Flash Lite intacte** (1 appel, full + 6 crops, JSON strict Zod, tri fiables / à vérifier / incertains, garde-fous anti-hallucination déjà présents dans le prompt — non modifié) ; ajout en masse + résolution de doublons (fusion/nouveau/ignorer) ; estimation DLC ; liste de courses temps réel (priorités, marques, rayons) ; sessions de courses partagées (démarrer/reprendre/terminer, bannière « X fait les courses ») ; rapprochement ticket ↔ liste ↔ stock (écran dédié inchangé) ; suppression des achetés / conservation des non-achetés ; notifications ntfy (réglages + cron inchangés) ; auth Supabase ; variables d'environnement inchangées.

## Nouveautés produit

Accueil décisionnel ; cartes de décision 3-issues ; suggestions de rachat automatiques (produits épuisés, dédupliquées contre la liste) ; bloc « Cette semaine » ; navigation spatiale du stock avec compteurs d'urgence par emplacement ; recherche globale depuis Cuisine ; ajout courses en une ligne ; liste et mode magasin groupés par rayon ; progression de courses ; fin de courses guidée (scanner le ticket / nettoyer la liste / garder) sans `window.confirm` ; hub de scan central ; invite d'installation PWA ; états vides actionnables ; squelettes de chargement ; press-states tactiles ; safe areas haut/bas ; `prefers-reduced-motion` respecté.

## Validation technique

- `npm install` ✓ (145 paquets) — `npm run build` ✓ (Vite 5, 0 erreur).
- Avertissement Vite préexistant : chunk JS ≈ 972 kB (≈ 264 kB gzip), dû à `@zxing` chargé statiquement. Non bloquant ; recommandation : `import()` dynamique du scanner (hors périmètre pour ne pas toucher la logique).
- Aucune erreur Supabase/Gemini détectée à l'analyse statique ; aucune variable d'environnement ajoutée ni renommée.

## Lancer la version

```bash
cd ma-cuisine-ui-fable-v2
npm install
npm run dev      # http://localhost:5173
npm run build    # production
```

Note historique : cette V2 utilisait encore une clé Gemini côté client. La V3 actuelle l’a supprimée au profit de la variable serveur `GEMINI_API_KEY` et de `/api/gemini`.

## À tester sur iPhone (Safari, puis « Ajouter à l'écran d'accueil »)

1. Accueil : carrousel « À faire maintenant » → tester les 3 boutons d'une carte (Utiliser → modale ; Racheter → pastille « Sur la liste » ; Fini → feuille de choix).
2. Bouton central Scanner → les 4 modes s'ouvrent en plein écran ; photo du frigo de bout en bout (capture → analyse → validation → doublons éventuels).
3. Scan code-barres caméra : autorisation, visée, fiche pré-remplie (vidéo `playsInline` conservée).
4. Cuisine : ouvrir « Frigo », vérifier compteurs et liseré orange si urgences ; recherche globale → vue « Tout ».
5. Courses : ajout une ligne au clavier (Entrée), suggestion « épuisé », puis « Commencer les courses » → cocher au magasin → « Terminer » → écran de fin (ticket / nettoyer / garder).
6. Synchro 2 appareils : la bannière « X est en train de faire les courses » doit apparaître sur l'autre téléphone.
7. Safe areas : rien sous l'encoche ni sous la barre home, en mode installé.

## Risques restants / limites

- Icônes PWA toujours absentes (`public/icon-192.png`, `icon-512.png`) : à fournir, sinon l'icône d'accueil iOS sera générique. Pas de service worker (hors-ligne) : recommandé plus tard via `vite-plugin-pwa`, non ajouté pour ne pas risquer de cache fantôme au déploiement.
- Les rappels de l'audit précédent restent valables : clé Gemini exposée côté client (à proxyfier en serverless), `/api/notify` sans secret, bundle `@zxing` à charger dynamiquement.
- Le carrousel de décision affiche tous les urgents (pas de pagination) : très bien jusqu'à ~20 urgences, au-delà la vue « À surveiller » prend le relais.
- Non testé sur appareil réel dans cet environnement (pas de navigateur) : le build et la revue de code sont vérifiés, les points ci-dessus listent quoi valider au téléphone.
