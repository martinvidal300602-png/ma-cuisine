# Validation finale — Ma Cuisine V3

Date : 13 juillet 2026
Branche : `codex/ma-cuisine-v3`

## Commandes exécutées

```bash
npm ci --no-audit --no-fund
npm run validate
npm test
npm run build
git diff --check
git status --short --branch
```

## Résultats automatisés

- `npm ci` : réussi, 145 paquets installés.
- `npm run validate` : réussi.
- `npm test` : 4 tests réussis, 0 échec.
- `npm run build` : réussi, 2 159 modules transformés.
- `git diff --check` : aucune erreur d’espace ou de conflit.

Dernier build mesuré :

| Chunk | Taille | Gzip | Chargement |
|---|---:|---:|---|
| Entrée/configuration | 152,45 kB | 49,14 kB | initial |
| Application connectée | 272,11 kB | 71,78 kB | après configuration |
| Activité | 5,38 kB | 2,06 kB | à l’ouverture |
| Courses | 16,26 kB | 4,97 kB | à l’ouverture |
| Cuisine | 17,77 kB | 5,47 kB | à l’ouverture |
| Réglages | 8,29 kB | 2,80 kB | à l’ouverture |
| Flux Scanner | 125,28 kB | 35,77 kB | après choix d’un mode |
| ZXing | 411,38 kB | 107,69 kB | scan code-barres uniquement |

## Invariants contrôlés

- Les quatre emplacements restent exactement : `Frigo`, `Placard sous fenêtre`, `Plan de travail`, `Placard épices`.
- Gemini reste sur `gemini-2.5-flash-lite` pour les photos et les tickets.
- Les deux flux Gemini importent Zod et utilisent `safeParse`.
- Le pipeline photo conserve `full` et les six crops haut/milieu/bas, gauche/droite.
- ZXing est importé par `await import('@zxing/browser')`.
- Cuisine, Courses, Activité, Réglages et AddFlow utilisent des imports dynamiques.
- Le manifest est un JSON valide, en mode `standalone`, orientation portrait, avec icônes 192 et 512.
- Les fichiers PNG mesurent bien 180, 192 et 512 pixels.
- Le service worker est enregistré uniquement en production et ne met pas en cache les appels `/api/`.
- `.gitignore` exclut `node_modules`, `dist`, `.env`, `.env.local` et `.vercel`.
- Aucun `.env` ni `.env.local` n’est suivi par Git ; seul `.env.example` est versionné.
- Aucun schéma, nom de table ou nom de colonne Supabase n’a été modifié.
- Aucune migration V3 n’a été créée ou exécutée.

## Tests métier

- détection de doublon limitée à une marque compatible et au même emplacement ;
- fusion des quantités et conservation de la DLC la plus proche ;
- rapprochement d’un libellé ticket abrégé avec la liste ;
- conservation des articles non achetés ;
- modes de consommation par unités, quantité restante et fraction.

## Contrôle navigateur mobile

Contrôle effectué dans un viewport iPhone de 390 × 844 pixels :

- sans variables Supabase : écran de configuration lisible, aucune page blanche ;
- avec configuration Supabase fictive : écran de connexion complet, champs de 48 px et CTA accessible ;
- aucune erreur JavaScript observée sur ces deux états publics.

## Flux relus sans modification métier

- Auth Supabase et persistance de session ;
- rafraîchissement Realtime du stock, de la liste et des sessions ;
- ajout simple et en masse ;
- résolution humaine des doublons avant écriture ;
- scan OpenFoodFacts ;
- validation humaine des résultats photo Gemini ;
- ticket, rapprochement, suppression des achetés et maintien des non-achetés ;
- fin de session de courses ;
- notification ntfy côté Vercel.

## Tests à effectuer avec les vrais services

Ces contrôles nécessitent des identifiants, une caméra et les données de production ; ils ne peuvent pas être simulés de manière fiable dans le dépôt :

1. connexion avec un compte familial ;
2. synchronisation entre deux iPhone ;
3. scan d’un code-barres réel ;
4. photo d’un emplacement avec validation partielle d’un résultat ambigu ;
5. ticket réel avec article coché absent du ticket et article non coché ;
6. notification ntfy et cron Vercel ;
7. installation depuis Safari sur l’écran d’accueil.

## Procédure iPhone recommandée

1. Déployer la branche sur une URL Vercel de prévisualisation HTTPS.
2. Ouvrir l’URL dans Safari et se connecter.
3. Utiliser **Partager → Sur l’écran d’accueil**.
4. Vérifier les safe areas en portrait et le mode sombre automatique.
5. Tester successivement manuel, code-barres, photo et ticket.
6. Lancer une session courses sur un iPhone et cocher un article depuis un second.
7. Terminer par le ticket et confirmer que les non-achetés restent sur la liste.
