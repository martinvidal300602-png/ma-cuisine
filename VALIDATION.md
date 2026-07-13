# Validation finale

Date : 13 juillet 2026

## Commandes exécutées

```bash
npm ci --no-audit --no-fund
npm run build
```

## Résultat

Build Vite réussi sans erreur :

- 2 157 modules transformés ;
- CSS : 22,55 kB, 5,57 kB gzip ;
- entrée de configuration : 152,27 kB, 49,06 kB gzip ;
- application : 318,43 kB, 83,17 kB gzip ;
- flux d’ajout : 125,24 kB, 35,75 kB gzip ;
- scanner ZXing différé : 411,38 kB, 107,69 kB gzip.

## Tests restant à faire avec les vrais services

- connexion Supabase ;
- synchronisation sur deux appareils ;
- ajout manuel et gestion des doublons ;
- scan code-barres sur Safari iOS ;
- analyse photo Gemini 2.5 Flash Lite ;
- ticket de caisse et rapprochement liste/stock ;
- cron Vercel et notification ntfy ;
- installation depuis Safari sur l’écran d’accueil.
