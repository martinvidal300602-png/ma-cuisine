# Ma Cuisine — V2 mix

PWA familiale d’inventaire alimentaire, pensée pour être ouverte depuis l’écran d’accueil d’un iPhone.

Cette version combine :

- la logique métier stable du projet initial ;
- l’accueil décisionnel et la navigation mobile de Fable V2 ;
- des correctifs de robustesse ajoutés lors de l’intégration.

## Stack

React 18, Vite, Tailwind CSS, Supabase Auth/PostgreSQL/Realtime, Gemini 2.5 Flash Lite, OpenFoodFacts, ntfy.sh et Vercel.

## Installation locale

```bash
npm install
cp .env.example .env.local
# Remplir .env.local
npm run dev
```

Variables front :

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_GEMINI_API_KEY=AIza...
```

Les deux variables Supabase sont obligatoires. La clé Gemini est nécessaire uniquement pour l’analyse photo et le ticket. Si Supabase n’est pas configuré, l’application affiche désormais un écran d’aide au lieu d’une page blanche.

## Validation

```bash
npm run build
npm run preview
```

## Test sur iPhone

```bash
npm run dev -- --host 0.0.0.0
ipconfig getifaddr en0
```

Ouvrir ensuite `http://ADRESSE_IP_DU_MAC:5173` dans Safari sur l’iPhone. Pour un test réaliste de l’installation, déployer en HTTPS puis utiliser Partager → Sur l’écran d’accueil.

## Variables serveur Vercel

```env
NTFY_TOPIC=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_URL=...
CRON_SECRET=...
```

Le champ ntfy dans Réglages est uniquement un mémo local. Le cron utilise `NTFY_TOPIC` côté Vercel. Quand `CRON_SECRET` est défini, `/api/notify` refuse les appels non autorisés.
