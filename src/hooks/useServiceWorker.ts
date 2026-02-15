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

          // Verificar atualizações a cada 60 segundos
          setInterval(() => {
            registration.update();
          }, 60000);
        })
        .catch((error) => {
          console.error('❌ Erro ao verificar Service Worker:', error);
        });

      // Ouvir mensagens do Service Worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATED') {
          console.log('🔄 Nova versão detectada! Recarregando...');
          // Recarregar página após 1 segundo
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      });

      // Ouvir por novas versões do SW (controllerchange)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Service Worker atualizado!');
        // Não recarregar aqui, pois já vamos recarregar com a mensagem SW_UPDATED
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
