/**
 * Hook para gerenciar Service Worker e status de conexão
 * Garante funcionalidade 100% offline
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

          // Verificar atualizações a cada 2 minutos
          setInterval(() => {
            registration.update();
          }, 120000);
        })
        .catch((error) => {
          console.error('❌ Erro ao verificar Service Worker:', error);
        });

      // Ouvir por novas versões do SW
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Nova versão do Service Worker ativa!');
        // Pode recarregar a página ou notificar o usuário
      });
    }

    // Ouvir mudanças de conexão
    const handleOnline = () => {
      console.log('🌐 Conexão restaurada');
      setIsOnline(true);
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
