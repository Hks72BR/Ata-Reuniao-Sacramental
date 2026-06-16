/**
 * Modal de Identificação do Usuário - Conselho de Ala
 * O usuário se identifica (nome e organização) antes de editar colaborativamente
 */

import { useState, useEffect } from 'react';
import { X, UserCheck } from 'lucide-react';
import { WARD_COUNCIL_ORGANIZATIONS } from '@/types';

interface WardCouncilUserModalProps {
  isOpen: boolean;
  onConfirm: (userName: string, organization: string) => void;
  onClose: () => void;
}

export function WardCouncilUserModal({ isOpen, onConfirm, onClose }: WardCouncilUserModalProps) {
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
    onConfirm(trimmedName, organization);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border-2 border-teal-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-teal-900 font-['Playfair_Display']">
                Identificação
              </h2>
              <p className="text-sm text-teal-700">
                Quem está editando?
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-teal-800 mb-2">
              Seu Nome
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => { setUserName(e.target.value); setError(''); }}
              placeholder="Ex: João Silva"
              className="w-full px-4 py-3 border-2 border-teal-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all text-gray-800"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-teal-800 mb-2">
              Sua Organização
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-[280px] overflow-y-auto pr-1">
              {WARD_COUNCIL_ORGANIZATIONS.map((org) => (
                <button
                  key={org.key}
                  onClick={() => { setOrganization(org.key); setError(''); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                    organization === org.key
                      ? 'border-teal-500 bg-teal-50 shadow-md scale-[1.02]'
                      : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
                  }`}
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: org.color }}
                  />
                  <span className="font-medium text-gray-800">{org.label}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm font-medium text-center">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button
            onClick={handleConfirm}
            className="w-full py-3 px-6 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold rounded-xl hover:from-teal-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95"
          >
            Entrar na Edição
          </button>
        </div>
      </div>
    </div>
  );
}
