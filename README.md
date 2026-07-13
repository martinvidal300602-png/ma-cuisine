# Ma Cuisine V3

PWA familiale conçue pour trois personnes sur iPhone. Ma Cuisine réunit le stock alimentaire partagé, les dates de consommation, quatre modes de scan et toute la préparation des courses dans une interface sobre inspirée des applications Apple.

## Espaces de l’application

- **Aujourd’hui** : trois décisions prioritaires au maximum, produits de la semaine, état des courses, recommandation et raccourcis scanner.
- **Cuisine** : quatre emplacements officiels, vue globale, recherche, filtres, quantités, DLC et actions produit en sheet.
- **Scanner** : code-barres OpenFoodFacts, photo d’emplacement Gemini, ticket et ajout manuel.
- **Courses** : ajout rapide, suggestions, rayons, progression, mode magasin plein écran et fin guidée par ticket.
- **Activité** : ajouts, consommations, suppressions, changements de liste et sessions, dérivés des données existantes et des mises à jour Realtime.

Les Réglages sont accessibles depuis le bouton profil de chaque écran principal.

## Stack et services conservés

- React 18, Vite et Tailwind CSS ;
- Supabase Auth, PostgreSQL et Realtime ;
- Gemini `gemini-2.5-flash-lite`, parsing Zod strict, image complète et six crops ;
- OpenFoodFacts et ZXing chargé uniquement à l’ouverture du scan code-barres ;
- ntfy via la fonction Vercel `/api/notify` ;
- PWA avec manifest, icônes 180/192/512 et service worker.

Aucune migration Supabase n’est requise par la V3.

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
VITE_GEMINI_API_KEY=AIza...
```

Les variables Supabase sont obligatoires. Sans elles, un écran de configuration est affiché. Gemini est requis uniquement pour l’analyse des photos et tickets ; le reste de l’application demeure utilisable si sa clé est absente.

Variables serveur Vercel :

```env
NTFY_TOPIC=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_URL=...
CRON_SECRET=...
```

## Vérification

```bash
npm run validate
npm test
npm run build
npm run preview
```

`npm run validate` contrôle les quatre emplacements, le modèle Gemini, Zod, les crops, l’import dynamique ZXing, le lazy loading, les icônes et le manifest.

## Test sur iPhone

```bash
npm run dev -- --host 0.0.0.0
ipconfig getifaddr en0
```

Ouvrir `http://ADRESSE_IP_DU_MAC:5173` dans Safari. Pour tester l’installation PWA et la caméra dans des conditions réalistes, utiliser un déploiement HTTPS, puis **Partager → Sur l’écran d’accueil**.

Le détail de la livraison figure dans `V3_REPORT.md` et `VALIDATION.md`.
