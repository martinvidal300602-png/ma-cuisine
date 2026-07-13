# Ma Cuisine V3

PWA familiale conçue pour iPhone. Ma Cuisine réunit un stock partagé avec niveau de confiance, les dates de consommation, quatre modes de scan, une liste de courses hors ligne et un assistant repas basé sur les produits réellement disponibles.

## Espaces de l’application

- **Aujourd’hui** : trois décisions prioritaires au maximum, recommandations expliquées, assistant « Qu’est-ce qu’on mange ? » et quatre actions rapides.
- **Cuisine** : quatre emplacements officiels, recherche, fraîcheur, quantités, DLC, filtres et états Confirmé/Probable/Incertain/À vérifier/Épuisé.
- **Scanner** : code-barres OpenFoodFacts, photo d’emplacement Gemini, ticket et ajout manuel.
- **Courses** : suggestions expliquées, dictée, organisation par rayon, mode magasin utilisable hors ligne, file de synchronisation et fin guidée par ticket.
- **Activité** : chronologie locale immédiate et, après migration, journal familial persistant avec auteur et historique de consommation.

Les Réglages sont accessibles depuis le bouton profil de chaque écran principal.

## Stack et services conservés

- React 18, Vite et Tailwind CSS ;
- Supabase Auth, PostgreSQL et Realtime ;
- Gemini `gemini-2.5-flash-lite` derrière `/api/gemini`, parsing Zod strict, image complète et six crops ;
- OpenFoodFacts et ZXing chargé uniquement à l’ouverture du scan code-barres ;
- ntfy via la fonction Vercel `/api/notify` ;
- PWA via `vite-plugin-pwa`, manifest, icônes 180/192/512 et précache du shell.

L’application reste ouvrable avant la migration V3. Les événements persistants, l’historique, la confiance enrichie et l’isolation par foyer nécessitent la migration séparée `supabase/migrations/20260713_v3_intelligence_foundations.sql`. Elle n’est jamais exécutée automatiquement.

## Installation locale

```bash
npm ci
cp .env.example .env.local
# Compléter .env.local
npm run dev
```

Variables front :

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Les variables Supabase sont obligatoires. Sans elles, un écran de configuration est affiché. Aucune clé Gemini n’est incluse dans le bundle navigateur.

Variables serveur Vercel :

```env
GEMINI_API_KEY=...
NTFY_TOPIC=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
CRON_SECRET=...
```

`GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NTFY_TOPIC` et `CRON_SECRET` doivent rester uniquement dans les variables serveur. Utiliser un topic ntfy long et non devinable. Les analyses Gemini nécessitent une session Supabase valide. Pour les tester localement avec les fonctions `/api`, utiliser `vercel dev` ; `npm run dev` suffit pour le reste de l’interface.

## Migration V3 séparée

1. Créer une branche ou un projet Supabase de prévisualisation.
2. Relire `supabase/migrations/20260713_v3_intelligence_foundations.sql` et sauvegarder la base.
3. Exécuter ce fichier manuellement sur la prévisualisation.
4. Tester deux comptes, les quatre emplacements, les RLS, Realtime et l’annulation.
5. Appliquer en production seulement après validation.

La migration conserve les tables et colonnes existantes. Elle ajoute les foyers, les événements, l’historique produit, les analyses photo, les tickets structurés et les préférences.

## Vérification

```bash
npm run validate
npm test
npm run build
npm run preview
```

`npm run validate` contrôle notamment les quatre emplacements, le proxy Gemini, Zod, les crops, l’import dynamique ZXing, le lazy loading, le schéma V3/RLS, les états de stock, l’accueil et la PWA.

## Test sur iPhone

```bash
npm run dev -- --host 0.0.0.0
ipconfig getifaddr en0
```

Ouvrir `http://ADRESSE_IP_DU_MAC:5173` dans Safari. Pour tester l’installation PWA et la caméra dans des conditions réalistes, utiliser un déploiement HTTPS, puis **Partager → Sur l’écran d’accueil**.

Le détail de la livraison figure dans `V3_REPORT.md` et `VALIDATION.md`.
