import React, { useState, useEffect } from 'react';

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);
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

    // Detectar sistema operativo
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;
    const isAndroidDevice = /android/.test(userAgent);

    setIsIos(isIosDevice);
    setIsAndroid(isAndroidDevice);

    // En móviles (iOS o Android) habilitamos la opción de instalación
    if (isIosDevice || isAndroidDevice) {
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

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice?.outcome === 'accepted') {
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
      return;
    }

    // Si no está disponible el evento nativo automático (p.ej. ya se interactuó o navegador alterno)
    setShowAndroidGuide(true);
  };

  return (
    <>
      <div className="pwa-install-wrapper">
        <button
          type="button"
          onClick={handleInstallClick}
          className="pwa-install-badge-btn"
          title="Instalar como aplicación en tu pantalla de inicio"
          aria-label="Instalar Examen WKF como aplicación"
        >
          <span className="pwa-install-icon" aria-hidden="true">📲</span>
          <span>Instalar App Oficial</span>
        </button>
      </div>

      {/* Modal explicativo para dispositivos Android (Galaxy S26 Ultra, Xiaomi, etc.) */}
      {showAndroidGuide && (
        <div className="pwa-ios-modal-overlay" onClick={() => setShowAndroidGuide(false)} role="dialog" aria-modal="true">
          <div className="pwa-ios-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
              <img
                src="/app-icon.png"
                width="64"
                height="64"
                style={{ borderRadius: '16px', boxShadow: '0 6px 16px rgba(0,0,0,0.15)' }}
                alt="Icono Examen WKF"
              />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b', marginBottom: '8px', textAlign: 'center' }}>
              Instalar Examen WKF en tu Celular
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', textAlign: 'center', marginBottom: '16px' }}>
              Instala la aplicación para abrirla a pantalla completa y practicar incluso sin conexión a internet:
            </p>
            <div className="pwa-ios-steps">
              <div className="pwa-ios-step">
                <span className="pwa-step-num">1</span>
                <span>Toca el menú de opciones (tres puntos <strong>⋮</strong>) en la esquina superior de tu navegador (Chrome o Samsung Internet).</span>
              </div>
              <div className="pwa-ios-step">
                <span className="pwa-step-num">2</span>
                <span>Selecciona la opción <strong>"Instalar aplicación"</strong> o <strong>"Agregar a pantalla principal"</strong> 📲.</span>
              </div>
              <div className="pwa-ios-step">
                <span className="pwa-step-num">3</span>
                <span>Toca <strong>"Instalar"</strong>. ¡El icono oficial del tatami aparecerá en tu teléfono!</span>
              </div>
            </div>
            <button
              type="button"
              className="btn-3d btn-blue"
              style={{ width: '100%', marginTop: '18px' }}
              onClick={() => setShowAndroidGuide(false)}
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}

      {/* Modal explicativo para dispositivos iOS (iPhone / iPad) */}
      {showIosGuide && (
        <div className="pwa-ios-modal-overlay" onClick={() => setShowIosGuide(false)} role="dialog" aria-modal="true">
          <div className="pwa-ios-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
              <img
                src="/app-icon.png"
                width="64"
                height="64"
                style={{ borderRadius: '16px', boxShadow: '0 6px 16px rgba(0,0,0,0.15)' }}
                alt="Icono Examen WKF"
              />
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
                <span>Toca el botón <strong>Compartir</strong> (icono de cuadrado con flecha hacia arriba ⎋) en la barra de Safari.</span>
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
              style={{ width: '100%', marginTop: '18px' }}
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
