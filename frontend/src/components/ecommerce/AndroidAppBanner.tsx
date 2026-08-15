import React, { useEffect, useState } from 'react';
import {
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
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (!isAndroidPhone() || isStandaloneApp() || isDismissed()) return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
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
  };

  const handleInstall = async () => {
    if (installPrompt) {
      setInstalling(true);
      try {
        await installPrompt.prompt();
        await installPrompt.userChoice;
      } catch {
        // no-op
      } finally {
        setInstalling(false);
        setInstallPrompt(null);
      }
      return;
    }

    window.open(ANDROID_APP_URL, '_blank', 'noopener,noreferrer');
  };

  if (!visible) return null;

  const usePwaInstall = Boolean(installPrompt);
  const title = usePwaInstall ? 'Instalá Oso Sound' : 'Descargá la app de Oso Sound';
  const subtitle = usePwaInstall
    ? 'Agregala a tu celular para acceder más rápido, como una app nativa.'
    : 'Disponible en Google Play para Android.';

  return (
    <div className="sticky top-0 z-[60] border-b border-blue-300/30 bg-blue-950/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 border border-blue-300/30 flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85a.637.637 0 00-.85.26l-1.86 3.22a11.4 11.4 0 00-8.94 0L5.97 5.71a.643.643 0 00-.86-.26c-.3.16-.42.54-.26.85l1.84 3.18C3.49 11.48 1.5 15.33 1.5 19.5h21c0-4.17-1.99-8.02-4.9-10.02zM7 17.25c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25zm10 0c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z" />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white truncate">{title}</p>
          <p className="text-xs text-blue-100/80 line-clamp-2">{subtitle}</p>
        </div>

        <button
          type="button"
          onClick={handleInstall}
          disabled={installing}
          className="btn-primary !py-2 !px-3 text-xs whitespace-nowrap flex-shrink-0"
        >
          {installing ? 'Instalando…' : usePwaInstall ? 'Instalar' : 'Descargar'}
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
  );
};
