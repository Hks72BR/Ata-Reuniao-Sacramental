/**
 * Modal de Boas-Vindas - Ata de Conselho de Ala
 * Exibido na primeira vez que o usuário acessa
 */

import { BookOpen, AlertCircle, Trash2, CheckSquare, Heart, Users, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WardCouncilWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WardCouncilWelcomeModal({ isOpen, onClose }: WardCouncilWelcomeModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    // Marcar que o usuário já viu o aviso
    localStorage.setItem('wardcouncil_welcome_seen', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative bg-gradient-to-br from-slate-50 to-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-teal-200/50">
        {/* Header com gradiente */}
        <div className="relative bg-gradient-to-br from-teal-700 via-emerald-700 to-teal-800 p-10 rounded-t-3xl overflow-hidden">
          {/* Padrão de fundo */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-300 rounded-full mix-blend-overlay filter blur-3xl"></div>
          </div>

          <div className="relative flex items-start gap-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
              <Users size={40} className="text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-4xl font-bold text-white mb-2 font-['Playfair_Display']">
                Bem-vindos, Líderes
              </h2>
              <p className="text-teal-100 text-lg font-['Poppins']">Conselho da Ala Casa Grande</p>
              <p className="text-teal-200 text-sm mt-2 font-['Poppins'] italic">
                Sistema de Organização e Registro
              </p>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-10 space-y-8">
          {/* Mensagem de Boas-Vindas */}
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center gap-2 bg-teal-50 px-6 py-3 rounded-full border border-teal-300">
              <Shield size={20} className="text-teal-700" />
              <span className="text-teal-900 font-semibold font-['Poppins'] text-sm">
                Sistema Sagrado de Organização
              </span>
            </div>
            <p className="text-gray-700 text-lg leading-relaxed font-['Poppins'] max-w-2xl mx-auto">
              Prezados Irmãos e Irmãs, esta ferramenta foi desenvolvida para auxiliar na 
              <strong className="text-teal-800"> organização e ordem das coisas do Senhor</strong>. 
              Usem com sabedoria, reverência e responsabilidade.
            </p>
          </div>

          {/* Alertas importantes em grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Acesso Restrito */}
            <div className="group p-6 bg-gradient-to-br from-red-50 to-red-100/50 border-2 border-red-300 rounded-2xl hover:shadow-lg transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                  <AlertCircle size={24} className="text-white" />
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="font-bold text-red-900 text-lg font-['Playfair_Display']">
                    Acesso Restrito
                  </h3>
                  <p className="text-red-800 text-sm leading-relaxed font-['Poppins']">
                    <strong>EXCLUSIVO</strong> aos membros do Conselho da Ala. 
                    Por favor, <strong>NÃO DIVULGUE</strong> o PIN de acesso. 
                    Proteja a confidencialidade das informações sagradas.
                  </p>
                </div>
              </div>
            </div>

            {/* Exclusão de Atas */}
            <div className="group p-6 bg-gradient-to-br from-amber-50 to-amber-100/50 border-2 border-amber-300 rounded-2xl hover:shadow-lg transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                  <Trash2 size={24} className="text-white" />
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="font-bold text-amber-900 text-lg font-['Playfair_Display']">
                    Exclusão Controlada
                  </h3>
                  <p className="text-amber-800 text-sm leading-relaxed font-['Poppins']">
                    Para excluir atas, entre em contato com o 
                    <strong> Irmão Higor Coelho</strong>. Toda exclusão 
                    deve ser registrada e justificada.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Como Usar - Card maior */}
          <div className="p-8 bg-gradient-to-br from-teal-50 via-emerald-50 to-teal-50 border-2 border-teal-300 rounded-2xl shadow-sm">
            <div className="flex items-start gap-5 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen size={28} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-teal-900 text-2xl font-['Playfair_Display'] mb-2">
                  Como Utilizar este Sistema
                </h3>
                <p className="text-teal-700 font-['Poppins'] text-sm">
                  Instruções para uso correto e responsável
                </p>
              </div>
            </div>
            
            <div className="space-y-5 ml-1">
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-teal-900 mb-1 font-['Poppins']">
                    Campos de Organizações
                  </h4>
                  <p className="text-teal-800 text-sm leading-relaxed">
                    Cada organização possui campos específicos. Sejam honestos e preencham 
                    <strong> apenas as informações pertinentes à sua organização</strong>.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-emerald-900 mb-1 font-['Poppins']">
                    Itens de Ação
                  </h4>
                  <p className="text-emerald-800 text-sm leading-relaxed">
                    Registrem ações planejadas até a próxima reunião. 
                    Acompanhem o progresso e <strong>marquem os itens concluídos</strong> para 
                    manter todos informados.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 bg-teal-700 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-teal-900 mb-1 font-['Poppins']">
                    Sincronização em Nuvem
                  </h4>
                  <p className="text-teal-800 text-sm leading-relaxed">
                    Todas as atas são automaticamente salvas no Firebase. 
                    <strong> Todos os líderes autorizados</strong> podem acessar e acompanhar as informações.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mensagem Final */}
          <div className="relative p-8 bg-gradient-to-r from-teal-800 via-emerald-800 to-teal-900 rounded-2xl overflow-hidden shadow-xl">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]"></div>
            </div>
            
            <div className="relative flex items-center gap-6">
              <Heart size={48} className="text-teal-300 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-white text-xl leading-relaxed font-['Playfair_Display'] italic mb-2">
                  "Que possamos encontrar sempre mais alegria em servir ao Senhor nosso Deus, 
                  organizando Seu reino com ordem e reverência."
                </p>
                <p className="text-teal-200 text-sm font-['Poppins']">
                  — Sistema de Atas Sacramentais
                </p>
              </div>
            </div>
          </div>

          {/* Botão de Confirmação */}
          <div className="flex justify-center pt-6">
            <Button
              onClick={handleConfirm}
              className="bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 hover:from-teal-700 hover:via-emerald-700 hover:to-teal-700 text-white px-12 py-7 text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl hover:scale-105 active:scale-95 transition-all duration-300 font-['Poppins']"
            >
              <CheckSquare size={28} className="mr-3" />
              Compreendo e Aceito
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
