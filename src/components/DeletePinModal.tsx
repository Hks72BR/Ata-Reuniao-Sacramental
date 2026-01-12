/**
 * Modal de PIN para Exclusão de Atas
 * Proteção adicional para prevenir exclusões acidentais
 */

import { useState, useEffect } from 'react';
import { X, Lock, AlertTriangle, Trash2 } from 'lucide-react';

interface DeletePinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  recordDate?: string; // Data da ata a ser excluída (para exibir)
}

export function DeletePinModal({
  isOpen,
  onClose,
  onSuccess,
  recordDate,
}: DeletePinModalProps) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (isOpen) {
      console.log('[DeletePinModal] Modal ABERTO!');
      // Resetar estado ao abrir
      setPin(['', '', '', '']);
      setError('');
      setIsShaking(false);
      
      // Focar no primeiro input
      setTimeout(() => {
        const firstInput = document.getElementById('delete-pin-0');
        if (firstInput) {
          console.log('[DeletePinModal] Focando no primeiro input');
          firstInput.focus();
        } else {
          console.log('[DeletePinModal] ERRO: Input não encontrado!');
        }
      }, 100);
    } else {
      console.log('[DeletePinModal] Modal FECHADO');
    }
  }, [isOpen]);

  const handlePinChange = (index: number, value: string) => {
    console.log('[DeletePinModal] handlePinChange - index:', index, 'value:', value);
    
    // Aceitar apenas números
    if (value && !/^\d$/.test(value)) {
      console.log('[DeletePinModal] Valor não é número, ignorando');
      return;
    }

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError('');

    console.log('[DeletePinModal] PIN atualizado:', newPin);

    // Mover para o próximo input automaticamente
    if (value && index < 3) {
      const nextInput = document.getElementById(`delete-pin-${index + 1}`);
      if (nextInput) {
        nextInput.focus();
      }
    }

    // Verificar PIN quando completar os 4 dígitos
    if (index === 3 && value) {
      const enteredPin = [...newPin.slice(0, 3), value].join('');
      console.log('[DeletePinModal] PIN completo! Verificando:', enteredPin);
      checkPin(enteredPin);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Voltar para o input anterior ao pressionar Backspace
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`delete-pin-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // Validar se é um PIN de 4 dígitos
    if (/^\d{4}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setPin(digits);
      checkPin(pastedData);
    }
  };

  const checkPin = async (enteredPin: string) => {
    // Importar dinamicamente para evitar circular dependency
    const { validateDeletePin, AUTH_CONFIG } = await import('@/lib/auth');
    
    console.log('[DeletePinModal] PIN digitado:', enteredPin);
    console.log('[DeletePinModal] PIN esperado:', AUTH_CONFIG.DELETE_PIN);
    
    const isValid = validateDeletePin(enteredPin);
    console.log('[DeletePinModal] PIN válido?', isValid);

    if (isValid) {
      // PIN correto
      console.log('[DeletePinModal] ✅ PIN CORRETO! Chamando onSuccess...');
      onSuccess();
      // NÃO chamar onClose() aqui - deixa o componente pai fechar
    } else {
      // PIN incorreto - mostrar erro
      console.log('[DeletePinModal] ❌ PIN INCORRETO!');
      setError('PIN incorreto! Acesso negado.');
      setIsShaking(true);
      setPin(['', '', '', '']);
      
      // Remover animação após 500ms
      setTimeout(() => setIsShaking(false), 500);
      
      // Focar no primeiro input
      setTimeout(() => {
        const firstInput = document.getElementById('delete-pin-0');
        if (firstInput) {
          firstInput.focus();
        }
      }, 500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md border-2 border-red-200 dark:border-red-900/50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700 bg-red-50 dark:bg-red-900/20 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-red-900 dark:text-red-100 font-['Playfair_Display']">
                Confirmar Exclusão
              </h2>
              <p className="text-sm text-red-700 dark:text-red-300">
                PIN de Segurança Obrigatório
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Aviso */}
        <div className="p-6 bg-amber-50 dark:bg-amber-900/10 border-b border-amber-200 dark:border-amber-900/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
                ⚠️ Atenção: Esta ação é irreversível!
              </p>
              {recordDate && (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Você está prestes a excluir a ata de <strong>{recordDate}</strong>
                </p>
              )}
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                Digite o PIN de exclusão de 4 dígitos para confirmar.
              </p>
            </div>
          </div>
        </div>

        {/* Body - PIN Input */}
        <div className="p-8">
          <div className="text-center mb-6">
            <Lock className="w-12 h-12 mx-auto mb-3 text-red-500 dark:text-red-400" />
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              PIN de Exclusão (4 dígitos)
            </p>
          </div>

          {/* PIN Inputs */}
          <div className={`flex gap-3 justify-center mb-4 ${isShaking ? 'animate-shake' : ''}`}>
            {pin.map((digit, index) => (
              <input
                key={index}
                id={`delete-pin-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className={`w-14 h-14 text-center text-2xl font-bold rounded-lg border-2 
                  ${error 
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                    : 'border-gray-300 dark:border-slate-600 focus:border-red-500 dark:focus:border-red-400'
                  }
                  bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                  focus:outline-none focus:ring-2 focus:ring-red-500/20
                  transition-all duration-200`}
                autoComplete="off"
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 border border-gray-200 dark:border-slate-600">
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center leading-relaxed">
              🔒 Este PIN é diferente do PIN de acesso às atas.<br />
              Entre em contato com o administrador se não souber o PIN.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 
              rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.5s;
        }
      `}</style>
    </div>
  );
}
