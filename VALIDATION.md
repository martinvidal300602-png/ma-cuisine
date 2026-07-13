# Validation finale — Ma Cuisine V3 intelligente

Date : 13 juillet 2026
Branche : `codex/ma-cuisine-v3`

## Résultats automatisés

Commandes exécutées sur le dépôt final :

```bash
npm run validate
npm test
npm run build
npm audit --omit=dev --audit-level=high
git diff --check
```

- `npm run validate` : réussi ; invariants V3, proxy Gemini, foyer/RLS, PWA et chargement différé conformes.
- `npm test` : 10 tests réussis, 0 échec.
- `npm run build` : réussi ; 2 173 modules transformés et service worker Workbox généré.
- audit des dépendances de production : 0 vulnérabilité.
- `git diff --check` : aucune erreur d’espace ou marqueur de conflit.

Dernier build mesuré :

| Chunk | Taille | Gzip | Chargement |
|---|---:|---:|---|
| Entrée/configuration | 152,27 kB | 49,06 kB | initial |
| Application connectée | 298,38 kB | 80,27 kB | après configuration |
| Activité | 5,29 kB | 2,06 kB | à l’ouverture |
| Réglages | 10,79 kB | 3,63 kB | à l’ouverture |
| Courses | 20,97 kB | 6,80 kB | à l’ouverture |
| Cuisine | 21,26 kB | 6,48 kB | à l’ouverture |
| Flux d’ajout | 128,07 kB | 36,88 kB | après choix d’un mode |
| ZXing | 411,38 kB | 107,69 kB | scan code-barres uniquement |

La PWA précache 23 ressources, soit environ 1,05 Mio. Les requêtes `/api/` ne reçoivent pas de réponse de navigation mise en cache.

## Couverture métier

Les tests automatisés couvrent :

- détection et fusion des doublons avec conservation de la DLC la plus proche ;
- rapprochement ticket et maintien des articles non achetés ;
- consommation par unité, quantité ou fraction ;
- cinq états de confiance du stock selon preuves, ancienneté et absences ;
- comparaison photo entre produits présents, nouveaux, retirés probables et ambigus ;
- suggestions de repas limitées au stock réellement disponible ;
- suggestions de courses expliquées par l’historique d’achat ;
- estimation de DLC ;
- fusion et synchronisation de la file de mutations hors ligne.

## Invariants et sécurité

- Les quatre emplacements restent exactement : `Frigo`, `Placard sous fenêtre`, `Plan de travail`, `Placard épices`.
- Les analyses photo et ticket utilisent `gemini-2.5-flash-lite` via `/api/gemini`.
- La clé Gemini n’est jamais exposée dans le bundle client.
- Le proxy vérifie le jeton Supabase, limite le débit et borne les images, le prompt et la durée d’appel.
- Les réponses Gemini sont normalisées puis validées localement avec Zod avant présentation humaine.
- Aucun résultat ambigu d’une photo ou d’un ticket n’est écrit automatiquement.
- Le cron de notification exige `CRON_SECRET` et les erreurs serveur ne divulguent pas les secrets.
- ZXing et les grandes pages restent chargés à la demande.
- `.gitignore` exclut les fichiers d’environnement, `node_modules`, `dist` et `.vercel`.

## Migration Supabase

La migration `supabase/migrations/20260713_v3_intelligence_foundations.sql` a été créée séparément et **n’a pas été exécutée**. Elle doit d’abord être relue puis appliquée sur un projet de prévisualisation.

Elle ajoute les foyers et rôles, les preuves de confiance, l’historique produit, les événements, les analyses photo structurées, les tickets structurés et les préférences utilisateur. Elle conserve les tables, colonnes et valeurs d’emplacement existantes, puis remplace les politiques génériques par des politiques RLS liées au foyer.

Avant migration, les nouvelles écritures annexes restent tolérantes à l’absence des tables ; les flux historiques continuent de fonctionner. Après migration, les fonctionnalités famille, historique persistant et activité multi-utilisateur deviennent complètes.

## Contrôle navigateur mobile

Contrôle visuel réalisé dans le navigateur intégré avec un viewport mobile :

- écran de configuration sans débordement horizontal ;
- cible du bouton de copie portée à 44 × 44 px ;
- écran de connexion complet sans débordement ;
- champs et CTA de 48 px, avec texte de saisie à 16 px pour éviter le zoom Safari ;
- aucune erreur JavaScript sur les états publics testés.

Les écrans authentifiés n’ont pas été ouverts faute d’identifiants de test ; aucune donnée distante n’a été modifiée.

## Recette avec les vrais services

À effectuer sur une URL de prévisualisation HTTPS après application contrôlée de la migration :

1. vérifier la connexion et la création/reprise du foyer ;
2. tester la synchronisation entre deux comptes et les rôles administrateur/membre ;
3. comparer une vraie photo, décocher un résultat ambigu puis valider ;
4. scanner un ticket réel et contrôler le rapprochement avec les courses ;
5. passer hors ligne, modifier la liste puis vérifier la reprise de synchronisation ;
6. rouvrir une session via l’annulation temporaire ;
7. tester la notification cron et l’installation iPhone depuis Safari.
