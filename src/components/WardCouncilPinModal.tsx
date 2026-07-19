/**
 * Modal de Autenticação Dual - Ward Council
 * Aceita PIN de Sacramental (para criar) ou PIN de Ward Council (para editar)
 * ✅ Sacramental PIN → Redireciona para WardCouncilHome (criar)
 * ✅ Ward Council PIN → Redireciona para WardCouncilHistory (editar existentes)
 */

import { useState, useEffect } from 'react';
import { X, Lock, AlertTriangle } from 'lucide-react';
import { isLockedOut, recordLoginAttempt, getRemainingAttempts, login } from '@/lib/auth';
import { AUTH_CONFIG } from '@/lib/auth';

interface WardCouncilPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessCreate: () => void; // Sacramental PIN → criar
  onSuccessEdit: () => void;   // Ward Council PIN → editar
  title: string;
  description: string;
}

export function WardCouncilPinModal({
  isOpen,
  onClose,
  onSuccessCreate,
  onSuccessEdit,
  title,
  description,
}: WardCouncilPinModalProps) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [lockoutInfo, setLockoutInfo] = useState<{ locked: boolean; remainingTime?: number }>({ locked: false });

  useEffect(() => {
    // Verificar lockout ao abrir modal
    if (isOpen) {
      const lockout = isLockedOut();
      setLockoutInfo(lockout);
    }
  }, [isOpen]);

  useEffect(() => {
    // Focar no primeiro input quando o modal abrir
    if (isOpen && !lockoutInfo.locked) {
      const firstInput = document.getElementById('wardcouncil-pin-0');
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
    if (value && index < 3) {
      const nextInput = document.getElementById(`wardcouncil-pin-${index + 1}`);
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
      const prevInput = document.getElementById(`wardcouncil-pin-${index - 1}`);
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

    const pastedData = e.clipboardData.getData('text').slice(0, 4);
    
    if (/^\d{4}$/.test(pastedData)) {
      const newPin = pastedData.split('');
      setPin(newPin);
      checkPin(pastedData);
    }
  };

  const checkPin = (enteredPin: string) => {
    // ✅ Verificar PIN de Sacramental (para CRIAR)
    if (enteredPin === AUTH_CONFIG.SACRAMENTAL_PIN) {
      recordLoginAttempt(true);
      login(
        AUTH_CONFIG.SACRAMENTAL_SESSION_KEY,
        AUTH_CONFIG.SACRAMENTAL_TIMESTAMP_KEY
      );
      // 🎯 Redireciona para HOME (criar nova ata)
      onSuccessCreate();
      setPin(['', '', '', '']);
      setError('');
      return;
    }

    // ✅ Verificar PIN de Ward Council (para EDITAR)
    if (enteredPin === AUTH_CONFIG.WARD_COUNCIL_PIN) {
      recordLoginAttempt(true);
      login(
        AUTH_CONFIG.WARD_COUNCIL_SESSION_KEY,
        AUTH_CONFIG.WARD_COUNCIL_TIMESTAMP_KEY
      );
      // 🎯 Redireciona para HISTORY (editar existentes)
      onSuccessEdit();
      setPin(['', '', '', '']);
      setError('');
      return;
    }

    // ❌ PIN incorreto
    recordLoginAttempt(false);
    
    // Verificar se foi bloqueado após esta tentativa
    const lockout = isLockedOut();
    setLockoutInfo(lockout);
    
    if (lockout.locked) {
      setError(`Muitas tentativas incorretas. Tente novamente em ${lockout.remainingTime} minutos.`);
    } else {
      const remaining = getRemainingAttempts();
      setError(
        `PIN incorreto. ${remaining} tentativa${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''}.`
      );
    }
    
    setIsShaking(true);
    setTimeout(() => {
      setPin(['', '', '', '']);
      setIsShaking(false);
      if (!lockout.locked) {
        const firstInput = document.getElementById('wardcouncil-pin-0');
        if (firstInput) {
          firstInput.focus();
        }
      }
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border-2 border-purple-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 px-6 py-8 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition"
          >
            <X size={24} />
          </button>

          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Lock size={32} className="text-white" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white text-center font-['Playfair_Display'] mb-2">
            {title}
          </h2>
          <p className="text-purple-100 text-sm text-center font-['Poppins']">
            {description}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {lockoutInfo.locked ? (
            // Lockout message
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 text-center">
              <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-red-800 font-semibold mb-1">Acesso Bloqueado</p>
              <p className="text-red-600 text-sm">
                Muitas tentativas incorretas. Aguarde{' '}
                <strong>{lockoutInfo.remainingTime} minutos</strong> antes de tentar novamente.
              </p>
            </div>
          ) : (
            <>
              {/* PIN Input */}
              <div className="flex justify-center gap-3 mb-6">
                {pin.map((digit, index) => (
                  <input
                    key={index}
                    id={`wardcouncil-pin-${index}`}
                    type="password"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className={`w-14 h-14 text-center text-2xl font-bold border-2 rounded-lg transition-all ${
                      isShaking ? 'animate-shake border-red-500 bg-red-50' : 'border-purple-300 bg-white'
                    } focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-300`}
                  />
                ))}
              </div>

              {/* Mensagens */}
              <div className="mb-6">
                {error && (
                  <div className="text-red-600 text-sm font-semibold text-center mb-2">
                    ❌ {error}
                  </div>
                )}
                {!error && (
                  <div className="text-purple-700 text-xs text-center">
                    💡 Use seu PIN de Sacramental (criar) ou Ward Council (editar)
                  </div>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                <p className="text-purple-900 text-xs font-['Poppins'] leading-relaxed">
                  <strong>📌 PIN Sacramental:</strong> Cria nova ata de Conselho de Ala
                  <br />
                  <strong>📌 PIN Ward Council:</strong> Edita atas existentes
                </p>
              </div>

              {/* Info Footer */}
              <div className="text-center">
                <p className="text-gray-600 text-xs font-['Poppins']">
                  🔒 Sessão expira após 8 horas de inatividade
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.4s;
        }
      `}</style>
    </div>
  );
}
