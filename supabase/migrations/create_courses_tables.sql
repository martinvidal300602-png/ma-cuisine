-- Migration locale à exécuter manuellement dans Supabase.
-- Crée le module Courses partagé en temps réel.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  marque TEXT,
  categorie TEXT NOT NULL DEFAULT 'Autre'
    CHECK (categorie IN (
      'Viandes & Poissons',
      'Légumes & Fruits',
      'Produits laitiers',
      'Conserves & Épicerie',
      'Surgelés',
      'Céréales & Pâtes',
      'Condiments & Sauces',
      'Boissons',
      'Boulangerie',
      'Autre'
    )),
  quantite REAL NOT NULL DEFAULT 1,
  unite TEXT NOT NULL DEFAULT 'unité',
  priorite TEXT NOT NULL DEFAULT 'normale'
    CHECK (priorite IN ('basse', 'normale', 'haute')),
  coche BOOLEAN NOT NULL DEFAULT false,
  source TEXT NOT NULL DEFAULT 'manuel'
    CHECK (source IN (
      'manuel',
      'stock',
      'stock_bas',
      'produit_expire',
      'produit_bientot_expire',
      'recette',
      'ticket'
    )),
  ajoute_par TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS courses_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  active BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'finished', 'cancelled')),
  started_by TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  notes TEXT
);

CREATE OR REPLACE FUNCTION update_courses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS courses_updated_at_trigger ON courses;
CREATE TRIGGER courses_updated_at_trigger
BEFORE UPDATE ON courses
FOR EACH ROW
EXECUTE FUNCTION update_courses_updated_at();

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Accès authentifié complet" ON courses;
CREATE POLICY "Accès authentifié complet"
ON courses
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Accès authentifié complet" ON courses_sessions;
CREATE POLICY "Accès authentifié complet"
ON courses_sessions
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'courses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE courses;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'courses_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE courses_sessions;
  END IF;
END $$;
