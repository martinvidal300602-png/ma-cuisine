# Rapport de livraison — Ma Cuisine V3

Date : 13 juillet 2026
Branche : `codex/ma-cuisine-v3`

## Vision V3

La V3 transforme Ma Cuisine en outil de décision quotidien. L’accueil ne cherche plus à tout montrer : il expose au maximum trois actions urgentes, l’état réel des courses, ce qui doit être consommé dans la semaine et une suggestion simple. Le stock suit la géographie de la cuisine, le scanner devient le geste central, et le parcours courses sépare clairement la préparation, le magasin et la réconciliation du ticket.

La direction visuelle s’appuie sur les conventions iPhone : police système, grands titres, fond gris système, cartes groupées, séparateurs fins, grandes cibles tactiles, tab bar translucide, sheets, safe areas et mode sombre automatique.

## Architecture produit livrée

### Aujourd’hui

- grand titre et date locale ;
- trois cartes de décision prioritaires au maximum ;
- actions Utiliser, Racheter et Fini ;
- état de la liste et de la session courses ;
- bloc Cette semaine sans carrousel coupé ;
- recommandation orientée anti-gaspillage ;
- quatre raccourcis vers les modes Scanner.

### Cuisine

- vue des quatre emplacements officiels ;
- vue globale avec recherche, catégorie et emplacement ;
- sections par fraîcheur ;
- cartes compactes avec quantité, DLC et emplacement ;
- action Utiliser visible ;
- quantité, ajout aux courses et suppression regroupés dans une sheet ;
- respect des modes unité, quantité restante et fraction.

### Scanner

- hub central accessible depuis la tab bar et l’accueil ;
- code-barres OpenFoodFacts ;
- photo d’un emplacement ;
- ticket ;
- saisie manuelle ;
- vues plein écran et résolution des doublons avant écriture.

### Courses

- ajout rapide et détails facultatifs ;
- suggestions de rachat issues du stock épuisé ;
- progression visible ;
- tri par rayon ;
- articles cochés repliés par défaut ;
- mode magasin plein écran avec progression et panier repliable ;
- fin guidée : ticket, nettoyage des cochés ou conservation de la liste ;
- articles non achetés conservés.

### Activité

- chronologie nouvelle, sans migration ;
- historique initial dérivé de `created_at`, `updated_at` et des sessions existantes ;
- détection locale des ajouts, suppressions, consommations, réassorts, mouvements, changements de liste et sessions reçus via les hooks Realtime ;
- conservation locale des 80 événements les plus récents ;
- effacement explicite de l’historique local.

## Décisions produit

- Réglages retiré de la navigation principale et placé derrière un bouton profil cohérent sur les quatre écrans.
- Scanner conservé comme action centrale surélevée, mais traité comme un hub et non comme une destination persistante.
- Aucun écran ne dépend d’un défilement horizontal de cartes.
- Les actions destructives ou secondaires du stock passent par une sheet et une confirmation.
- L’activité exploite les données et les mises à jour existantes afin d’éviter une table d’audit et une migration Supabase.
- Les écrans lourds sont chargés à la demande sans déplacer la logique métier.

## Décisions UI

- Suppression des polices Google et adoption exclusive de la pile système Apple.
- Tokens proches des couleurs système iOS en clair et sombre.
- Coins de 16 px, séparateurs fins et ombres réduites.
- Cibles tactiles de 44 px minimum sur les actions principales.
- Tab bar avec blur, support des safe areas haute et basse.
- Sheets animées sobrement, avec désactivation via `prefers-reduced-motion`.
- Suppression des emojis de catégories et de l’illustration enfantine de connexion.

## Fonctionnalités conservées

- Supabase Auth, PostgreSQL et Realtime ;
- stock partagé, ajout manuel et ajout en masse ;
- OpenFoodFacts et scan code-barres ;
- Gemini 2.5 Flash Lite ;
- pipeline image complète et six crops ;
- Zod, JSON strict et garde-fous anti-hallucination ;
- validation humaine avant toute écriture ambiguë ;
- doublons et fusion ;
- estimation DLC ;
- modes de consommation ;
- liste et sessions de courses ;
- mode magasin ;
- ticket et rapprochement ticket/liste/stock ;
- ntfy et déploiement Vercel.

## Améliorations techniques

- écran de configuration sans page blanche ;
- Error Boundary global conservé ;
- lazy loading de Cuisine, Courses, Activité, Réglages et AddFlow ;
- ZXing toujours chargé dynamiquement ;
- service worker avec shell hors ligne et exclusion des API ;
- manifest enrichi de raccourcis Scanner et Courses ;
- mode sombre automatique ;
- tests Node des règles critiques ;
- validateur statique V3 reproductible ;
- suppression de composants, pages et bibliothèque DLC obsolètes ;
- package renommé `ma-cuisine-v3`, version `3.0.0`.

