// src/App.jsx
import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useProducts } from './hooks/useProducts';
import { useShoppingList } from './hooks/useShoppingList';
import { useShoppingSession } from './hooks/useShoppingSession';
import { useAlerts } from './hooks/useAlerts';
import LoginForm from './components/Auth/LoginForm';
import BottomNav from './components/UI/BottomNav';
import Home from './pages/Home';
import AddProduct from './pages/AddProduct';
import ShoppingList from './pages/ShoppingList';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';

export default function App() {
  const { session, user, loading: authLoading, signIn, signOut } = useAuth();
  const [tab, setTab] = useState('stock');

  // Hooks produits/alertes : montés une fois la session active (composant dédié ci-dessous)
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <p className="text-muted text-sm">Chargement…</p>
      </div>
    );
  }

  if (!session) {
    return <LoginForm onSignIn={signIn} />;
  }

  return <AppConnectee user={user} signOut={signOut} tab={tab} setTab={setTab} />;
}

/**
 * Partie de l'application accessible uniquement connectée :
 * les abonnements temps réel Supabase ne sont créés qu'ici.
 */
function AppConnectee({ user, signOut, tab, setTab }) {
  const { products, loading, error, addProduct, addProducts, updateProduct, deleteProduct } =
    useProducts();
  const shopping = useShoppingList();
  const shoppingSession = useShoppingSession();
  const { perimes, expirentBientot, cetteSemaine, alertCount } = useAlerts(products);

  return (
    <div className="min-h-screen bg-bg">
      <main className="max-w-app mx-auto px-4 pt-5 pb-20">
        {tab === 'stock' && (
          <Home
            products={products}
            loading={loading}
            error={error}
            updateProduct={updateProduct}
            deleteProduct={deleteProduct}
            addShoppingItem={(item) => shopping.addItem({ ...item, ajoute_par: user?.email ?? null })}
          />
        )}
        {tab === 'ajouter' && (
          <AddProduct
            addProduct={addProduct}
            addProducts={addProducts}
            products={products}
            updateProduct={updateProduct}
            shopping={shopping}
            shoppingSession={shoppingSession}
            userEmail={user?.email}
          />
        )}
        {tab === 'alertes' && (
          <Alerts
            perimes={perimes}
            expirentBientot={expirentBientot}
            cetteSemaine={cetteSemaine}
            loading={loading}
          />
        )}
        {tab === 'courses' && (
          <ShoppingList
            shopping={shopping}
            session={shoppingSession}
            userEmail={user?.email}
          />
        )}
        {tab === 'reglages' && <Settings userEmail={user?.email} onSignOut={signOut} />}
      </main>

      <BottomNav active={tab} onChange={setTab} alertCount={alertCount} />
    </div>
  );
}
