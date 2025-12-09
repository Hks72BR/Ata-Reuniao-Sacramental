/**
 * Dashboard - Menu de Seleção de Tipo de Ata
 * Permite escolher entre Ata Sacramental ou Ata Batismal
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { FileText, Droplets } from 'lucide-react';
import { PinAuthModal } from '@/components/PinAuthModal';
import { AUTH_CONFIG } from '@/lib/auth';

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [showSacramentalAuth, setShowSacramentalAuth] = useState(false);
  const [showBaptismalAuth, setShowBaptismalAuth] = useState(false);

  const handleSacramentalClick = () => {
    setShowSacramentalAuth(true);
  };

  const handleBaptismalClick = () => {
    setShowBaptismalAuth(true);
  };

  const handleSacramentalSuccess = () => {
    setShowSacramentalAuth(false);
    setLocation('/sacramental');
  };

  const handleBaptismalSuccess = () => {
    setShowBaptismalAuth(false);
    setLocation('/baptismal');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Hero Header */}
      <div className="relative w-full bg-gradient-to-br from-[#1e3f5f] via-[#264a6f] to-[#2e5680] py-20 shadow-2xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.2) 0%, transparent 50%)`,
          }}></div>
        </div>
        
        <div className="relative z-10 text-center px-4">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full border-2 border-white/30 flex items-center justify-center shadow-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 font-['Playfair_Display']">
            Sistema de Atas
          </h1>
          <p className="text-xl text-white/90 font-['Poppins']">
            A Igreja de Jesus Cristo dos Santos dos Últimos Dias
          </p>
        </div>
      </div>

      {/* Cards de Seleção */}
      <div className="container max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-[#1e3f5f] mb-4 font-['Playfair_Display']">
          Selecione o Tipo de Ata
        </h2>
        <p className="text-center text-gray-600 mb-12 font-['Poppins']">
          Escolha qual tipo de registro você deseja criar ou visualizar
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Card Ata Sacramental */}
          <button
            onClick={handleSacramentalClick}
            className="group relative overflow-hidden bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 active:scale-95 border-4 border-[#1e3f5f] p-8"
          >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1e3f5f]/5 to-[#264a6f]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10">
              {/* Icon */}
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#1e3f5f] to-[#264a6f] flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                <FileText size={40} className="text-white" />
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-[#1e3a5f] mb-3 font-['Playfair_Display']">
                Ata Sacramental
              </h3>

              {/* Description */}
              <p className="text-gray-600 mb-6 font-['Poppins']">
                Registre reuniões sacramentais, testemunhos, oradores, apoios e designações de chamados
              </p>

              {/* Arrow */}
              <div className="mt-6 text-[#1e3a5f] group-hover:translate-x-2 transition-transform duration-300">
                <span className="text-2xl">→</span>
              </div>
            </div>
          </button>

          {/* Card Ata Batismal */}
          <button
            onClick={handleBaptismalClick}
            className="group relative overflow-hidden bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 active:scale-95 border-4 border-[#1e8b9f] p-8"
          >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1e8b9f]/5 to-[#16a085]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10">
              {/* Icon */}
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#1e8b9f] to-[#16a085] flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                <Droplets size={40} className="text-white" />
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-[#1e8b9f] mb-3 font-['Playfair_Display']">
                Ata Batismal
              </h3>

              {/* Description */}
              <p className="text-gray-600 mb-6 font-['Poppins']">
                Registre serviços batismais, ordenanças, testemunhas e boas-vindas das organizações
              </p>

              {/* Arrow */}
              <div className="mt-6 text-[#1e8b9f] group-hover:translate-x-2 transition-transform duration-300">
                <span className="text-2xl">→</span>
              </div>
            </div>
          </button>
        </div>

        {/* Footer Info */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500 font-['Poppins']">
            💾 Todos os registros são salvos automaticamente no Firebase Cloud
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Compartilhado com todos os usuários autorizados
          </p>
        </div>
      </div>

      {/* Modais de Autenticação */}
      <PinAuthModal
        isOpen={showSacramentalAuth}
        onClose={() => setShowSacramentalAuth(false)}
        onSuccess={handleSacramentalSuccess}
        title={AUTH_CONFIG.SACRAMENTAL_TITLE}
        description={AUTH_CONFIG.SACRAMENTAL_DESCRIPTION}
        correctPin={AUTH_CONFIG.SACRAMENTAL_PIN}
        storageKey={AUTH_CONFIG.SACRAMENTAL_SESSION_KEY}
      />

      <PinAuthModal
        isOpen={showBaptismalAuth}
        onClose={() => setShowBaptismalAuth(false)}
        onSuccess={handleBaptismalSuccess}
        title={AUTH_CONFIG.BAPTISMAL_TITLE}
        description={AUTH_CONFIG.BAPTISMAL_DESCRIPTION}
        correctPin={AUTH_CONFIG.BAPTISMAL_PIN}
        storageKey={AUTH_CONFIG.BAPTISMAL_SESSION_KEY}
      />
    </div>
  );
}
