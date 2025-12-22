/**
 * Modal de Identificação do Usuário
 * Pergunta quem está fazendo a alteração antes de salvar/editar/excluir
 */

import { useState } from 'react';
import { Button } from './ui/button';
import { User } from 'lucide-react';

interface UserIdentificationModalProps {
  isOpen: boolean;
  onConfirm: (userName: string) => void;
  onCancel: () => void;
  action: 'criar' | 'editar' | 'excluir';
}

export function UserIdentificationModal({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  action 
}: UserIdentificationModalProps) {
  const [userName, setUserName] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (userName.trim()) {
      onConfirm(userName.trim());
      setUserName('');
    }
  };

  const actionText = {
    criar: 'criar esta ata',
    editar: 'salvar as alterações',
    excluir: 'excluir esta ata'
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border-2 border-[#1e3a5f]">
        {/* Cabeçalho */}
        <div className="bg-gradient-to-r from-[#1e3a5f] to-[#24466e] text-white px-6 py-5 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <User size={24} className="text-[#d4a574]" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Identificação Necessária</h3>
              <p className="text-sm text-white/80">Registre quem está fazendo esta ação</p>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          <label className="block text-[#1e3a5f] font-semibold mb-3">
            Quem está {action === 'criar' ? 'criando' : action === 'editar' ? 'editando' : 'excluindo'} esta ata?
          </label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            placeholder="Digite seu nome completo"
            autoFocus
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#d4a574] focus:ring-2 focus:ring-[#d4a574]/20 outline-none transition-all text-[#1e3a5f] font-medium"
          />
          <p className="text-sm text-gray-600 mt-2">
            Esta informação será registrada no histórico da ata
          </p>
        </div>

        {/* Botões */}
        <div className="flex gap-3 px-6 pb-6">
          <Button
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold py-3"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!userName.trim()}
            className="flex-1 bg-[#d4a574] text-white hover:bg-[#c49564] font-semibold py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmar e {actionText[action]}
          </Button>
        </div>
      </div>
    </div>
  );
}
