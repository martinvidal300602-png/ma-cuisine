-- supabase_schema.sql — à exécuter dans l'éditeur SQL de Supabase

CREATE TABLE produits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom             TEXT NOT NULL,
  marque          TEXT,
  categorie       TEXT CHECK (categorie IN (
                    'Viandes & Poissons', 'Légumes & Fruits',
                    'Produits laitiers', 'Conserves & Épicerie',
                    'Surgelés', 'Céréales & Pâtes',
                    'Condiments & Sauces', 'Boissons', 'Boulangerie', 'Autre'
                  )),
  emplacement     TEXT CHECK (emplacement IN (
                    'Frigo', 'Placard sous fenêtre', 'Plan de travail', 'Placard épices'
                  )),
  quantite        REAL NOT NULL DEFAULT 1,
  unite           TEXT DEFAULT 'unité(s)',
  date_expiration DATE,
  photo_url       TEXT,
  code_barres     TEXT,
  ajoute_par      TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE produits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Accès authentifié complet" ON produits FOR ALL USING (auth.role() = 'authenticated');

-- Activer le temps réel sur la table
ALTER PUBLICATION supabase_realtime ADD TABLE produits;
