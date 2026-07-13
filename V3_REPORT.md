# Rapport de livraison — Ma Cuisine V3 intelligente

Date : 13 juillet 2026
Branche : `codex/ma-cuisine-v3`

## Résultat

La V3 est désormais structurée autour de décisions simples et d’un stock qui exprime son incertitude. L’accueil contient exactement trois blocs : « À faire aujourd’hui », « Ce que l’app recommande » et quatre actions rapides. Une carte prioritaire n’expose qu’une action principale ; la décision détaillée reste dans une sheet.

## Fonctionnalités livrées

- cinq destinations : Aujourd’hui, Cuisine, Scanner central, Courses et Activité ;
- états de stock Confirmé, Probable, Incertain, À vérifier et Épuisé, calculés localement même avant migration ;
- comparaison photo : nouveaux, toujours présents, probablement retirés, à vérifier et incertains ;
- mutation uniquement après validation humaine ;
- Gemini 2.5 Flash Lite en deux étapes : détection structurée, puis normalisation/doublons/confiance en local ;
- assistant repas Anti-gaspillage/Rapide, temps, personnes et végétarien, sans inventer de produits absents ;
- suggestions de courses expliquées par le stock ou la fréquence réelle d’achat ;
- dictée vocale quand le navigateur l’autorise, plus clavier/dictée iPhone natifs ;
- rayons automatiques, changement manuel de rayon et articles trouvés repliés ;
- cache de liste, mutations hors ligne, file locale et synchronisation au retour du réseau ;
- annulation globale pendant quelques secondes pour les mutations principales ;
- chronologie locale compatible avec le schéma actuel, enrichie par `evenements` après migration ;
- affichage des membres et rôles du foyer après migration.

## Sécurité et architecture

- la clé Gemini est uniquement lue via `GEMINI_API_KEY` dans `/api/gemini` ;
- l’endpoint vérifie le jeton Supabase, limite les appels, la taille, le nombre d’images et le contenu transmis ;
- `/api/notify` exige toujours `CRON_SECRET` ;
- les erreurs externes sont journalisées sans exposer de secret au navigateur ;
- les images sont orientées, redimensionnées et compressées avant envoi ;
- `vite-plugin-pwa` génère et met à jour le service worker ; les routes `/api` ne sont pas utilisées comme fallback hors ligne.

## Migration non exécutée

Le fichier `supabase/migrations/20260713_v3_intelligence_foundations.sql` est livré séparément et n’a pas été exécuté. Il :

- conserve les tables et colonnes existantes ;
- ajoute `foyers`, `foyer_membres`, `historique_produits`, `evenements`, `analyses_photo`, `analyses_photo_items`, `tickets`, `ticket_items` et `utilisateurs_preferences` ;
- ajoute les preuves et scores de confiance sur `produits` ;
- rattache stock, courses et sessions au foyer courant par défaut ;
- remplace les politiques permissives connues par des RLS de foyer ;
- active Realtime sur les nouvelles tables utiles.

La procédure de revue et de prévisualisation est documentée dans `README.md`.

## Performance et robustesse

- Cuisine, Courses, Activité, Réglages et le flux Scanner sont chargés à la demande ;
- ZXing reste un import dynamique réservé au scan code-barres ;
- les écritures de courses sont optimistes et ne relancent plus systématiquement une seconde lecture ;
- l’interface et la liste de courses restent disponibles sans réseau ;
- erreurs de configuration et erreurs React ont un écran explicite ;
- safe areas, mode sombre et réduction des animations sont conservés.

## Limites honnêtes

- la migration doit être testée avec une sauvegarde et deux vrais comptes avant production ;
- les permissions caméra, la reprise après veille, Realtime entre deux iPhone, Gemini, ntfy et le réseau faible demandent une validation sur appareils réels et déploiement HTTPS ;
- la fréquence d’achat devient fiable après au moins deux événements d’ajout persistés ;
- l’annulation restaure l’état métier, mais ne réécrit pas rétroactivement une ligne d’événement déjà journalisée.

## Contrôles

```bash
npm run validate
npm test
npm run build
git diff --check
```
