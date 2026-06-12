-- Migration locale à exécuter manuellement dans Supabase.
-- Étend les catégories produits/courses aux produits non alimentaires du foyer.
-- Ne modifie aucune donnée existante.

ALTER TABLE produits
DROP CONSTRAINT IF EXISTS produits_categorie_check;

ALTER TABLE produits
ADD CONSTRAINT produits_categorie_check
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
  'Entretien & Ménage',
  'Hygiène & Salle de bain',
  'Papeterie & Divers maison',
  'Animaux',
  'Autre'
));

ALTER TABLE courses
DROP CONSTRAINT IF EXISTS courses_categorie_check;

ALTER TABLE courses
ADD CONSTRAINT courses_categorie_check
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
  'Entretien & Ménage',
  'Hygiène & Salle de bain',
  'Papeterie & Divers maison',
  'Animaux',
  'Autre'
));
