# Rapport d’intégration — Ma Cuisine V2 mix

## Base retenue

La coque de Fable V2 a été retenue car elle apporte la vraie évolution produit : accueil « Aujourd’hui », stock par emplacement, scan central, mode courses guidé et navigation PWA iPhone.

La logique métier existante reste la source de vérité : hooks Supabase, Realtime, produits, doublons, estimation DLC, OpenFoodFacts, Gemini 2.5 Flash Lite, ticket et rapprochement courses/stock.

## Modifications ajoutées pendant l’intégration

### Robustesse locale

- Détection des variables Supabase avant le chargement de l’application.
- Écran de configuration explicite à la place de la page blanche quand `.env.local` manque.
- Modèle `.env.local` copiable depuis l’écran.
- `ErrorBoundary` global avec écran de récupération et détails techniques en développement.

### Performance

- Chargement différé du flux d’ajout avec `React.lazy`.
- Chargement dynamique de `@zxing/browser` uniquement au démarrage du scan code-barres.
- Le scanner n’alourdit plus le bundle initial.

### PWA iPhone

- Ajout des icônes 180, 192 et 512 px.
- Ajout d’un favicon SVG.
- Manifest complété avec identifiant, orientation portrait et catégories.
- Lien `apple-touch-icon` corrigé.

### Notifications serveur

- Protection optionnelle de `/api/notify` par `CRON_SECRET`.
- Rejet des méthodes autres que `GET` et désactivation du cache.

### Réglages

- Ajout d’un état visible pour Supabase et Gemini 2.5 Flash Lite.
- Clarification du topic ntfy : le champ local est un mémo et ne modifie pas le cron Vercel.

### Documentation

- README réécrit pour l’installation locale, le test iPhone et les variables Vercel.
- Nom du paquet changé en `ma-cuisine-v2-mix`.

## Éléments volontairement non modifiés

- Schéma Supabase et noms de colonnes.
- Modèle `gemini-2.5-flash-lite`.
- Pipeline photo : image complète + six recadrages, réponse JSON stricte Zod.
- Rapprochement ticket / liste / stock.
- Règles de doublons, de consommation et d’estimation des DLC.
- API OpenFoodFacts.

## Point de sécurité restant

La clé Gemini est toujours utilisée côté client via `VITE_GEMINI_API_KEY`. Une migration vers une fonction Vercel `/api/gemini` devra être faite séparément, avec une phase de test, pour ne pas casser le développement local et le pipeline photo existant.

## Validation exécutée

- `npm ci --no-audit --no-fund` : réussi.
- `npm run build` : réussi, 2 157 modules transformés, aucune erreur.
- Bundle initial : environ 152 kB brut / 49 kB gzip pour l’entrée de configuration.
- Application connectée : chargée dans un chunk séparé d’environ 318 kB brut / 83 kB gzip.
- Flux d’ajout : chunk séparé d’environ 125 kB brut / 36 kB gzip.
- ZXing : chunk séparé d’environ 411 kB brut / 108 kB gzip, téléchargé seulement lors du scan code-barres.
- Aucun secret réel trouvé dans l’archive.
