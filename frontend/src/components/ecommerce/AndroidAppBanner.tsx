import React, { useEffect, useState } from 'react';
import {
  ANDROID_APP_PUBLISHED,
  ANDROID_APP_URL,
  ANDROID_BANNER_DISMISS_KEY,
} from '../../config/androidApp';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_DAYS = 14;

const isAndroidPhone = () => {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent) && /Mobile/i.test(navigator.userAgent);
};

const isStandaloneApp = () => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
};

const isDismissed = () => {
  try {
    const until = Number(localStorage.getItem(ANDROID_BANNER_DISMISS_KEY) || 0);
    return until > Date.now();
  } catch {
    return false;
  }
};

export const AndroidAppBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);
  const [installError, setInstallError] = useState('');

  useEffect(() => {
    if (!isAndroidPhone() || isStandaloneApp() || isDismissed()) return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    setVisible(true);

    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(
        ANDROID_BANNER_DISMISS_KEY,
        String(Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000)
      );
    } catch {
      // no-op
    }
    setVisible(false);
    setShowHelp(false);
  };

  const handleInstall = async () => {
    setInstallError('');

    if (installPrompt) {
      setInstalling(true);
      try {
        await installPrompt.prompt();
        const choice = await installPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          dismiss();
        }
      } catch {
        setInstallError('No se pudo abrir la instalación. Usá los pasos de abajo.');
        setShowHelp(true);
      } finally {
        setInstalling(false);
        setInstallPrompt(null);
      }
      return;
    }

    if (ANDROID_APP_PUBLISHED) {
      window.open(ANDROID_APP_URL, '_blank', 'noopener,noreferrer');
      return;
    }

    setShowHelp(true);
  };

  if (!visible) return null;

  const canNativeInstall = Boolean(installPrompt);
  const title = canNativeInstall ? 'Instalá Oso Sound' : 'Usá Oso Sound en tu celular';
  const subtitle = canNativeInstall
    ? 'Agregala al inicio de tu Android, como una app.'
    : ANDROID_APP_PUBLISHED
      ? 'Descargala desde Google Play.'
      : 'Instalala desde Chrome mientras preparamos Play Store.';

  const actionLabel = installing
    ? 'Instalando…'
    : canNativeInstall
      ? 'Instalar'
      : ANDROID_APP_PUBLISHED
        ? 'Descargar'
        : 'Cómo instalar';

  return (
    <>
      <div className="sticky top-0 z-[60] border-b border-blue-300/30 bg-blue-950/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-blue-300/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
            <img src="/icons/pwa-192.png" alt="" className="w-9 h-9 object-contain" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{title}</p>
            <p className="text-xs text-blue-100/80 line-clamp-2">{subtitle}</p>
            {installError && <p className="text-xs text-amber-200 mt-1">{installError}</p>}
          </div>

          <button
            type="button"
            onClick={handleInstall}
            disabled={installing}
            className="btn-primary !py-2 !px-3 text-xs whitespace-nowrap flex-shrink-0"
          >
            {actionLabel}
          </button>

          <button
            type="button"
            onClick={dismiss}
            className="p-2 text-blue-100/70 hover:text-white flex-shrink-0"
            aria-label="Cerrar aviso de app"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {showHelp && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4 bg-black/50">
          <div className="card w-full max-w-md p-5 space-y-4 animate-slide-up">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-blue-950">Instalar Oso Sound</h3>
                <p className="text-sm text-blue-800 mt-1">
                  La app en Play Store todavía no está publicada. Podés instalarla ahora desde Chrome:
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="text-blue-700 hover:text-blue-950"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-900">
              <li>Abrí esta página en <strong>Google Chrome</strong>.</li>
              <li>Tocá el menú <strong>⋮</strong> (arriba a la derecha).</li>
              <li>Elegí <strong>Instalar app</strong> o <strong>Agregar a pantalla principal</strong>.</li>
              <li>Confirmá. El ícono quedará en tu inicio.</li>
            </ol>

            <p className="text-xs text-blue-700">
              Si no ves “Instalar app”, recargá la página y navegá unos segundos por el catálogo.
            </p>

            <button type="button" className="btn-primary w-full justify-center" onClick={() => setShowHelp(false)}>
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
