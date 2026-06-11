-- ============================================================
-- Schema Supabase - ma-cuisine
-- Table principale : produits
-- Emplacements officiels :
--   - Frigo
--   - Placard sous fenêtre
--   - Plan de travail
--   - Placard épices
-- ============================================================

DROP TABLE IF EXISTS produits CASCADE;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE produits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  nom TEXT NOT NULL,
  marque TEXT,

  categorie TEXT NOT NULL DEFAULT 'Autre'
  CONSTRAINT produits_categorie_check CHECK (
    categorie IN (
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
    )
  ),

  emplacement TEXT NOT NULL
  CONSTRAINT produits_emplacement_check CHECK (
    emplacement IN (
      'Frigo',
      'Placard sous fenêtre',
      'Plan de travail',
      'Placard épices'
    )
  ),

  quantite REAL NOT NULL DEFAULT 1,
  unite TEXT NOT NULL DEFAULT 'unité',

  date_expiration DATE,
  photo_url TEXT,
  code_barres TEXT,

  ajoute_par TEXT,
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX produits_nom_idx ON produits (nom);
CREATE INDEX produits_categorie_idx ON produits (categorie);
CREATE INDEX produits_emplacement_idx ON produits (emplacement);
CREATE INDEX produits_date_expiration_idx ON produits (date_expiration);
CREATE INDEX produits_ajoute_par_idx ON produits (ajoute_par);

CREATE OR REPLACE FUNCTION update_produits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER produits_updated_at_trigger
BEFORE UPDATE ON produits
FOR EACH ROW
EXECUTE FUNCTION update_produits_updated_at();

ALTER TABLE produits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Accès authentifié complet" ON produits;

CREATE POLICY "Accès authentifié complet"
ON produits
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'produits'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE produits;
  END IF;
END $$;

-- Test facultatif :
-- INSERT INTO produits (
--   nom,
--   marque,
--   categorie,
--   emplacement,
--   quantite,
--   unite,
--   ajoute_par
-- )
-- VALUES (
--   'Citronnade',
--   'Pulco',
--   'Boissons',
--   'Frigo',
--   1,
--   'bouteille',
--   'martinvidal16@hotmail.fr'
-- );
