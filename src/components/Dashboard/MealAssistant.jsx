import { useMemo, useState } from 'react';
import { ChefHat, Clock3, Users } from 'lucide-react';
import Sheet from '../UI/Sheet';
import { BASE_INGREDIENTS, suggestMeals } from '../../lib/mealSuggestions';

export default function MealAssistant({ products }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('waste');
  const [maxMinutes, setMaxMinutes] = useState(20);
  const [people, setPeople] = useState(3);
  const [vegetarian, setVegetarian] = useState(false);
  const meals = useMemo(
    () => suggestMeals(products, { mode, maxMinutes, people, vegetarian }),
    [maxMinutes, mode, people, products, vegetarian],
  );

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="pressable w-full px-4 py-3.5 flex items-center gap-3 text-left border-t border-border">
        <span className="w-9 h-9 rounded-full bg-accent-light text-accent flex items-center justify-center shrink-0"><ChefHat size={17} /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">Qu’est-ce qu’on mange ?</span>
          <span className="block text-xs text-muted">Des idées basées uniquement sur le stock réel.</span>
        </span>
      </button>

      {open && (
        <Sheet title="Ce soir" onClose={() => setOpen(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Mode de suggestion">
              <ModeButton active={mode === 'waste'} onClick={() => setMode('waste')}>Anti-gaspillage</ModeButton>
              <ModeButton active={mode === 'quick'} onClick={() => setMode('quick')}>Rapide</ModeButton>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="bg-card border border-border rounded-card p-3">
                <span className="text-xs text-muted flex items-center gap-1"><Clock3 size={13} /> Temps maximum</span>
                <select value={maxMinutes} onChange={(event) => setMaxMinutes(Number(event.target.value))} className="w-full mt-1 bg-transparent font-semibold">
                  <option value="10">10 minutes</option><option value="20">20 minutes</option><option value="30">30 minutes</option>
                </select>
              </label>
              <label className="bg-card border border-border rounded-card p-3">
                <span className="text-xs text-muted flex items-center gap-1"><Users size={13} /> Personnes</span>
                <select value={people} onChange={(event) => setPeople(Number(event.target.value))} className="w-full mt-1 bg-transparent font-semibold">
                  {[1, 2, 3, 4, 5, 6].map((count) => <option key={count} value={count}>{count}</option>)}
                </select>
              </label>
            </div>
            <label className="flex items-center gap-3 bg-card border border-border rounded-card p-3 text-sm font-medium">
              <input type="checkbox" checked={vegetarian} onChange={(event) => setVegetarian(event.target.checked)} className="w-5 h-5 accent-[var(--color-accent)]" />
              Mode végétarien
            </label>

            {meals.length === 0 ? (
              <div className="bg-card border border-border rounded-card p-4 text-sm text-muted">
                Pas assez de produits compatibles pour proposer un repas fiable. L’app ne complète pas avec des ingrédients absents.
              </div>
            ) : meals.map((meal, index) => (
              <article key={meal.name} className="bg-card border border-border rounded-card p-4">
                <p className="text-xs font-semibold text-accent">{index + 1}</p>
                <h3 className="font-semibold mt-0.5">{meal.name}</h3>
                <p className="text-sm text-muted mt-2"><strong className="text-text">Utilise :</strong> {meal.products.join(', ')}</p>
                <p className="text-xs text-muted mt-1">{meal.minutes} min · {meal.people} personne{meal.people > 1 ? 's' : ''} · {meal.method}</p>
              </article>
            ))}
            <p className="text-xs text-muted">Ingrédients de base tolérés : {BASE_INGREDIENTS.join(', ')}.</p>
          </div>
        </Sheet>
      )}
    </>
  );
}

function ModeButton({ active, onClick, children }) {
  return <button type="button" onClick={onClick} className={`pressable min-h-11 rounded-card text-sm font-semibold border ${active ? 'bg-accent text-white border-accent' : 'bg-card border-border'}`}>{children}</button>;
}
