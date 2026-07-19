/**
 * Modal de Identificação do Usuário - Conselho de Ala
 * O usuário se identifica (nome e organização) antes de editar colaborativamente
 * Melhorado com cores e ícones específicos por organização
 */

import { useState, useEffect } from 'react';
import { X, UserCheck } from 'lucide-react';
import { WARD_COUNCIL_ORGANIZATIONS } from '@/types';
import { ORGANIZATION_THEMES } from '@/lib/organizationThemes';

interface WardCouncilUserModalProps {
  isOpen: boolean;
  onConfirm?: (userName: string, organization: string) => void;
  onSuccess?: () => void;
  onClose: () => void;
}

export function WardCouncilUserModal({ isOpen, onConfirm, onSuccess, onClose }: WardCouncilUserModalProps) {
  const [userName, setUserName] = useState('');
  const [organization, setOrganization] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Restaurar dados salvos anteriormente
      const savedName = sessionStorage.getItem('wardcouncil_user_name') || '';
      const savedOrg = sessionStorage.getItem('wardcouncil_user_org') || '';
      setUserName(savedName);
      setOrganization(savedOrg);
      setError('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    const trimmedName = userName.trim();
    if (!trimmedName) {
      setError('Digite seu nome');
      return;
    }
    if (!organization) {
      setError('Selecione sua organização');
      return;
    }
    // Salvar para próxima vez
    sessionStorage.setItem('wardcouncil_user_name', trimmedName);
    sessionStorage.setItem('wardcouncil_user_org', organization);
    
    if (onConfirm) {
      onConfirm(trimmedName, organization);
    }
    if (onSuccess) {
      onSuccess();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border-2 border-teal-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-['Playfair_Display']">
                Bem-vindo à Edição
              </h2>
              <p className="text-sm text-white/90">
                Identifique-se para começar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Nome */}
          <div>
            <label className="block text-sm font-semibold text-teal-900 mb-2">
              👤 Seu Nome
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => { setUserName(e.target.value); setError(''); }}
              placeholder="Ex: João Silva"
              className="w-full px-4 py-3 border-2 border-teal-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-gray-800 placeholder-gray-400"
              autoFocus
            />
          </div>

          {/* Organização */}
          <div>
            <label className="block text-sm font-semibold text-teal-900 mb-3">
              🏢 Sua Organização
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-[360px] overflow-y-auto pr-1">
              {WARD_COUNCIL_ORGANIZATIONS.map((org) => {
                const theme = ORGANIZATION_THEMES[org.key];
                const isSelected = organization === org.key;

                return (
                  <button
                    key={org.key}
                    onClick={() => { setOrganization(org.key); setError(''); }}
                    className={`flex flex-col items-center gap-2 px-3 py-3 rounded-xl border-2 transition-all text-center ${
                      isSelected
                        ? `${theme?.color.light} border-2 ${theme?.color.border} shadow-lg scale-[1.05]`
                        : 'border-gray-200 hover:border-teal-300 bg-gray-50 hover:bg-teal-50'
                    }`}
                  >
                    <span className="text-2xl">{theme?.emoji || '👥'}</span>
                    <span className={`font-semibold text-xs ${isSelected ? theme?.color.text : 'text-gray-700'}`}>
                      {org.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm font-medium">❌ {error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-teal-50 rounded-b-2xl">
          <button
            onClick={handleConfirm}
            className="w-full py-3 px-6 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold rounded-xl hover:from-teal-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95"
          >
            ✓ Entrar na Edição Colaborativa
          </button>
        </div>
      </div>
    </div>
  );
}
