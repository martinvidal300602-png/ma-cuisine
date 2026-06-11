// src/components/Add/AddMenu.jsx
/**
 * Menu de choix du mode d'ajout : photo du frigo, code-barres ou saisie manuelle.
 */
const MODES = [
  {
    id: 'photo',
    icon: '📸',
    title: 'Photo du frigo',
    desc: 'Photographiez le frigo ou le placard, les produits sont détectés automatiquement.',
  },
  {
    id: 'barcode',
    icon: '🏷️',
    title: 'Code-barres',
    desc: "Saisissez un code-barres, la fiche est pré-remplie depuis OpenFoodFacts.",
  },
  {
    id: 'receipt',
    icon: '🧾',
    title: 'Scanner un ticket',
    desc: 'Photographiez un ticket de caisse, puis validez les produits détectés.',
  },
  {
    id: 'manual',
    icon: '✏️',
    title: 'Saisie manuelle',
    desc: 'Remplissez la fiche produit vous-même.',
  },
];

export default function AddMenu({ onSelect }) {
  return (
    <div className="space-y-3">
      {MODES.map((mode) => (
        <button
          key={mode.id}
          type="button"
          onClick={() => onSelect(mode.id)}
          className="w-full bg-card rounded-card border border-border p-4 flex items-center gap-4 text-left hover:border-accent transition-colors"
        >
          <span className="text-3xl shrink-0" aria-hidden="true">
            {mode.icon}
          </span>
          <span>
            <span className="block font-semibold text-sm">{mode.title}</span>
            <span className="block text-xs text-muted mt-0.5">{mode.desc}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
