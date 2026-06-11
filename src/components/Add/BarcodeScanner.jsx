import { useState, useRef, useCallback, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import Button from '../UI/Button';
import ManualForm from './ManualForm';
import { chercherParCodeBarres } from '../../lib/openfoodfacts';

const reader = new BrowserMultiFormatReader(undefined, {
  delayBetweenScanAttempts: 300,
});

export default function BarcodeScanner({ onSubmit }) {
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [prefill, setPrefill] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const videoRef = useRef(null);
  const controlsRef = useRef(null);

  const handleSearch = useCallback(
    async (code) => {
      const value = code ?? barcode;
      if (!value.trim()) return;
      setError(null);
      setNotFound(false);
      setPrefill(null);
      setLoading(true);
      try {
        const result = await chercherParCodeBarres(value.trim());
        if (!result) {
          setNotFound(true);
        } else {
          setPrefill(result);
        }
      } catch (err) {
        setError(err.message || 'Recherche impossible.');
      } finally {
        setLoading(false);
      }
    },
    [barcode],
  );

  const stopCamera = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setScanning(false);
  }, []);

  useEffect(() => {
    if (!scanning) return;

    let cancelled = false;

    (async () => {
      try {
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result, _err, ctrl) => {
            if (result && !cancelled) {
              const code = result.getText();
              setBarcode(code);
              ctrl.stop();
              controlsRef.current = null;
              setScanning(false);
              handleSearch(code);
            }
          },
        );
        if (cancelled) {
          controls.stop();
        } else {
          controlsRef.current = controls;
        }
      } catch (err) {
        if (cancelled) return;
        setScanning(false);
        setCameraError(
          err.name === 'NotAllowedError'
            ? "L'accès à la caméra a été refusé."
            : err.name === 'NotFoundError'
              ? 'Aucune caméra détectée.'
              : `Impossible d'accéder à la caméra : ${err.message}`,
        );
      }
    })();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [scanning, handleSearch]);

  const startCamera = useCallback(() => {
    setCameraError(null);
    setError(null);
    setNotFound(false);
    setPrefill(null);
    setScanning(true);
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-card border border-border p-4 space-y-3">
        {/* Video element — always in the DOM so the ref is stable for Safari iOS */}
        <div
          className={`relative w-full bg-black rounded-card overflow-hidden ${scanning ? 'aspect-[4/3]' : 'hidden'}`}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {scanning && (
            <>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className="w-3/4 h-1/2 border-2 border-white/70 rounded-lg"
                  style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)' }}
                />
              </div>
              <p className="absolute bottom-3 left-0 right-0 text-center text-white/80 text-xs">
                Placez le code-barres dans le cadre
              </p>
            </>
          )}
        </div>

        {scanning ? (
          <Button variant="secondary" size="lg" onClick={stopCamera}>
            Annuler le scan
          </Button>
        ) : (
          <>
            <Button variant="secondary" size="lg" onClick={startCamera}>
              Scanner avec la caméra
            </Button>

            {cameraError && (
              <p role="alert" className="text-danger text-sm">
                {cameraError}
              </p>
            )}

            <div className="relative flex items-center gap-3 text-xs text-text/50">
              <span className="flex-1 border-t border-border" />
              <span>ou saisie manuelle</span>
              <span className="flex-1 border-t border-border" />
            </div>

            <label className="block">
              <span className="block text-sm font-medium mb-1">Code-barres</span>
              <input
                type="text"
                inputMode="numeric"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Ex. 3017620422003"
                className="w-full px-3 py-2.5 rounded-card border border-border bg-bg text-sm font-num"
              />
            </label>
            <Button size="lg" onClick={() => handleSearch()} disabled={loading || !barcode.trim()}>
              {loading ? 'Recherche…' : 'Chercher'}
            </Button>
          </>
        )}

        {error && (
          <p role="alert" className="text-danger text-sm">
            {error}
          </p>
        )}
        {notFound && (
          <p role="status" className="text-warn text-sm">
            Produit introuvable sur OpenFoodFacts. Vous pouvez le saisir manuellement ci-dessous.
          </p>
        )}
      </div>

      {(prefill || notFound) && (
        <div className="bg-card rounded-card border border-border p-4">
          {prefill?.photo_url && (
            <img
              src={prefill.photo_url}
              alt={prefill.nom || 'Photo du produit'}
              className="w-20 h-20 object-contain rounded-card border border-border mb-3 mx-auto bg-white"
            />
          )}
          <ManualForm
            key={prefill?.code_barres ?? 'manuel'}
            initial={
              prefill
                ? {
                    nom: prefill.nom,
                    marque: prefill.marque ?? '',
                    categorie: prefill.categorie,
                    photo_url: prefill.photo_url,
                    code_barres: prefill.code_barres,
                  }
                : { code_barres: barcode.trim() || null }
            }
            onSubmit={onSubmit}
          />
        </div>
      )}
    </div>
  );
}
