import React, { useState } from 'react';
import { Button } from './ui/button';
import { InputField } from './FormField';
import { MessageCircle, Mail, X } from 'lucide-react';
import { sendWhatsAppInvitation, sendEmailInvitation } from '@/lib/communication';

interface InvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  speakerName: string;
  defaultDate?: string;
}

export const InvitationModal: React.FC<InvitationModalProps> = ({
  isOpen,
  onClose,
  speakerName,
  defaultDate = new Date().toISOString().split('T')[0],
}) => {
  const [date, setDate] = useState(defaultDate);
  const [theme, setTheme] = useState('');
  const [timeLimit, setTimeLimit] = useState('10');

  if (!isOpen) return null;

  const invitationData = {
    speakerName,
    date,
    theme,
    timeLimit,
    wardName: 'Ala Casa Grande',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border-2 border-[#d4a574]/20 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1e3a5f] to-[#24466e] p-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          <h3 className="text-2xl font-bold font-playfair">Enviar Convite</h3>
          <p className="text-white/80 text-sm mt-1">Para: {speakerName}</p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <InputField
            label="Data da Reunião"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <InputField
            label="Tema Sugerido (opcional)"
            placeholder="Ex: Fé em Jesus Cristo"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          />
          <InputField
            label="Tempo de Discurso (minutos)"
            type="number"
            value={timeLimit}
            onChange={(e) => setTimeLimit(e.target.value)}
          />

          <div className="pt-4 grid grid-cols-2 gap-4">
            <Button
              onClick={() => {
                sendWhatsAppInvitation(invitationData);
                onClose();
              }}
              className="bg-[#25D366] hover:bg-[#128C7E] text-white font-bold flex items-center justify-center gap-2 py-6 rounded-xl shadow-lg hover:scale-105 transition-all"
            >
              <MessageCircle size={20} />
              WhatsApp
            </Button>
            <Button
              onClick={() => {
                sendEmailInvitation(invitationData);
                onClose();
              }}
              className="bg-[#1e3a5f] hover:bg-[#24466e] text-white font-bold flex items-center justify-center gap-2 py-6 rounded-xl shadow-lg hover:scale-105 transition-all"
            >
              <Mail size={20} />
              E-mail
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
          <p className="text-xs text-gray-500">
            O convite será aberto no aplicativo correspondente com o texto formatado.
          </p>
        </div>
      </div>
    </div>
  );
};
