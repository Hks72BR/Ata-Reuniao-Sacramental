/**
 * Dashboard - Menu de Seleção de Tipo de Ata
 * Permite escolher entre Ata Sacramental ou Ata Batismal
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { FileText, Droplets, Users } from 'lucide-react';
import { PinAuthModal } from '@/components/PinAuthModal';
import { AUTH_CONFIG } from '@/lib/auth';

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [showSacramentalAuth, setShowSacramentalAuth] = useState(false);
  const [showBaptismalAuth, setShowBaptismalAuth] = useState(false);
  const [showBishopricAuth, setShowBishopricAuth] = useState(false);
  const [showWardCouncilAuth, setShowWardCouncilAuth] = useState(false);

  const handleSacramentalClick = () => {
    setShowSacramentalAuth(true);
  };

  const handleBaptismalClick = () => {
    setShowBaptismalAuth(true);
  };

  const handleBishopricClick = () => {
    setShowBishopricAuth(true);
  };

  const handleWardCouncilClick = () => {
    setShowWardCouncilAuth(true);
  };

  const handleSacramentalSuccess = () => {
    setShowSacramentalAuth(false);
    setLocation('/sacramental');
  };

  const handleBaptismalSuccess = () => {
    setShowBaptismalAuth(false);
    setLocation('/baptismal');
  };

  const handleBishopricSuccess = () => {
    setShowBishopricAuth(false);
    setLocation('/bishopric');
  };

  const handleWardCouncilSuccess = () => {
    setShowWardCouncilAuth(false);
    setLocation('/wardcouncil');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900">
      {/* Hero Section Moderno */}
      <div className="relative w-full overflow-hidden">
        {/* Background animado com padrões geométricos */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-800 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-800 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-32 left-20 w-96 h-96 bg-slate-700 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        {/* Conteúdo Hero */}
        <div className="relative container max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center mb-16">
            {/* Logo flutuante com glassmorphism */}
            <div className="inline-flex items-center justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl blur-2xl opacity-40 animate-pulse"></div>
                <div className="relative w-32 h-32 bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-amber-700/30 shadow-2xl flex items-center justify-center transform hover:scale-110 transition-all duration-500">
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
            <div className="inline-flex items-center gap-3 bg-slate-800/50 backdrop-blur-md px-6 py-3 rounded-full border border-amber-700/30">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {/* Card Ata Sacramental */}
          <button
            onClick={handleSacramentalClick}
            className="group relative overflow-hidden bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl hover:shadow-blue-900/50 transition-all duration-500 hover:scale-105 hover:border-blue-700/50 active:scale-95 p-10"
          >
            {/* Efeito de brilho ao passar o mouse */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/0 via-slate-700/0 to-indigo-900/0 group-hover:from-blue-900/20 group-hover:via-slate-700/10 group-hover:to-indigo-900/20 transition-all duration-500"></div>
            
            <div className="relative z-10">
              {/* Icon com efeito neon */}
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-center shadow-lg shadow-blue-900/30 group-hover:shadow-2xl group-hover:shadow-blue-800/40 transition-all duration-500 group-hover:rotate-6">
                <FileText size={48} className="text-white" />
              </div>

              {/* Title */}
              <h3 className="text-3xl font-bold text-white mb-4 font-['Playfair_Display'] group-hover:text-blue-300 transition-colors">
                Ata Sacramental
              </h3>

              {/* Description */}
              <p className="text-slate-300 mb-6 font-['Poppins'] text-sm leading-relaxed">
                Reuniões sacramentais, testemunhos, oradores, apoios e designações
              </p>

              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-blue-900/30 backdrop-blur-sm px-4 py-2 rounded-full border border-blue-700/40">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-blue-300 text-xs font-semibold uppercase tracking-wider">Bispado</span>
              </div>

              {/* Arrow */}
              <div className="mt-6 text-blue-400 group-hover:translate-x-3 transition-transform duration-300 flex items-center justify-center">
                <span className="text-3xl">→</span>
              </div>
            </div>
          </button>

          {/* Card Ata Batismal */}
          <button
            onClick={handleBaptismalClick}
            className="group relative overflow-hidden bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl hover:shadow-teal-900/50 transition-all duration-500 hover:scale-105 hover:border-teal-700/50 active:scale-95 p-10"
          >
            {/* Efeito de brilho ao passar o mouse */}
            <div className="absolute inset-0 bg-gradient-to-br from-teal-900/0 via-slate-700/0 to-cyan-900/0 group-hover:from-teal-900/20 group-hover:via-slate-700/10 group-hover:to-cyan-900/20 transition-all duration-500"></div>
            
            <div className="relative z-10">
              {/* Icon com efeito neon */}
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-teal-900 to-teal-800 flex items-center justify-center shadow-lg shadow-teal-900/30 group-hover:shadow-2xl group-hover:shadow-teal-800/40 transition-all duration-500 group-hover:rotate-6">
                <Droplets size={48} className="text-white" />
              </div>

              {/* Title */}
              <h3 className="text-3xl font-bold text-white mb-4 font-['Playfair_Display'] group-hover:text-teal-300 transition-colors">
                Ata Batismal
              </h3>

              {/* Description */}
              <p className="text-slate-300 mb-6 font-['Poppins'] text-sm leading-relaxed">
                Serviços batismais, ordenanças, testemunhas e boas-vindas das organizações
              </p>

              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-teal-900/30 backdrop-blur-sm px-4 py-2 rounded-full border border-teal-700/40">
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
                <span className="text-teal-300 text-xs font-semibold uppercase tracking-wider">Lider de missão da Ala e Missionários</span>
              </div>

              {/* Arrow */}
              <div className="mt-6 text-teal-400 group-hover:translate-x-3 transition-transform duration-300 flex items-center justify-center">
                <span className="text-3xl">→</span>
              </div>
            </div>
          </button>

          {/* Card Reunião de Bispado */}
          <button
            onClick={handleBishopricClick}
            className="group relative overflow-hidden bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl hover:shadow-indigo-900/50 transition-all duration-500 hover:scale-105 hover:border-indigo-700/50 active:scale-95 p-10"
          >
            {/* Efeito de brilho ao passar o mouse */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/0 via-slate-700/0 to-purple-900/0 group-hover:from-indigo-900/20 group-hover:via-slate-700/10 group-hover:to-purple-900/20 transition-all duration-500"></div>
            
            <div className="relative z-10">
              {/* Icon com efeito neon */}
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-900 to-indigo-800 flex items-center justify-center shadow-lg shadow-indigo-900/30 group-hover:shadow-2xl group-hover:shadow-indigo-800/40 transition-all duration-500 group-hover:rotate-6">
                <Users size={48} className="text-white" />
              </div>

              {/* Title */}
              <h3 className="text-3xl font-bold text-white mb-4 font-['Playfair_Display'] group-hover:text-indigo-300 transition-colors">
                Reunião de Bispado
              </h3>

              {/* Description */}
              <p className="text-slate-300 mb-6 font-['Poppins'] text-sm leading-relaxed">
                Reuniões administrativas, decisões e ações do bispado
              </p>

              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-indigo-900/30 backdrop-blur-sm px-4 py-2 rounded-full border border-indigo-700/40">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                <span className="text-indigo-300 text-xs font-semibold uppercase tracking-wider">Liderança</span>
              </div>

              {/* Arrow */}
              <div className="mt-6 text-indigo-400 group-hover:translate-x-3 transition-transform duration-300 flex items-center justify-center">
                <span className="text-3xl">→</span>
              </div>
            </div>
          </button>

          {/* Card Conselho de Ala */}
          <button
            onClick={handleWardCouncilClick}
            className="group relative overflow-hidden bg-slate-800/60 backdrop-blur-xl rounded-3xl border border-purple-500/30 shadow-2xl hover:shadow-purple-900/60 transition-all duration-500 hover:scale-105 hover:border-purple-400/60 active:scale-95 p-10"
          >
            {/* Efeito de brilho ao passar o mouse */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/0 via-indigo-900/0 to-purple-900/0 group-hover:from-purple-900/30 group-hover:via-indigo-900/20 group-hover:to-purple-900/30 transition-all duration-500"></div>
            
            <div className="relative z-10">
              {/* Icon com efeito neon */}
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-800 via-indigo-800 to-purple-900 flex items-center justify-center shadow-lg shadow-purple-900/40 group-hover:shadow-2xl group-hover:shadow-purple-700/50 transition-all duration-500 group-hover:rotate-6 border border-purple-500/20">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>

              {/* Title */}
              <h3 className="text-3xl font-bold text-white mb-4 font-['Playfair_Display'] group-hover:text-purple-200 transition-colors">
                Conselho de Ala
              </h3>

              {/* Description */}
              <p className="text-slate-300 mb-6 font-['Poppins'] text-sm leading-relaxed">
                Reuniões de conselho, assuntos das organizações e itens de ação
              </p>

              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-purple-900/40 backdrop-blur-sm px-4 py-2 rounded-full border border-purple-500/40">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span className="text-purple-200 text-xs font-semibold uppercase tracking-wider">Organizações</span>
              </div>

              {/* Arrow */}
              <div className="mt-6 text-purple-400 group-hover:translate-x-3 transition-transform duration-300 flex items-center justify-center">
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
        timestampKey={AUTH_CONFIG.SACRAMENTAL_TIMESTAMP_KEY}
      />

      <PinAuthModal
        isOpen={showBaptismalAuth}
        onClose={() => setShowBaptismalAuth(false)}
        onSuccess={handleBaptismalSuccess}
        title={AUTH_CONFIG.BAPTISMAL_TITLE}
        description={AUTH_CONFIG.BAPTISMAL_DESCRIPTION}
        correctPin={AUTH_CONFIG.BAPTISMAL_PIN}
        storageKey={AUTH_CONFIG.BAPTISMAL_SESSION_KEY}
        timestampKey={AUTH_CONFIG.BAPTISMAL_TIMESTAMP_KEY}
      />

      <PinAuthModal
        isOpen={showBishopricAuth}
        onClose={() => setShowBishopricAuth(false)}
        onSuccess={handleBishopricSuccess}
        title="Reunião de Bispado"
        description="Digite o PIN para acessar as atas de reunião de bispado"
        correctPin={AUTH_CONFIG.SACRAMENTAL_PIN}
        storageKey={AUTH_CONFIG.SACRAMENTAL_SESSION_KEY}
        timestampKey={AUTH_CONFIG.SACRAMENTAL_TIMESTAMP_KEY}
      />

      <PinAuthModal
        isOpen={showWardCouncilAuth}
        onClose={() => setShowWardCouncilAuth(false)}
        onSuccess={handleWardCouncilSuccess}
        title={AUTH_CONFIG.WARD_COUNCIL_TITLE}
        description={AUTH_CONFIG.WARD_COUNCIL_DESCRIPTION}
        correctPin={AUTH_CONFIG.WARD_COUNCIL_PIN}
        storageKey={AUTH_CONFIG.WARD_COUNCIL_SESSION_KEY}
        timestampKey={AUTH_CONFIG.WARD_COUNCIL_TIMESTAMP_KEY}
      />
    </div>
  );
}
