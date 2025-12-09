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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Hero Section Moderno */}
      <div className="relative w-full overflow-hidden">
        {/* Background animado com padrões geométricos */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-32 left-20 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        {/* Conteúdo Hero */}
        <div className="relative container max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center mb-16">
            {/* Logo flutuante com glassmorphism */}
            <div className="inline-flex items-center justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-3xl blur-2xl opacity-50 animate-pulse"></div>
                <div className="relative w-32 h-32 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl flex items-center justify-center transform hover:scale-110 transition-all duration-500">
                  <img 
                    src="/church_logo.png" 
                    alt="Ala Casa Grande"
                    className="w-24 h-24 object-contain drop-shadow-2xl"
                  />
                </div>
              </div>
            </div>

            {/* Título com efeito gradiente */}
            <h1 className="text-5xl md:text-7xl font-bold mb-4 font-['Playfair_Display']">
              <span className="text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                Sistema de Atas
              </span>
            </h1>
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/20">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              <p className="text-white/90 text-lg font-['Poppins'] font-medium">
                Ala Casa Grande
              </p>
            </div>
            <p className="text-white/60 text-sm mt-4 font-['Poppins']">
              Igreja de Jesus Cristo dos Santos dos Últimos Dias
            </p>
          </div>
        </div>
      </div>

      {/* Cards de Seleção - Estilo Moderno Glassmorphism */}
      <div className="container max-w-6xl mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Card Ata Sacramental */}
          <button
            onClick={handleSacramentalClick}
            className="group relative overflow-hidden bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl hover:shadow-cyan-500/50 transition-all duration-500 hover:scale-105 hover:border-cyan-400/50 active:scale-95 p-10"
          >
            {/* Efeito de brilho ao passar o mouse */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/0 via-blue-400/0 to-indigo-400/0 group-hover:from-cyan-400/10 group-hover:via-blue-400/5 group-hover:to-indigo-400/10 transition-all duration-500"></div>
            
            <div className="relative z-10">
              {/* Icon com efeito neon */}
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/50 group-hover:shadow-2xl group-hover:shadow-cyan-400/60 transition-all duration-500 group-hover:rotate-6">
                <FileText size={48} className="text-white" />
              </div>

              {/* Title */}
              <h3 className="text-3xl font-bold text-white mb-4 font-['Playfair_Display'] group-hover:text-cyan-300 transition-colors">
                Ata Sacramental
              </h3>

              {/* Description */}
              <p className="text-white/70 mb-6 font-['Poppins'] text-sm leading-relaxed">
                Reuniões sacramentais, testemunhos, oradores, apoios e designações
              </p>

              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-cyan-500/20 backdrop-blur-sm px-4 py-2 rounded-full border border-cyan-400/30">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <span className="text-cyan-300 text-xs font-semibold uppercase tracking-wider">Bispado</span>
              </div>

              {/* Arrow */}
              <div className="mt-6 text-cyan-400 group-hover:translate-x-3 transition-transform duration-300 flex items-center justify-center">
                <span className="text-3xl">→</span>
              </div>
            </div>
          </button>

          {/* Card Ata Batismal */}
          <button
            onClick={handleBaptismalClick}
            className="group relative overflow-hidden bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl hover:shadow-emerald-500/50 transition-all duration-500 hover:scale-105 hover:border-emerald-400/50 active:scale-95 p-10"
          >
            {/* Efeito de brilho ao passar o mouse */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/0 via-teal-400/0 to-cyan-400/0 group-hover:from-emerald-400/10 group-hover:via-teal-400/5 group-hover:to-cyan-400/10 transition-all duration-500"></div>
            
            <div className="relative z-10">
              {/* Icon com efeito neon */}
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/50 group-hover:shadow-2xl group-hover:shadow-emerald-400/60 transition-all duration-500 group-hover:rotate-6">
                <Droplets size={48} className="text-white" />
              </div>

              {/* Title */}
              <h3 className="text-3xl font-bold text-white mb-4 font-['Playfair_Display'] group-hover:text-emerald-300 transition-colors">
                Ata Batismal
              </h3>

              {/* Description */}
              <p className="text-white/70 mb-6 font-['Poppins'] text-sm leading-relaxed">
                Serviços batismais, ordenanças, testemunhas e boas-vindas das organizações
              </p>

              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 backdrop-blur-sm px-4 py-2 rounded-full border border-emerald-400/30">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-emerald-300 text-xs font-semibold uppercase tracking-wider">Lider de missão da Ala e Missionários</span>
              </div>

              {/* Arrow */}
              <div className="mt-6 text-emerald-400 group-hover:translate-x-3 transition-transform duration-300 flex items-center justify-center">
                <span className="text-3xl">→</span>
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
