/**
 * Componente de Autenticação por PIN
 * Sistema de proteção para Atas Sacramentais e Batismais
 */

import { useState, useEffect } from 'react';
import { X, Lock } from 'lucide-react';

interface PinAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title: string;
  description: string;
  correctPin: string; // PIN correto (4 dígitos)
  storageKey: string; // Chave para salvar no sessionStorage
}

export function PinAuthModal({
  isOpen,
  onClose,
  onSuccess,
  title,
  description,
  correctPin,
  storageKey,
}: PinAuthModalProps) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    // Verificar se já está autenticado na sessão
    const isAuthenticated = sessionStorage.getItem(storageKey);
    if (isAuthenticated === 'true') {
      onSuccess();
    }
  }, [storageKey, onSuccess]);

  useEffect(() => {
    // Focar no primeiro input quando o modal abrir
    if (isOpen) {
      const firstInput = document.getElementById('pin-0');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }
  }, [isOpen]);

  const handlePinChange = (index: number, value: string) => {
    // Aceitar apenas números
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError('');

    // Mover para o próximo input automaticamente
    if (value && index < 3) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      if (nextInput) {
        nextInput.focus();
      }
    }

    // Verificar PIN quando completar os 4 dígitos
    if (index === 3 && value) {
      const enteredPin = [...newPin.slice(0, 3), value].join('');
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
    const pastedData = e.clipboardData.getData('text').slice(0, 4);
    
    if (/^\d{4}$/.test(pastedData)) {
      const newPin = pastedData.split('');
      setPin(newPin);
      checkPin(pastedData);
    }
  };

  const checkPin = (enteredPin: string) => {
    if (enteredPin === correctPin) {
      // PIN correto - salvar no sessionStorage
      sessionStorage.setItem(storageKey, 'true');
      onSuccess();
      setPin(['', '', '', '']);
    } else {
      // PIN incorreto - mostrar erro e limpar
      setError('PIN incorreto. Tente novamente.');
      setIsShaking(true);
      setTimeout(() => {
        setPin(['', '', '', '']);
        setIsShaking(false);
        const firstInput = document.getElementById('pin-0');
        if (firstInput) {
          firstInput.focus();
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
        >
          <X size={24} />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#1e3a5f] to-[#24466e] rounded-full flex items-center justify-center shadow-lg">
            <Lock size={32} className="text-white" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-[#1e3a5f] mb-2 font-['Playfair_Display']">
          {title}
        </h2>

        {/* Description */}
        <p className="text-center text-gray-600 mb-8 font-['Poppins']">
          {description}
        </p>

        {/* PIN Input */}
        <div className="flex justify-center gap-3 mb-6">
          {pin.map((digit, index) => (
            <input
              key={index}
              id={`pin-${index}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handlePinChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 outline-none transition-all"
              autoComplete="off"
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 text-center font-semibold">
              {error}
            </p>
          </div>
        )}

        {/* Help Text */}
        <p className="text-xs text-center text-gray-500">
          Digite o PIN de 4 dígitos para acessar
        </p>
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
