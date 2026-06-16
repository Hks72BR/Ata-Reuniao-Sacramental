/**
 * Ward Context - Multi-Tenant Support
 * Gerencia autenticação e isolamento de dados por ala
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User 
} from 'firebase/auth';

interface WardContextType {
  currentUser: User | null;
  wardId: string | null;
  wardName: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const WardContext = createContext<WardContextType | undefined>(undefined);

export function WardProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [wardId, setWardId] = useState<string | null>(null);
  const [wardName, setWardName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('[WardContext] Auth state changed:', user?.email);
      
      if (user) {
        setCurrentUser(user);
        const emailWardId = user.email?.split('@')[0] || null;
        setWardId(emailWardId);
        const displayWardName = user.displayName || 
          emailWardId?.replace(/-/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        setWardName(displayWardName || 'Ala');
        localStorage.setItem('wardId', emailWardId || '');
        localStorage.setItem('wardName', displayWardName || '');
      } else {
        setCurrentUser(null);
        setWardId(null);
        setWardName(null);
        localStorage.removeItem('wardId');
        localStorage.removeItem('wardName');
      }
      setIsLoading(false);
    });

    const savedWardId = localStorage.getItem('wardId');
    const savedWardName = localStorage.getItem('wardName');
    if (savedWardId && !currentUser) {
      setWardId(savedWardId);
      setWardName(savedWardName);
    }

    return () => unsubscribe();
  }, [auth]);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('[WardContext] Login error:', error);
      throw new Error(getAuthErrorMessage(error.code));
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('[WardContext] Logout error:', error);
      throw error;
    }
  };

  return (
    <WardContext.Provider value={{ currentUser, wardId, wardName, isAuthenticated: !!currentUser, isLoading, signIn, signOut }}>
      {children}
    </WardContext.Provider>
  );
}

export function useWard() {
  const context = useContext(WardContext);
  if (context === undefined) {
    throw new Error('useWard must be used within a WardProvider');
  }
  return context;
}

function getAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/invalid-email': return 'Email inválido';
    case 'auth/user-disabled': return 'Esta conta foi desabilitada';
    case 'auth/user-not-found': return 'Usuário não encontrado';
    case 'auth/wrong-password': return 'Senha incorreta';
    case 'auth/too-many-requests': return 'Muitas tentativas. Tente novamente mais tarde';
    case 'auth/network-request-failed': return 'Erro de conexão. Verifique sua internet';
    default: return 'Erro ao fazer login. Tente novamente';
  }
}
