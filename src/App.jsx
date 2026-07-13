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
import OfflineBanner from './components/System/OfflineBanner';
import UndoToast from './components/System/UndoToast';
import { useUndoManager } from './hooks/useUndoManager';
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
  const undoManager = useUndoManager();
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

  const sessionWithUndo = {
    ...shoppingSession,
    startSession: async (startedBy) => {
      const wasActive = shoppingSession.activeSession;
      const started = await shoppingSession.startSession(startedBy);
      if (!wasActive && started?.id) {
        undoManager.offer('Courses commencées', () => shoppingSession.restoreSession(started.id, {
          active: false,
          status: 'cancelled',
          ended_at: new Date().toISOString(),
        }));
      }
      return started;
    },
    finishSession: async () => {
      const before = shoppingSession.activeSession;
      await shoppingSession.finishSession();
      if (before) undoManager.offer('Courses terminées', () => shoppingSession.restoreSession(before.id, {
        active: true,
        status: 'active',
        ended_at: null,
      }));
    },
    cancelSession: async () => {
      const before = shoppingSession.activeSession;
      await shoppingSession.cancelSession();
      if (before) undoManager.offer('Courses annulées', () => shoppingSession.restoreSession(before.id, {
        active: true,
        status: 'active',
        ended_at: null,
      }));
    },
  };

  const shoppingWithUndo = {
    ...shopping,
    addItem: async (item) => {
      const added = await shopping.addItem(item);
      if (added?.id) undoManager.offer(`${added.nom} ajouté aux courses`, () => shopping.deleteItem(added.id));
      return added;
    },
    updateItem: async (id, fields) => {
      const before = shopping.items.find((item) => item.id === id);
      await shopping.updateItem(id, fields);
      if (before) {
        const previousFields = Object.fromEntries(Object.keys(fields).map((key) => [key, before[key]]));
        undoManager.offer(`${before.nom} modifié`, () => shopping.updateItem(id, previousFields));
      }
    },
    deleteItem: async (id) => {
      const before = shopping.items.find((item) => item.id === id);
      await shopping.deleteItem(id);
      if (before) undoManager.offer(`${before.nom} retiré des courses`, () => shopping.addItem(before));
    },
    deleteItems: async (ids) => {
      const before = shopping.items.filter((item) => ids.includes(item.id));
      await shopping.deleteItems(ids);
      if (before.length) undoManager.offer(`${before.length} article${before.length > 1 ? 's' : ''} retiré${before.length > 1 ? 's' : ''}`, () => Promise.all(before.map((item) => shopping.addItem(item))));
    },
    clearChecked: async () => {
      const before = shopping.items.filter((item) => item.coche);
      await shopping.clearChecked();
      if (before.length) undoManager.offer(`${before.length} article${before.length > 1 ? 's' : ''} retiré${before.length > 1 ? 's' : ''}`, () => Promise.all(before.map((item) => shopping.addItem(item))));
    },
  };

  const addShoppingItem = async (item) => {
    const incomingName = normaliserNomCourses(item.nom);
    const exists = shopping.items.find((shoppingItem) => {
      const existingName = normaliserNomCourses(shoppingItem.nom);
      return existingName && incomingName && (
        existingName === incomingName || existingName.includes(incomingName) || incomingName.includes(existingName)
      );
    });

    if (exists) return exists;
    return shoppingWithUndo.addItem({ ...item, ajoute_par: user?.email ?? null });
  };

  const openCuisine = (emplacement = null) => {
    setCuisineTarget(emplacement);
    setTab('cuisine');
  };

  const productActions = {
    updateProduct: async (id, fields) => {
      const before = products.find((product) => product.id === id);
      await updateProduct(id, fields);
      if (before) {
        const previousFields = Object.fromEntries(Object.keys(fields).map((key) => [key, before[key]]));
        undoManager.offer(`${before.nom} modifié`, () => updateProduct(id, previousFields));
      }
    },
    updateProductQuantity: async (id, quantity, options) => {
      const before = products.find((product) => product.id === id);
      const result = await updateProductQuantity(id, quantity, options);
      if (before) undoManager.offer(`Quantité de ${before.nom} modifiée`, () => updateProductQuantity(id, before.quantite, options));
      return result;
    },
    decrementProduct: async (id, amount) => {
      const before = products.find((product) => product.id === id);
      const result = await decrementProduct(id, amount);
      if (before) undoManager.offer(`${before.nom} consommé`, () => updateProductQuantity(id, before.quantite));
      return result;
    },
    consumeProduct: async (product, options) => {
      const result = await consumeProduct(product, options);
      if (!result?.needsConfirmation) undoManager.offer(`${product.nom} consommé`, () => updateProductQuantity(product.id, result.previousQuantity));
      return result;
    },
    deleteProduct: async (id) => {
      const before = products.find((product) => product.id === id);
      await deleteProduct(id);
      if (before) undoManager.offer(`${before.nom} supprimé du stock`, () => addProduct(before));
    },
    addShoppingItem,
  };

  const addProductsWithUndo = async (list, options) => {
    const inserted = await addProducts(list, options);
    if (inserted?.length) undoManager.offer(`${inserted.length} produit${inserted.length > 1 ? 's' : ''} ajouté${inserted.length > 1 ? 's' : ''}`, () => Promise.all(inserted.map((product) => deleteProduct(product.id))));
    return inserted;
  };

  const commonHeaderProps = {
    userEmail: user?.email,
    onOpenSettings: () => setSettingsOpen(true),
  };

  return (
    <div className="min-h-screen bg-bg">
      <OfflineBanner online={shopping.online} pending={shopping.offlinePending} syncing={shopping.syncing} onSync={shopping.syncPending} />
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
              shopping={shoppingWithUndo}
              shoppingSession={sessionWithUndo}
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
              shopping={shoppingWithUndo}
              session={sessionWithUndo}
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
            addProducts={addProductsWithUndo}
            addProduct={addProduct}
            products={products}
            updateProduct={productActions.updateProduct}
            shopping={shoppingWithUndo}
            shoppingSession={sessionWithUndo}
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
      <UndoToast entry={undoManager.entry} onUndo={undoManager.undo} onClose={undoManager.clear} />
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
