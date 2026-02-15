/**
 * Hook para gerenciar Service Worker e status de conexão
 * Garante funcionalidade 100% offline
 * Com atualização automática forçada
 */

import { useEffect, useState } from 'react';

export function useServiceWorker() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [swReady, setSwReady] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Verificar se o Service Worker já foi registrado (pelo index.html)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => {
          console.log('✅ Service Worker pronto!');
          setSwReady(true);
          setSwRegistration(registration);
        })
        .catch((error) => {
          console.error('❌ Erro ao verificar Service Worker:', error);
        });
    }

    // Ouvir mudanças de conexão
    const handleOnline = () => {
      console.log('🌐 Conexão restaurada');
      setIsOnline(true);
      
      // Quando voltar online, verificar por atualizações
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(reg => {
          if (reg) {
            console.log('🔍 Verificando atualizações ao voltar online...');
            reg.update();
          }
        });
      }
    };
    
    const handleOffline = () => {
      console.log('📡 Modo offline ativado');
      setIsOnline(false);
    };

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
    swRegistration,
  };
}
