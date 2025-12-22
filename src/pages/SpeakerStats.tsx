/**
 * Página de Estatísticas de Oradores
 * Mostra ranking de quem mais discursou nas reuniões sacramentais
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MembersListModal } from '@/components/MembersListModal';
import { getAllRecords } from '@/lib/db';
import { getMembersListFromCloud, saveMembersListToCloud } from '@/lib/firestore';
import { SacramentalRecord } from '@/types';
import { ArrowLeft, TrendingUp, Users, UserPlus, UserCheck, UserX } from 'lucide-react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';

interface SpeakerStat {
  name: string;
  count: number;
}

export default function SpeakerStats() {
  const [stats, setStats] = useState<SpeakerStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalMeetings, setTotalMeetings] = useState(0);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [allMembers, setAllMembers] = useState<string[]>([]);
  const [, setLocation] = useLocation();

  useEffect(() => {
    loadStats();
    loadMembersList();
  }, []);

  const loadMembersList = async () => {
    try {
      const members = await getMembersListFromCloud();
      setAllMembers(members);
    } catch (error) {
      console.error('Erro ao carregar lista de membros:', error);
      toast.error('Erro ao carregar lista de membros do Firebase');
    }
  };

  const handleSaveMembersList = async (members: string[]) => {
    try {
      await saveMembersListToCloud(members);
      setAllMembers(members);
      toast.success(`Lista salva com ${members.length} membros no Firebase! ☁️`);
    } catch (error) {
      console.error('Erro ao salvar lista:', error);
      toast.error('Erro ao salvar lista no Firebase');
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      const records = await getAllRecords();
      
      // Contar apenas reuniões com oradores (não testemunhos)
      const meetingsWithSpeakers = records.filter(
        r => r.meetingType !== 'testimony' && (r.firstSpeaker || r.secondSpeaker || r.lastSpeaker)
      );
      
      setTotalMeetings(meetingsWithSpeakers.length);

      // Mapear todos os oradores
      const speakerCount = new Map<string, number>();

      meetingsWithSpeakers.forEach((record: SacramentalRecord) => {
        // Processar cada orador
        [record.firstSpeaker, record.secondSpeaker, record.lastSpeaker].forEach(speaker => {
          if (speaker && speaker.trim()) {
            const normalizedName = speaker.trim();
            speakerCount.set(normalizedName, (speakerCount.get(normalizedName) || 0) + 1);
          }
        });
      });

      // Converter para array e ordenar por quantidade
      const statsArray: SpeakerStat[] = Array.from(speakerCount.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      setStats(statsArray);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular quem ainda não discursou
  const speakersNames = new Set(stats.map(s => s.name.toLowerCase().trim()));
  const notSpokenYet = allMembers.filter(
    member => !speakersNames.has(member.toLowerCase().trim())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a3a52] via-[#1e3a5f] to-[#24466e] shadow-xl">
        <div className="container max-w-5xl mx-auto py-8 px-4">
          <div className="flex items-center gap-4 mb-6">
            <Button
              onClick={() => setLocation('/sacramental')}
              className="bg-white border-2 border-[#d4a574] text-[#1e3a5f] hover:bg-[#d4a574] hover:text-white transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 font-semibold flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              Voltar
            </Button>
          </div>
          
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-xl border-2 border-[#d4a574] flex items-center justify-center shadow-lg">
              <TrendingUp size={40} className="text-[#d4a574]" />
            </div>
            <div>
              <h1 className="text-5xl font-bold text-white font-playfair mb-2">
                Estatísticas de Oradores
              </h1>
              <p className="text-[#d4a574] text-lg">
                Controle de participação nas reuniões sacramentais
              </p>
            </div>
          </div>

          {/* Resumo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border-2 border-[#d4a574]/30 hover:border-[#d4a574]/60 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <UserCheck className="text-[#d4a574]" size={28} />
                <p className="text-white/80 text-sm uppercase tracking-wide">Já Discursaram</p>
              </div>
              <p className="text-white text-4xl font-bold pl-1">{stats.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border-2 border-[#d4a574]/30 hover:border-[#d4a574]/60 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="text-[#d4a574]" size={28} />
                <p className="text-white/80 text-sm uppercase tracking-wide">Reuniões Registradas</p>
              </div>
              <p className="text-white text-4xl font-bold pl-1">{totalMeetings}</p>
            </div>
          </div>

          {/* Botão para gerenciar lista */}
          {allMembers.length === 0 && (
            <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border-2 border-[#d4a574]/30">
              <p className="text-white/90 text-sm mb-3">
                💡 Adicione a lista completa de membros da ala para ver quem ainda não discursou
              </p>
              <Button
                onClick={() => setShowMembersModal(true)}
                className="bg-[#d4a574] text-white hover:bg-[#c49564] font-semibold flex items-center gap-2"
              >
                <UserPlus size={18} />
                Adicionar Lista de Membros
              </Button>
            </div>
          )}
          {allMembers.length > 0 && (
            <div className="mt-4 flex justify-end">
              <Button
                onClick={() => setShowMembersModal(true)}
                className="bg-white/10 text-white border-2 border-white/30 hover:bg-white/20 font-semibold flex items-center gap-2"
              >
                <Users size={18} />
                Editar Lista ({allMembers.length} membros)
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="container max-w-5xl mx-auto py-10 px-4">
        {loading ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center border-2 border-[#1e3a5f]/10">
            <div className="animate-pulse">
              <TrendingUp size={64} className="mx-auto text-[#d4a574] mb-4" />
              <p className="text-[#1e3a5f] text-lg font-medium">Carregando estatísticas...</p>
            </div>
          </div>
        ) : stats.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-16 text-center border-2 border-[#1e3a5f]/10">
            <Users size={80} className="mx-auto text-[#d4a574] mb-6" />
            <h2 className="text-[#1e3a5f] text-2xl font-bold mb-3">
              Nenhum orador registrado ainda
            </h2>
            <p className="text-gray-600 text-lg">
              Crie atas com oradores para ver as estatísticas aqui
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-[#1e3a5f]/10">
              {/* Cabeçalho da tabela */}
              <div className="bg-gradient-to-r from-[#1e3a5f] to-[#24466e] text-white px-8 py-5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg flex-1">Nome do Orador</span>
                  <span className="font-bold text-lg w-32 text-right">Discursos</span>
                </div>
              </div>

              {/* Lista de oradores */}
              <div className="divide-y divide-gray-200">
                {stats.map((speaker) => (
                  <div
                    key={speaker.name}
                    className="px-8 py-5 flex items-center justify-between hover:bg-gradient-to-r hover:from-[#d4a574]/5 hover:to-transparent transition-all duration-200"
                  >
                    {/* Nome */}
                    <div className="flex-1">
                      <span className="text-[#1e3a5f] font-semibold text-xl">
                        {speaker.name}
                      </span>
                    </div>

                    {/* Contador */}
                    <div className="w-32 text-right">
                      <span className="inline-flex items-center justify-center min-w-[4rem] px-5 py-3 rounded-xl bg-gradient-to-br from-[#d4a574] to-[#c49564] text-white font-bold text-xl shadow-md">
                        {speaker.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lista de quem ainda não discursou */}
            {allMembers.length > 0 && notSpokenYet.length > 0 && (
              <div className="mt-8 bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-[#1e3a5f]/10">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <UserX size={28} />
                      <span className="font-bold text-lg">Ainda Não Discursaram</span>
                    </div>
                    <span className="bg-white/20 px-4 py-2 rounded-full font-bold">
                      {notSpokenYet.length}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {notSpokenYet.map((member) => (
                      <div
                        key={member}
                        className="p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
                      >
                        <span className="text-[#1e3a5f] font-medium">
                          {member}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de gerenciamento de membros */}
      <MembersListModal
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        onSave={handleSaveMembersList}
        currentMembers={allMembers}
      />
    </div>
  );
}
