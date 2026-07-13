// src/App.jsx
import { lazy, Suspense, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useProducts } from './hooks/useProducts';
import { useShoppingList } from './hooks/useShoppingList';
import { useShoppingSession } from './hooks/useShoppingSession';
import { useAlerts } from './hooks/useAlerts';
import LoginForm from './components/Auth/LoginForm';
import TabBar from './components/UI/TabBar';
import ScanHub from './components/Scan/ScanHub';
import Today from './pages/Today';
import Cuisine from './pages/Cuisine';
import Courses from './pages/Courses';
import Settings from './pages/Settings';
import { normaliserNomCourses } from './lib/matchShoppingItems';

const AddFlow = lazy(() => import('./components/Scan/AddFlow'));

export default function App() {
  const { session, user, loading: authLoading, signIn, signOut } = useAuth();
  const [tab, setTab] = useState('aujourdhui');

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
 * Partie connectée : hooks temps réel montés une seule fois,
 * navigation 4 onglets + hub de scan central.
 */
function AppConnectee({ user, signOut, tab, setTab }) {
  const {
    products,
    loading,
    error,
    addProduct,
    addProducts,
    updateProduct,
    updateProductQuantity,
    decrementProduct,
    consumeProduct,
    deleteProduct,
  } = useProducts();
  const shopping = useShoppingList();
  const shoppingSession = useShoppingSession();
  const { perimes, expirentBientot, cetteSemaine, alertCount } = useAlerts(products);

  // null | 'hub' | 'photo' | 'barcode' | 'receipt' | 'manual'
  const [scan, setScan] = useState(null);
  // Emplacement à ouvrir directement dans l'onglet Cuisine
  const [cuisineTarget, setCuisineTarget] = useState(null);

  const addShoppingItem = async (item) => {
    const incomingName = normaliserNomCourses(item.nom);
    const exists = shopping.items.find((shoppingItem) => {
      const existingName = normaliserNomCourses(shoppingItem.nom);
      return (
        existingName &&
        incomingName &&
        (existingName === incomingName ||
          existingName.includes(incomingName) ||
          incomingName.includes(existingName))
      );
    });

    if (exists) return exists;
    return shopping.addItem({ ...item, ajoute_par: user?.email ?? null });
  };

  const openCuisine = (emplacement = null) => {
    setCuisineTarget(emplacement);
    setTab('cuisine');
  };

  const productActions = {
    updateProduct,
    updateProductQuantity,
    decrementProduct,
    consumeProduct,
    deleteProduct,
    addShoppingItem,
  };

  return (
    <div className="min-h-screen bg-bg">
      <main className="max-w-app mx-auto px-4 pt-5 pb-28">
        {tab === 'aujourdhui' && (
          <Today
            products={products}
            loading={loading}
            error={error}
            perimes={perimes}
            expirentBientot={expirentBientot}
            cetteSemaine={cetteSemaine}
            shopping={shopping}
            shoppingSession={shoppingSession}
            actions={productActions}
            onOpenScan={(mode) => setScan(mode ?? 'hub')}
            onOpenCuisine={openCuisine}
            onOpenCourses={() => setTab('courses')}
          />
        )}
        {tab === 'cuisine' && (
          <Cuisine
            products={products}
            loading={loading}
            error={error}
            actions={productActions}
            initialEmplacement={cuisineTarget}
            onConsumeTarget={() => setCuisineTarget(null)}
            onOpenScan={() => setScan('hub')}
          />
        )}
        {tab === 'courses' && (
          <Courses
            products={products}
            shopping={shopping}
            session={shoppingSession}
            userEmail={user?.email}
            addShoppingItem={addShoppingItem}
            onScanReceipt={() => setScan('receipt')}
          />
        )}
        {tab === 'reglages' && <Settings userEmail={user?.email} onSignOut={signOut} />}
      </main>

      <TabBar active={tab} onChange={setTab} onScan={() => setScan('hub')} alertCount={alertCount} />

      {scan === 'hub' && <ScanHub onSelect={(mode) => setScan(mode)} onClose={() => setScan(null)} />}
      {scan && scan !== 'hub' && (
        <Suspense fallback={<AddFlowLoading />}>
          <AddFlow
            mode={scan}
            onClose={() => setScan(null)}
            addProducts={addProducts}
            addProduct={addProduct}
            products={products}
            updateProduct={updateProduct}
            shopping={shopping}
            shoppingSession={shoppingSession}
            userEmail={user?.email}
          />
        </Suspense>
      )}
    </div>
  );
}


function AddFlowLoading() {
  return (
    <div className="fixed inset-0 z-50 bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-app space-y-3" aria-label="Chargement du scanner">
        <div className="skeleton h-16" />
        <div className="skeleton h-56" />
      </div>
    </div>
  );
}
