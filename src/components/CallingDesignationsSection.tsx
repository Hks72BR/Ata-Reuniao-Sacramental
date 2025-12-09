/**
 * Seção de Designações de Chamados
 * Preenche automaticamente com membros apoiados e permite registrar a designação
 */

import { useEffect } from 'react';
import { InputField } from '@/components/FormField';
import { CallingDesignationItem, SupportAndReleaseItem } from '@/types';
import { UserCheck, Calendar } from 'lucide-react';

interface CallingDesignationsSectionProps {
  items: CallingDesignationItem[];
  onItemsChange: (items: CallingDesignationItem[]) => void;
  supportAndReleaseItems: SupportAndReleaseItem[];
  meetingDate: string;
  errors?: { [key: string]: string };
}

export function CallingDesignationsSection({
  items,
  onItemsChange,
  supportAndReleaseItems,
  meetingDate,
  errors,
}: CallingDesignationsSectionProps) {

  // Sincronizar automaticamente com membros apoiados
  useEffect(() => {
    const supportedMembers = supportAndReleaseItems.filter(item => item.type === 'support');
    
    // Adicionar novos membros apoiados que não estão na lista de designações
    const newDesignations: CallingDesignationItem[] = supportedMembers
      .filter(supportItem => 
        !items.some(designation => 
          designation.fullName === supportItem.fullName && 
          designation.callingName === supportItem.callingName
        )
      )
      .map(supportItem => ({
        id: `${supportItem.id}-designation`,
        fullName: supportItem.fullName,
        callingName: supportItem.callingName || '',
        supportedDate: meetingDate,
        designatedBy: '',
        designationDate: '',
        notes: '',
      }));

    if (newDesignations.length > 0) {
      onItemsChange([...items, ...newDesignations]);
    }

    // Remover designações cujos membros foram removidos dos apoiados
    const validDesignations = items.filter(designation =>
      supportedMembers.some(supportItem =>
        supportItem.fullName === designation.fullName &&
        supportItem.callingName === designation.callingName
      )
    );

    if (validDesignations.length !== items.length) {
      onItemsChange(validDesignations);
    }
  }, [supportAndReleaseItems, meetingDate]);

  const updateDesignation = (id: string, field: keyof CallingDesignationItem, value: string) => {
    const updatedItems = items.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );
    onItemsChange(updatedItems);
  };

  if (items.length === 0) {
    return (
      <div className="reverent-card">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-foreground mb-2 font-serif">
            Designações de Chamados
          </h3>
          <p className="text-sm text-gray-600">
            Membros apoiados aparecerão aqui automaticamente para registrar quando foram designados
          </p>
        </div>
        
        <div className="text-center py-8 text-gray-500">
          <UserCheck size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            Nenhum membro foi apoiado nesta reunião.<br />
            Adicione apoios na seção "Apoio e Desobrigação" acima.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="reverent-card">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-foreground mb-2 font-serif">
          Designações de Chamados
        </h3>
        <p className="text-sm text-gray-600">
          Registre quando os membros apoiados foram designados por imposição de mãos
        </p>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className={`p-5 rounded-lg border-2 transition-all ${
              item.designatedBy && item.designationDate
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
                : 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-300'
            }`}
          >
            {/* Cabeçalho com informações do apoio */}
            <div className="mb-4 pb-4 border-b-2 border-current/10">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-[#1e3a5f]">
                    {item.fullName}
                  </h4>
                  <p className="text-sm text-[#1e3a5f]/70">
                    <span className="font-semibold">Chamado:</span> {item.callingName}
                  </p>
                </div>
                
                {item.designatedBy && item.designationDate ? (
                  <span className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                    <UserCheck size={14} />
                    Designado
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-yellow-600 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                    <Calendar size={14} />
                    Pendente
                  </span>
                )}
              </div>
              
              <p className="text-xs text-[#1e3a5f]/60">
                <span className="font-semibold">Apoiado em:</span>{' '}
                {new Date(item.supportedDate).toLocaleDateString('pt-BR')}
              </p>
            </div>

            {/* Campos de Designação */}
            <div className="space-y-3">
              <InputField
                label="Designado por"
                value={item.designatedBy || ''}
                onChange={(e) => updateDesignation(item.id, 'designatedBy', e.target.value)}
                placeholder="Nome de quem designou (membro do bispado)"
                error={errors?.[`designation-${item.id}-designatedBy`]}
              />

              <InputField
                type="date"
                label="Data da Designação"
                value={item.designationDate || ''}
                onChange={(e) => updateDesignation(item.id, 'designationDate', e.target.value)}
                error={errors?.[`designation-${item.id}-designationDate`]}
              />

              <InputField
                label="Observações (opcional)"
                value={item.notes || ''}
                onChange={(e) => updateDesignation(item.id, 'notes', e.target.value)}
                placeholder="Informações adicionais sobre a designação"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
