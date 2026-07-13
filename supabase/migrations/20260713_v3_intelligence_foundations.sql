-- Ma Cuisine V3 — fondations intelligentes
-- IMPORTANT : migration volontairement non exécutée par Codex.
-- À relire et tester dans un projet Supabase de prévisualisation avant production.
-- Elle conserve toutes les colonnes existantes et ajoute les fondations d'historique,
-- de confiance, de comparaison photo, de tickets et de foyer familial.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS foyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL DEFAULT 'Ma famille',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS foyer_membres (
  foyer_id UUID NOT NULL REFERENCES foyers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'membre' CHECK (role IN ('membre', 'administrateur')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (foyer_id, user_id)
);

-- Bootstrap du foyer existant : les comptes actuels deviennent membres du même foyer.
-- Le premier compte créé devient administrateur. Adapter ce bloc si plusieurs foyers
-- doivent être créés dès la migration.
WITH default_home AS (
  INSERT INTO foyers (nom)
  SELECT 'Ma famille'
  WHERE NOT EXISTS (SELECT 1 FROM foyers)
  RETURNING id
), selected_home AS (
  SELECT id FROM default_home
  UNION ALL
  SELECT existing.id
  FROM (SELECT id FROM foyers ORDER BY created_at LIMIT 1) AS existing
  WHERE NOT EXISTS (SELECT 1 FROM default_home)
)
INSERT INTO foyer_membres (foyer_id, user_id, email, role)
SELECT
  (SELECT id FROM selected_home LIMIT 1),
  users.id,
  users.email,
  CASE WHEN users.created_at = (SELECT min(created_at) FROM auth.users)
    THEN 'administrateur' ELSE 'membre' END
FROM auth.users AS users
ON CONFLICT (foyer_id, user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION current_foyer_ids()
RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT foyer_id FROM foyer_membres WHERE user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION current_foyer_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT foyer_id FROM foyer_membres WHERE user_id = auth.uid() ORDER BY created_at LIMIT 1
$$;

CREATE OR REPLACE FUNCTION is_foyer_admin(target_foyer UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM foyer_membres
    WHERE foyer_id = target_foyer AND user_id = auth.uid() AND role = 'administrateur'
  )
$$;

ALTER TABLE produits
  ADD COLUMN IF NOT EXISTS foyer_id UUID REFERENCES foyers(id),
  ADD COLUMN IF NOT EXISTS stock_status TEXT,
  ADD COLUMN IF NOT EXISTS confidence_score REAL,
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_manual_update_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_ticket_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_consumed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS absence_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE courses ADD COLUMN IF NOT EXISTS foyer_id UUID REFERENCES foyers(id);
ALTER TABLE courses_sessions ADD COLUMN IF NOT EXISTS foyer_id UUID REFERENCES foyers(id);

ALTER TABLE produits ALTER COLUMN foyer_id SET DEFAULT current_foyer_id();
ALTER TABLE courses ALTER COLUMN foyer_id SET DEFAULT current_foyer_id();
ALTER TABLE courses_sessions ALTER COLUMN foyer_id SET DEFAULT current_foyer_id();

UPDATE produits
SET foyer_id = (SELECT id FROM foyers ORDER BY created_at LIMIT 1)
WHERE foyer_id IS NULL;

UPDATE courses
SET foyer_id = (SELECT id FROM foyers ORDER BY created_at LIMIT 1)
WHERE foyer_id IS NULL;

UPDATE courses_sessions
SET foyer_id = (SELECT id FROM foyers ORDER BY created_at LIMIT 1)
WHERE foyer_id IS NULL;

CREATE TABLE IF NOT EXISTS evenements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  foyer_id UUID REFERENCES foyers(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  title TEXT NOT NULL,
  detail TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email TEXT,
  undo_until TIMESTAMPTZ,
  undone_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS evenements_foyer_created_idx
  ON evenements (foyer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS historique_produits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  foyer_id UUID REFERENCES foyers(id) ON DELETE CASCADE,
  produit_id UUID,
  nom TEXT NOT NULL,
  quantite_ajoutee REAL NOT NULL DEFAULT 0,
  quantite_consommee REAL NOT NULL DEFAULT 0,
  date_ajout TIMESTAMPTZ,
  date_fin TIMESTAMPTZ,
  resultat TEXT CHECK (resultat IN ('consomme', 'gaspille', 'stock', 'corrige')),
  source_ajout TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS historique_produits_foyer_nom_idx
  ON historique_produits (foyer_id, lower(nom), created_at DESC);

CREATE TABLE IF NOT EXISTS analyses_photo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  foyer_id UUID REFERENCES foyers(id) ON DELETE CASCADE,
  emplacement TEXT NOT NULL CHECK (emplacement IN (
    'Frigo', 'Placard sous fenêtre', 'Plan de travail', 'Placard épices'
  )),
  status TEXT NOT NULL DEFAULT 'a_valider'
    CHECK (status IN ('analyse', 'a_valider', 'validee', 'annulee', 'erreur')),
  image_fingerprint TEXT,
  model TEXT NOT NULL DEFAULT 'gemini-2.5-flash-lite',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  validated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS analyses_photo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analyse_id UUID NOT NULL REFERENCES analyses_photo(id) ON DELETE CASCADE,
  produit_id UUID,
  nom_detecte TEXT NOT NULL,
  normalized_name TEXT,
  marque TEXT,
  quantite_visible REAL,
  unite TEXT,
  confidence TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'low')),
  confidence_score REAL,
  image_zone TEXT,
  sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  comparison_status TEXT NOT NULL
    CHECK (comparison_status IN ('nouveau', 'toujours_present', 'probablement_retire', 'a_verifier')),
  user_decision TEXT CHECK (user_decision IN ('ajouter', 'conserver', 'epuiser', 'ignorer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  foyer_id UUID REFERENCES foyers(id) ON DELETE CASCADE,
  courses_session_id UUID REFERENCES courses_sessions(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'a_valider'
    CHECK (status IN ('analyse', 'a_valider', 'valide', 'annule', 'erreur')),
  model TEXT NOT NULL DEFAULT 'gemini-2.5-flash-lite',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  validated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ticket_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  raw_label TEXT,
  nom TEXT NOT NULL,
  marque TEXT,
  categorie TEXT,
  quantite REAL NOT NULL DEFAULT 1,
  unite TEXT,
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  produit_id UUID,
  course_id UUID,
  decision TEXT CHECK (decision IN ('ajouter', 'fusionner', 'ignorer', 'a_verifier')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS utilisateurs_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  foyer_id UUID REFERENCES foyers(id) ON DELETE CASCADE,
  display_name TEXT,
  alimentation TEXT[] NOT NULL DEFAULT '{}',
  ingredients_base TEXT[] NOT NULL DEFAULT ARRAY['sel', 'poivre', 'huile'],
  personnes_par_defaut INTEGER NOT NULL DEFAULT 3 CHECK (personnes_par_defaut BETWEEN 1 AND 12),
  temps_repas_defaut INTEGER NOT NULL DEFAULT 20 CHECK (temps_repas_defaut BETWEEN 5 AND 180),
  notifications BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE evenements ALTER COLUMN foyer_id SET DEFAULT current_foyer_id();
ALTER TABLE historique_produits ALTER COLUMN foyer_id SET DEFAULT current_foyer_id();
ALTER TABLE analyses_photo ALTER COLUMN foyer_id SET DEFAULT current_foyer_id();
ALTER TABLE tickets ALTER COLUMN foyer_id SET DEFAULT current_foyer_id();
ALTER TABLE utilisateurs_preferences ALTER COLUMN foyer_id SET DEFAULT current_foyer_id();

ALTER TABLE foyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE foyer_membres ENABLE ROW LEVEL SECURITY;
ALTER TABLE evenements ENABLE ROW LEVEL SECURITY;
ALTER TABLE historique_produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses_photo ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses_photo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE utilisateurs_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Accès foyer" ON foyers;
CREATE POLICY "Accès foyer" ON foyers FOR SELECT TO authenticated
  USING (id IN (SELECT current_foyer_ids()));

DROP POLICY IF EXISTS "Administration du foyer" ON foyers;
CREATE POLICY "Administration du foyer" ON foyers FOR UPDATE TO authenticated
  USING (is_foyer_admin(id))
  WITH CHECK (is_foyer_admin(id));

DROP POLICY IF EXISTS "Accès membres du foyer" ON foyer_membres;
CREATE POLICY "Accès membres du foyer" ON foyer_membres FOR SELECT TO authenticated
  USING (foyer_id IN (SELECT current_foyer_ids()));

DROP POLICY IF EXISTS "Administration des membres" ON foyer_membres;
CREATE POLICY "Administration des membres" ON foyer_membres FOR ALL TO authenticated
  USING (is_foyer_admin(foyer_id))
  WITH CHECK (is_foyer_admin(foyer_id));

DO $$
DECLARE table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'evenements', 'historique_produits', 'analyses_photo', 'analyses_photo_items',
    'tickets', 'ticket_items', 'utilisateurs_preferences'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Accès foyer authentifié" ON %I', table_name);
    IF table_name IN ('analyses_photo_items', 'ticket_items') THEN
      IF table_name = 'analyses_photo_items' THEN
        EXECUTE 'CREATE POLICY "Accès foyer authentifié" ON analyses_photo_items FOR ALL TO authenticated
          USING (analyse_id IN (SELECT id FROM analyses_photo WHERE foyer_id IN (SELECT current_foyer_ids())))
          WITH CHECK (analyse_id IN (SELECT id FROM analyses_photo WHERE foyer_id IN (SELECT current_foyer_ids())))';
      ELSE
        EXECUTE 'CREATE POLICY "Accès foyer authentifié" ON ticket_items FOR ALL TO authenticated
          USING (ticket_id IN (SELECT id FROM tickets WHERE foyer_id IN (SELECT current_foyer_ids())))
          WITH CHECK (ticket_id IN (SELECT id FROM tickets WHERE foyer_id IN (SELECT current_foyer_ids())))';
      END IF;
    ELSIF table_name = 'utilisateurs_preferences' THEN
      EXECUTE 'CREATE POLICY "Accès foyer authentifié" ON utilisateurs_preferences FOR ALL TO authenticated
        USING (user_id = auth.uid() OR foyer_id IN (SELECT current_foyer_ids()))
        WITH CHECK (user_id = auth.uid() AND foyer_id IN (SELECT current_foyer_ids()))';
    ELSE
      EXECUTE format('CREATE POLICY "Accès foyer authentifié" ON %I FOR ALL TO authenticated
        USING (foyer_id IN (SELECT current_foyer_ids()))
        WITH CHECK (foyer_id IN (SELECT current_foyer_ids()))', table_name);
    END IF;
  END LOOP;
END $$;

-- Remplace les politiques permissives existantes uniquement après le bootstrap du foyer.
DROP POLICY IF EXISTS "Accès authentifié complet" ON produits;
CREATE POLICY "Accès au stock du foyer" ON produits FOR ALL TO authenticated
  USING (foyer_id IN (SELECT current_foyer_ids()))
  WITH CHECK (foyer_id IN (SELECT current_foyer_ids()));

DROP POLICY IF EXISTS "Accès authentifié complet" ON courses;
CREATE POLICY "Accès aux courses du foyer" ON courses FOR ALL TO authenticated
  USING (foyer_id IN (SELECT current_foyer_ids()))
  WITH CHECK (foyer_id IN (SELECT current_foyer_ids()));

DROP POLICY IF EXISTS "Accès authentifié complet" ON courses_sessions;
CREATE POLICY "Accès aux sessions du foyer" ON courses_sessions FOR ALL TO authenticated
  USING (foyer_id IN (SELECT current_foyer_ids()))
  WITH CHECK (foyer_id IN (SELECT current_foyer_ids()));

DO $$
DECLARE table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'evenements', 'historique_produits', 'analyses_photo', 'analyses_photo_items',
    'tickets', 'ticket_items', 'foyer_membres'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = table_name
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', table_name);
    END IF;
  END LOOP;
END $$;

COMMIT;