## Fichiers créés

- `public/sw.js`
- `scripts/validate-v3.mjs`
- `src/components/UI/ProfileButton.jsx`
- `src/components/UI/ScreenLoader.jsx`
- `src/hooks/useActivityFeed.js`
- `src/pages/Activity.jsx`
- `tests/business-rules.test.js`
- `V3_REPORT.md`

## Fichiers principaux modifiés

- `src/App.jsx`
- `src/index.css`
- `src/main.jsx`
- `src/pages/Today.jsx`
- `src/pages/Cuisine.jsx`
- `src/pages/Courses.jsx`
- `src/pages/Settings.jsx`
- `src/components/Inventory/ProductCard.jsx`
- `src/components/Dashboard/TodayFocus.jsx`
- `src/components/Dashboard/DecisionCard.jsx`
- `src/components/Scan/ScanHub.jsx`
- `src/components/UI/TabBar.jsx`
- `src/hooks/useShoppingSession.js`
- `index.html`
- `public/manifest.json`
- `tailwind.config.js`
- `package.json`
- `package-lock.json`
- `README.md`
- `VALIDATION.md`

## Fichiers supprimés

- `MIX_REPORT.md`, rapport V2 devenu obsolète ;
- `src/lib/dlc estimees.js`, doublon non importé ;
- anciennes pages `AddProduct.jsx`, `Alerts.jsx`, `Home.jsx`, `ShoppingList.jsx` ;
- anciens composants `AddMenu.jsx`, `KitchenOverview.jsx`, `AddToListButton.jsx`, `Badge.jsx`, `BottomNav.jsx`.

## Dépendances

Aucune dépendance ajoutée. Les tests utilisent `node:test`, fourni par Node. Toutes les versions applicatives existantes sont conservées, notamment Supabase, ZXing, React, Lucide et Zod.

## Bugs et incohérences corrigés

- navigation cible à cinq espaces incomplète ;
- Réglages occupait à tort la place d’Activité ;
- absence de chronologie ;
- cartes urgentes potentiellement tronquées horizontalement ;
- typographies web éloignées d’une application iOS et dépendantes du réseau ;
- cartes produit surchargées et actions secondaires exposées en permanence ;
- cochés des courses toujours dépliés ;
- absence de service worker malgré le manifest ;
- fichiers morts et doublon de bibliothèque DLC ;
- package encore nommé V2.

## Base de données

Aucun changement de schéma, aucune colonne renommée, aucune migration V3 et aucune exécution Supabase. Les quatre emplacements officiels sont inchangés.

## Résultat du build

`npm run build` réussit avec 2 159 modules. Le bundle applicatif connecté passe d’environ 318 kB brut en V2 à 272 kB brut en V3. Cuisine, Courses, Activité et Réglages sont désormais séparés. ZXing reste dans son chunk différé.

## Risques restants

- L’activité est un journal pratique côté appareil, dérivé des lignes existantes et des changements observés ; ce n’est pas un audit serveur exhaustif. Un historique global garanti nécessiterait une table dédiée et donc une migration séparée.
- Les scans caméra, Gemini, Realtime multi-appareils et ntfy doivent être validés avec les vrais comptes et un déploiement HTTPS.
- La clé Gemini reste côté client conformément à l’architecture privée actuelle.
- Le service worker fournit le shell hors ligne, mais les données Supabase nécessitent naturellement une connexion.

## Commits de livraison

1. `feat: establish the Ma Cuisine V3 app shell`
2. `feat: refine inventory, scanner and shopping journeys`
3. `test: validate and document the V3 release`

## Lancement

```bash
npm ci
cp .env.example .env.local
npm run dev
```

## Commandes de contrôle

```bash
npm run validate
npm test
npm run build
```

## Push de la branche

```bash
git switch codex/ma-cuisine-v3
git push -u origin codex/ma-cuisine-v3
```

Créer ensuite une pull request vers `main` ; ne pas pousser directement sur `main`.

## Test iPhone

1. Déployer la branche en prévisualisation Vercel HTTPS.
2. Ouvrir l’URL dans Safari.
3. Se connecter et tester les quatre modes Scanner.
4. Vérifier la synchronisation entre deux iPhone.
5. Ajouter l’application via **Partager → Sur l’écran d’accueil**.
6. Vérifier portrait, mode sombre, safe areas, tab bar et sheets.
7. Terminer une session courses avec un ticket contenant au moins un produit non acheté.
