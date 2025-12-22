import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { X, Save, Upload } from 'lucide-react';

interface MembersListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (members: string[]) => void;
  currentMembers: string[];
}

export function MembersListModal({ isOpen, onClose, onSave, currentMembers }: MembersListModalProps) {
  const [textInput, setTextInput] = useState('');
  
  useEffect(() => {
    if (isOpen && currentMembers.length > 0) {
      setTextInput(currentMembers.join('\n'));
    }
  }, [isOpen, currentMembers]);

  if (!isOpen) return null;

  const handleSave = () => {
    // Processar o texto: dividir por linhas, limpar espaços, remover vazios
    const membersList = textInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    onSave(membersList);
    onClose();
  };

  const memberCount = textInput.split('\n').filter(line => line.trim().length > 0).length;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(30, 58, 95, 0.5)' }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border-2"
        style={{ borderColor: '#d4a574' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 flex justify-between items-center" style={{ backgroundColor: '#1e3a5f' }}>
          <div className="flex items-center gap-3">
            <Upload className="text-[#d4a574]" size={28} />
            <h2 className="text-2xl font-bold text-white">
              Lista de Membros da Ala
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-[#d4a574] transition-colors"
          >
            <X size={28} />
          </button>
        </div>
        
        {/* Conteúdo */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-700 mb-2">
              Cole aqui a lista completa de membros (um nome por linha):
            </p>
            <p className="text-sm text-gray-500 mb-4">
              💡 Dica: Copie todos os nomes do PDF e cole aqui de uma vez. O sistema vai processar automaticamente.
            </p>
          </div>

          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="João Silva&#10;Maria Santos&#10;Pedro Oliveira&#10;..."
            className="w-full h-96 p-4 border-2 border-gray-300 rounded-lg focus:border-[#d4a574] focus:outline-none resize-none font-mono text-sm"
            style={{ lineHeight: '1.6' }}
          />

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {memberCount > 0 ? (
                <>
                  <strong className="text-[#1e3a5f]">{memberCount}</strong> {memberCount === 1 ? 'membro' : 'membros'} na lista
                </>
              ) : (
                'Nenhum membro adicionado ainda'
              )}
            </p>

            <div className="flex gap-3">
              <Button
                onClick={onClose}
                className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-6"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                className="text-white font-semibold px-6"
                style={{ backgroundColor: '#d4a574' }}
                disabled={memberCount === 0}
              >
                <Save size={18} className="mr-2" />
                Salvar Lista
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
