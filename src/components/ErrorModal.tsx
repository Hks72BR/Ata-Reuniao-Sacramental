import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  theme?: 'teal' | 'blue' | 'sacramental' | 'baptismal' | 'default';
}

export function ErrorModal({ isOpen, onClose, message, theme = 'teal' }: ErrorModalProps) {
  if (!isOpen) return null;

  // Configurações de tema
  const themeConfig = {
    teal: {
      bgGradient: 'from-white to-teal-50/30',
      border: 'border-amber-500',
      headerGradient: 'from-teal-700 via-teal-600 to-emerald-600',
      textColor: 'text-teal-800',
      buttonGradient: 'from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700',
    },
    blue: {
      bgGradient: 'from-white to-blue-50/30',
      border: 'border-[#3498db]',
      headerGradient: 'from-[#2c3e50] via-[#34495e] to-[#2c3e50]',
      textColor: 'text-[#34495e]',
      buttonGradient: 'from-[#3498db] to-[#2980b9] hover:from-[#2980b9] hover:to-[#3498db]',
    },
    sacramental: {
      bgGradient: 'from-white to-blue-50/20',
      border: 'border-[#d4a574]',
      headerGradient: 'from-[#1a3a52] via-[#1e3a5f] to-[#24466e]',
      textColor: 'text-[#1e3a5f]',
      buttonGradient: 'from-[#1e3a5f] to-[#24466e] hover:from-[#24466e] hover:to-[#1e3a5f]',
    },
    baptismal: {
      bgGradient: 'from-white to-cyan-50/30',
      border: 'border-[#16a085]',
      headerGradient: 'from-[#1a7a8a] via-[#1e8b9f] to-[#16a085]',
      textColor: 'text-[#1a7a8a]',
      buttonGradient: 'from-[#1e8b9f] to-[#16a085] hover:from-[#16a085] hover:to-[#1e8b9f]',
    },
    default: {
      bgGradient: 'from-white to-gray-50/30',
      border: 'border-gray-400',
      headerGradient: 'from-gray-700 via-gray-600 to-gray-700',
      textColor: 'text-gray-800',
      buttonGradient: 'from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800',
    }
  };

  const colors = themeConfig[theme];

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className={`bg-gradient-to-br ${colors.bgGradient} rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border-2 ${colors.border}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header com ícone de alerta */}
        <div className={`bg-gradient-to-r ${colors.headerGradient} p-6 flex justify-center`}>
          <div className="bg-white/90 rounded-full p-3 shadow-lg">
            <AlertTriangle className="w-16 h-16 text-amber-500" />
          </div>
        </div>
        
        {/* Conteúdo */}
        <div className="p-6 text-center">
          <h2 className={`text-2xl font-bold mb-3 ${colors.textColor} font-['Playfair_Display']`}>
            Atenção!
          </h2>
          <p className="text-gray-700 mb-6 font-['Poppins'] text-base leading-relaxed">
            {message}
          </p>
          
          {/* Botão de fechar */}
          <Button
            onClick={onClose}
            className={`w-full bg-gradient-to-r ${colors.buttonGradient} text-white font-bold py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95`}
          >
            Entendi
          </Button>
        </div>
      </div>
    </div>
  );
}
