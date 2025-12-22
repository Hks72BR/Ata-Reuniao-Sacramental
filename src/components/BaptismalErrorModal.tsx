import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';

interface BaptismalErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

export function BaptismalErrorModal({ isOpen, onClose, message }: BaptismalErrorModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(26, 122, 138, 0.5)' }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border-2"
        style={{ borderColor: '#16a085' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header com ícone de alerta */}
        <div className="p-6 flex justify-center" style={{ backgroundColor: '#1e8b9f' }}>
          <div className="bg-white rounded-full p-3">
            <AlertTriangle className="w-16 h-16 text-red-500" />
          </div>
        </div>
        
        {/* Conteúdo */}
        <div className="p-6 text-center">
          <h2 className="text-2xl font-bold mb-3" style={{ color: '#1e8b9f' }}>
            Erro na Ata Batismal!
          </h2>
          <p className="text-gray-600 mb-6">
            {message}
          </p>
          
          {/* Botão de fechar */}
          <Button
            onClick={onClose}
            className="w-full text-white font-semibold py-3 rounded-lg transition-colors"
            style={{ backgroundColor: '#16a085' }}
          >
            Entendi
          </Button>
        </div>
      </div>
    </div>
  );
}
