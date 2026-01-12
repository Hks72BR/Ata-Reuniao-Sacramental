import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

export function ErrorModal({ isOpen, onClose, message }: ErrorModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-white to-teal-50/30 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border-2 border-amber-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header com ícone de alerta */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 p-6 flex justify-center">
          <div className="bg-white/90 rounded-full p-3 shadow-lg">
            <AlertTriangle className="w-16 h-16 text-amber-500" />
          </div>
        </div>
        
        {/* Conteúdo */}
        <div className="p-6 text-center">
          <h2 className="text-2xl font-bold mb-3 text-teal-800 font-['Playfair_Display']">
            Erro na Ata!
          </h2>
          <p className="text-gray-700 mb-6 font-['Poppins'] text-lg font-semibold">
            {message}
          </p>
          
          {/* Botão de fechar */}
          <Button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
          >
            Entendi
          </Button>
        </div>
      </div>
    </div>
  );
}
