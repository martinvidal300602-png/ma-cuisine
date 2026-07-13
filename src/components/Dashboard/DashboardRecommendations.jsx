import { AlertCircle, Camera, ChevronRight, PackageX, ShoppingCart } from 'lucide-react';
import { calculateStockConfidence } from '../../lib/stockConfidence';
import { daysSincePhoto } from '../../lib/photoComparison';
import MealAssistant from './MealAssistant';

export default function DashboardRecommendations({ products, shopping, thisWeek, onOpenCuisine, onOpenCourses, onOpenPhoto }) {
  const remaining = shopping.items.filter((item) => !item.coche);
  const exhausted = products.filter((product) => calculateStockConfidence(product).id === 'exhausted');
  const uncertain = products.filter((product) => ['uncertain', 'verify'].includes(calculateStockConfidence(product).id));
  const photoAge = daysSincePhoto('Frigo');
  const recommendations = [
    thisWeek.length > 0 && { icon: AlertCircle, title: `${thisWeek.length} produit${thisWeek.length > 1 ? 's' : ''} à consommer cette semaine`, detail: 'Commencez par les dates les plus proches.', action: () => onOpenCuisine() },
    remaining.length > 0 && { icon: ShoppingCart, title: `${remaining.length} article${remaining.length > 1 ? 's' : ''} sur la liste`, detail: 'La liste partagée est prête.', action: onOpenCourses },
    exhausted.length > 0 && { icon: PackageX, title: `${exhausted.length} produit${exhausted.length > 1 ? 's sont' : ' est'} probablement épuisé${exhausted.length > 1 ? 's' : ''}`, detail: 'Ajoutez seulement ce qui doit être racheté.', action: onOpenCourses },
    uncertain.length > 0 && { icon: AlertCircle, title: `${uncertain.length} état${uncertain.length > 1 ? 's' : ''} de stock à vérifier`, detail: 'Une photo peut les reconfirmer.', action: onOpenPhoto },
    (photoAge === null || photoAge >= 7) && { icon: Camera, title: photoAge === null ? 'Le frigo n’a pas encore été photographié' : `Le frigo n’a pas été photographié depuis ${photoAge} jours`, detail: 'Comparez la photo au stock actuel.', action: onOpenPhoto },
  ].filter(Boolean).slice(0, 3);

  return (
    <section aria-label="Ce que l’application recommande">
      <h2 className="font-display font-bold text-base mb-2">Ce que l’app recommande</h2>
      <div className="bg-card rounded-card border border-border overflow-hidden">
        {recommendations.length === 0 && (
          <div className="p-4 text-sm text-muted">Le stock et les courses sont à jour.</div>
        )}
        {recommendations.map(({ icon: Icon, title, detail, action }, index) => (
          <button key={title} type="button" onClick={action} className={`pressable w-full px-4 py-3.5 flex items-center gap-3 text-left ${index ? 'border-t border-border' : ''}`}>
            <span className="w-9 h-9 rounded-full bg-accent-light text-accent flex items-center justify-center shrink-0"><Icon size={17} /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{title}</span><span className="block text-xs text-muted mt-0.5">{detail}</span></span>
            <ChevronRight size={15} className="text-muted" />
          </button>
        ))}
        <MealAssistant products={products} />
      </div>
    </section>
  );
}
