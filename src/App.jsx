import { lazy, Suspense, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useProducts } from './hooks/useProducts';
import { useShoppingList } from './hooks/useShoppingList';
import { useShoppingSession } from './hooks/useShoppingSession';
import { useAlerts } from './hooks/useAlerts';
import { useActivityFeed } from './hooks/useActivityFeed';
import LoginForm from './components/Auth/LoginForm';
import TabBar from './components/UI/TabBar';
import ScanHub from './components/Scan/ScanHub';
import ScreenLoader from './components/UI/ScreenLoader';
import Today from './pages/Today';
import { normaliserNomCourses } from './lib/matchShoppingItems';

const Cuisine = lazy(() => import('./pages/Cuisine'));
const Courses = lazy(() => import('./pages/Courses'));
const Activity = lazy(() => import('./pages/Activity'));
const Settings = lazy(() => import('./pages/Settings'));
const AddFlow = lazy(() => import('./components/Scan/AddFlow'));

const MAIN_TABS = new Set(['aujourdhui', 'cuisine', 'courses', 'activite']);

function initialTab() {
  const requested = new URLSearchParams(window.location.search).get('tab');
  return MAIN_TABS.has(requested) ? requested : 'aujourdhui';
}

function initialScan() {
  return new URLSearchParams(window.location.search).get('action') === 'scan' ? 'hub' : null;
}

export default function App() {
  const { session, user, loading: authLoading, signIn, signOut } = useAuth();
  const [tab, setTab] = useState(initialTab);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg px-6">
        <div className="w-full max-w-app"><ScreenLoader label="Ouverture de Ma Cuisine" /></div>
      </div>
    );
  }

  if (!session) return <LoginForm onSignIn={signIn} />;

  return <ConnectedApp user={user} signOut={signOut} tab={tab} setTab={setTab} />;
}

function ConnectedApp({ user, signOut, tab, setTab }) {
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
  const activity = useActivityFeed({
    products,
    productsLoading: loading,
    shoppingItems: shopping.items,
    shoppingLoading: shopping.loading,
    sessions: shoppingSession.sessions,
    sessionsLoading: shoppingSession.loading,
  });

  const [scan, setScan] = useState(initialScan);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cuisineTarget, setCuisineTarget] = useState(null);

  const addShoppingItem = async (item) => {
    const incomingName = normaliserNomCourses(item.nom);
    const exists = shopping.items.find((shoppingItem) => {
      const existingName = normaliserNomCourses(shoppingItem.nom);
      return existingName && incomingName && (
        existingName === incomingName || existingName.includes(incomingName) || incomingName.includes(existingName)
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

  const commonHeaderProps = {
    userEmail: user?.email,
    onOpenSettings: () => setSettingsOpen(true),
  };

  return (
    <div className="min-h-screen bg-bg">
      <main className="max-w-app mx-auto px-4 native-header pb-28">
        <Suspense fallback={<ScreenLoader label="Chargement de l’écran" />}>
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
              {...commonHeaderProps}
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
              {...commonHeaderProps}
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
              {...commonHeaderProps}
            />
          )}
          {tab === 'activite' && (
            <Activity events={activity.events} onClear={activity.clear} {...commonHeaderProps} />
          )}
        </Suspense>
      </main>

      <TabBar active={tab} onChange={setTab} onScan={() => setScan('hub')} alertCount={alertCount} />

      {scan === 'hub' && <ScanHub onSelect={setScan} onClose={() => setScan(null)} />}
      {scan && scan !== 'hub' && (
        <Suspense fallback={<FullScreenLoader label="Préparation du scanner" />}>
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

      {settingsOpen && (
        <div className="fixed inset-0 z-50 bg-bg overflow-y-auto view-rise">
          <div className="max-w-app mx-auto px-4 native-header pb-10">
            <Suspense fallback={<ScreenLoader label="Chargement des réglages" />}>
              <Settings userEmail={user?.email} onSignOut={signOut} onClose={() => setSettingsOpen(false)} />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}

function FullScreenLoader({ label }) {
  return (
    <div className="fixed inset-0 z-50 bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-app"><ScreenLoader label={label} /></div>
    </div>
  );
}
