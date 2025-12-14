/**
 * Componente de Autenticação por PIN
 * Sistema de proteção para Atas Sacramentais e Batismais
 * Inclui: Rate limiting, timeout de sessão, validação segura
 */

import { useState, useEffect } from 'react';
import { X, Lock, AlertTriangle } from 'lucide-react';
import { isLockedOut, recordLoginAttempt, getRemainingAttempts, login } from '@/lib/auth';

interface PinAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title: string;
  description: string;
  correctPin: string; // PIN correto (4 dígitos)
  storageKey: string; // Chave para salvar no sessionStorage
  timestampKey: string; // Chave para salvar timestamp da sessão
}

export function PinAuthModal({
  isOpen,
  onClose,
  onSuccess,
  title,
  description,
  correctPin,
  storageKey,
  timestampKey,
}: PinAuthModalProps) {
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [lockoutInfo, setLockoutInfo] = useState<{ locked: boolean; remainingTime?: number }>({ locked: false });
  const [remainingAttempts, setRemainingAttempts] = useState(5);

  useEffect(() => {
    // Verificar lockout ao abrir modal
    if (isOpen) {
      const lockout = isLockedOut();
      setLockoutInfo(lockout);
      setRemainingAttempts(getRemainingAttempts());
    }
  }, [isOpen]);

  useEffect(() => {
    // Focar no primeiro input quando o modal abrir
    if (isOpen && !lockoutInfo.locked) {
      const firstInput = document.getElementById('pin-0');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }
  }, [isOpen, lockoutInfo.locked]);

  const handlePinChange = (index: number, value: string) => {
    // Não permitir se estiver bloqueado
    if (lockoutInfo.locked) {
      return;
    }

    // Aceitar apenas números
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError('');

    // Mover para o próximo input automaticamente
    if (value && index < 5) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      if (nextInput) {
        nextInput.focus();
      }
    }

    // Verificar PIN quando completar os 6 dígitos
    if (index === 5 && value) {
      const enteredPin = [...newPin.slice(0, 5), value].join('');
      checkPin(enteredPin);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Voltar para o input anterior ao pressionar Backspace
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    
    if (lockoutInfo.locked) {
      return;
    }

    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    
    if (/^\d{6}$/.test(pastedData)) {
      const newPin = pastedData.split('');
      setPin(newPin);
      checkPin(pastedData);
    }
  };

  const checkPin = (enteredPin: string) => {
    if (enteredPin === correctPin) {
      // PIN correto - registrar sucesso e fazer login
      recordLoginAttempt(true);
      login(storageKey, timestampKey);
      onSuccess();
      setPin(['', '', '', '']);
      setError('');
    } else {
      // PIN incorreto - registrar falha
      recordLoginAttempt(false);
      
      // Verificar se foi bloqueado após esta tentativa
      const lockout = isLockedOut();
      setLockoutInfo(lockout);
      
      if (lockout.locked) {
        setError(`Muitas tentativas incorretas. Tente novamente em ${lockout.remainingTime} minutos.`);
      } else {
        const remaining = getRemainingAttempts();
        setRemainingAttempts(remaining);
        setError(`PIN incorreto. ${remaining} tentativa${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''}.`);
      }
      
      setIsShaking(true);
      setTimeout(() => {
        setPin(['', '', '', '']);
        setIsShaking(false);
        if (!lockout.locked) {
          const firstInput = document.getElementById('pin-0');
          if (firstInput) {
            firstInput.focus();
          }
        }
      }, 500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 ${isShaking ? 'animate-shake' : ''}`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Fechar"
        >
          <X size={24} />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className={`w-16 h-16 ${lockoutInfo.locked ? 'bg-red-500' : 'bg-gradient-to-br from-[#1e3a5f] to-[#24466e]'} rounded-full flex items-center justify-center shadow-lg`}>
            {lockoutInfo.locked ? (
              <AlertTriangle size={32} className="text-white" />
            ) : (
              <Lock size={32} className="text-white" />
            )}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-[#1e3a5f] mb-2 font-['Playfair_Display']">
          {lockoutInfo.locked ? 'Acesso Bloqueado' : title}
        </h2>

        {/* Description */}
        <p className="text-center text-gray-600 mb-8 font-['Poppins']">
          {lockoutInfo.locked 
            ? `Muitas tentativas incorretas. Aguarde ${lockoutInfo.remainingTime} minutos para tentar novamente.`
            : description
          }
        </p>

        {/* PIN Input */}
        {!lockoutInfo.locked && (
          <div className="flex justify-center gap-3 mb-6">
            {pin.map((digit, index) => (
              <input
                key={index}
                id={`pin-${index}`}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                autoComplete="off"
                disabled={lockoutInfo.locked}
              />
            ))}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className={`mb-4 p-3 ${lockoutInfo.locked ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'} border rounded-lg`}>
            <p className={`text-sm ${lockoutInfo.locked ? 'text-red-600' : 'text-yellow-700'} text-center font-semibold`}>
              {error}
            </p>
          </div>
        )}

        {/* Help Text */}
        {!lockoutInfo.locked && (
          <div className="space-y-2">
            <p className="text-xs text-center text-gray-500">
              Digite o PIN de 6 dígitos para acessar
            </p>
            {remainingAttempts < 5 && (
              <p className="text-xs text-center text-orange-600 font-semibold">
                ⚠️ {remainingAttempts} tentativa{remainingAttempts !== 1 ? 's' : ''} restante{remainingAttempts !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}

        {/* Security Info */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-center text-gray-400">
            🔒 Sessão expira após 8 horas de inatividade
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
          20%, 40%, 60%, 80% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.5s;
        }
      `}</style>
    </div>
  );
}
