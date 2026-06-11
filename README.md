# Ma Cuisine 🥕

PWA d'inventaire alimentaire familial partagé (3 utilisatrices).

## Stack
React 18 + Vite + Tailwind CSS · Supabase (PostgreSQL + Auth + Realtime) · Gemini Flash (analyse photo) · OpenFoodFacts (code-barres) · ntfy.sh (notifications) · Vercel (hébergement + cron).

## Installation

```bash
npm install
cp .env.example .env   # puis remplir les clés
npm run dev
```

## Mise en place

1. **Supabase** : créer un projet, exécuter `supabase_schema.sql` dans l'éditeur SQL, créer les 3 comptes utilisatrices (Authentication → Users → Add user), puis copier l'URL du projet et la clé `anon` dans `.env`.
2. **Gemini** : créer une clé API sur Google AI Studio → `VITE_GEMINI_API_KEY`.
3. **Vercel** : importer le repo, ajouter les variables d'environnement (y compris `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NTFY_TOPIC` pour le cron). Le cron `/api/notify` est défini dans `vercel.json` (06:00 UTC ≈ 8h Paris l'été).
4. **ntfy** : installer l'app ntfy sur iPhone et s'abonner au topic choisi (instructions dans Réglages).
5. **Icônes PWA** : ajouter `public/icon-192.png` et `public/icon-512.png` (192×192 et 512×512).

## Scripts
- `npm run dev` — serveur de développement
- `npm run build` — build de production
- `npm run preview` — prévisualisation du build
