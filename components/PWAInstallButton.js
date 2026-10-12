import React, { useState, useEffect } from 'react';

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Verificar si ya está ejecutándose como app instalada (standalone)
    const isRunningStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isRunningStandalone) {
      setIsStandalone(true);
      return;
    }

    // Detectar iOS / Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;
    setIsIos(isIosDevice);

    if (isIosDevice) {
      setIsInstallable(true);
    }

    // Escuchar el evento nativo de instalación en Chrome / Edge / Android
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Cuando el usuario acepta o completa la instalación
    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (isStandalone || !isInstallable) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (!deferredPrompt) {
      alert('Para instalar la aplicación:\nEn tu navegador (Chrome o Edge), presiona el menú de opciones (⋮) o el icono de instalación en la barra de direcciones y selecciona "Instalar Examen WKF".');
      return;
    }

    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className="pwa-install-badge-btn"
        title="Instalar como aplicación en tu pantalla de inicio"
      >
        <span className="pwa-install-icon">📲</span>
        <span>Instalar App</span>
      </button>

      {/* Modal explicativo para dispositivos iOS (iPhone / iPad) */}
      {showIosGuide && (
        <div className="pwa-ios-modal-overlay" onClick={() => setShowIosGuide(false)}>
          <div className="pwa-ios-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              <img src="/app-icon.png" width="64" height="64" style={{ borderRadius: '16px' }} alt="Icono WKF" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b', marginBottom: '8px', textAlign: 'center' }}>
              Instalar Examen WKF en tu iPhone / iPad
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', textAlign: 'center', marginBottom: '16px' }}>
              Para tener el icono en tu pantalla de inicio y practicar en modo offline:
            </p>
            <div className="pwa-ios-steps">
              <div className="pwa-ios-step">
                <span className="pwa-step-num">1</span>
                <span>Toca el botón <strong>Compartir</strong> (cuadrado con flecha hacia arriba ⎋) en la barra de Safari.</span>
              </div>
              <div className="pwa-ios-step">
                <span className="pwa-step-num">2</span>
                <span>Desplázate hacia abajo y presiona <strong>"Agregar a pantalla de inicio"</strong> ➕.</span>
              </div>
              <div className="pwa-ios-step">
                <span className="pwa-step-num">3</span>
                <span>Toca <strong>"Agregar"</strong> en la esquina superior derecha.</span>
              </div>
            </div>
            <button
              type="button"
              className="btn-3d btn-blue"
              style={{ width: '100%', marginTop: '16px' }}
              onClick={() => setShowIosGuide(false)}
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
