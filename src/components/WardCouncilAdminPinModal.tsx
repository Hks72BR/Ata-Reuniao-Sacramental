/**
 * Modal de PIN Administrativo - Conselho de Ala
 * PIN 2661 para criar e excluir atas de conselho de ala
 */

import { useState, useEffect } from 'react';
import { X, Lock, Shield } from 'lucide-react';

const ADMIN_PIN = '2661';

interface WardCouncilAdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  action: 'create' | 'delete';
  recordDate?: string;
}

export function WardCouncilAdminPinModal({
  isOpen,
  onClose,
  onSuccess,
  action,
  recordDate,
}: WardCouncilAdminPinModalProps) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin(['', '', '', '']);
      setError('');
      setIsShaking(false);
      setTimeout(() => {
        const firstInput = document.getElementById('admin-pin-0');
        if (firstInput) firstInput.focus();
      }, 100);
    }
  }, [isOpen]);

  const handlePinChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError('');

    if (value && index < 3) {
      const nextInput = document.getElementById(`admin-pin-${index + 1}`);
      if (nextInput) nextInput.focus();
    }

    if (index === 3 && value) {
      const enteredPin = [...newPin.slice(0, 3), value].join('');
      checkPin(enteredPin);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`admin-pin-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{4}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setPin(digits);
      checkPin(pastedData);
    }
  };

  const checkPin = (enteredPin: string) => {
    if (enteredPin === ADMIN_PIN) {
      onSuccess();
    } else {
      setError('PIN incorreto! Acesso negado.');
      setIsShaking(true);
      setPin(['', '', '', '']);
      setTimeout(() => setIsShaking(false), 500);
      setTimeout(() => {
        const firstInput = document.getElementById('admin-pin-0');
        if (firstInput) firstInput.focus();
      }, 500);
    }
  };

  if (!isOpen) return null;

  const isDelete = action === 'delete';
  const title = isDelete ? 'Confirmar Exclusão' : 'Criar Nova Ata';
  const description = isDelete
    ? 'Digite o PIN administrativo para excluir esta ata'
    : 'Digite o PIN administrativo para criar uma nova ata';
  const borderColor = isDelete ? 'border-red-200' : 'border-amber-200';
  const headerBg = isDelete ? 'bg-red-50' : 'bg-amber-50';
  const iconBg = isDelete ? 'bg-red-100' : 'bg-amber-100';
  const iconColor = isDelete ? 'text-red-600' : 'text-amber-600';
  const titleColor = isDelete ? 'text-red-900' : 'text-amber-900';
  const descColor = isDelete ? 'text-red-700' : 'text-amber-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-md border-2 ${borderColor}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b border-gray-200 ${headerBg} rounded-t-2xl`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center`}>
              <Shield className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${titleColor} font-['Playfair_Display']`}>
                {title}
              </h2>
              <p className={`text-sm ${descColor}`}>{description}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8">
          {isDelete && recordDate && (
            <div className="mb-6 p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-800">
                ⚠️ Excluir ata de <strong>{recordDate}</strong>? Esta ação é irreversível!
              </p>
            </div>
          )}

          <div className="text-center mb-6">
            <Lock className={`w-12 h-12 mx-auto mb-3 ${iconColor}`} />
            <p className="text-gray-600 text-sm">PIN Administrativo (4 dígitos)</p>
          </div>

          {/* PIN Inputs */}
          <div className={`flex gap-3 justify-center mb-4 ${isShaking ? 'animate-shake' : ''}`}>
            {pin.map((digit, index) => (
              <input
                key={index}
                id={`admin-pin-${index}`}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className={`w-14 h-14 text-center text-2xl font-bold rounded-xl border-2 outline-none transition-all ${
                  error
                    ? 'border-red-400 bg-red-50'
                    : digit
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-300 hover:border-teal-400'
                } focus:border-teal-500 focus:ring-2 focus:ring-teal-200`}
              />
            ))}
          </div>

          {error && (
            <p className="text-red-500 text-sm font-medium text-center mt-4">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
