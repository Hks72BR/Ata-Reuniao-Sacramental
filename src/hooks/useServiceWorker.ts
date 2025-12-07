/**
 * Hook para registrar e gerenciar Service Worker
 */

import { useEffect, useState } from 'react';

export function useServiceWorker() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [swReady, setSwReady] = useState(false);

  useEffect(() => {
    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('Service Worker registrado:', registration);
          setSwReady(true);

          // Verificar atualizações periodicamente
          setInterval(() => {
            registration.update();
          }, 60000); // A cada minuto
        })
        .catch((error) => {
          console.error('Erro ao registrar Service Worker:', error);
        });
    }

    // Ouvir mudanças de conexão
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    swReady,
  };
}
