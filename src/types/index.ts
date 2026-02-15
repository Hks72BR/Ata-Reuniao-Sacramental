/**
 * Tipos compartilhados para a Ata Sacramental
 * Estrutura de dados para o formulário de ata sacramental SUD
 */

export interface SacramentalRecord {
  id?: string;
  date: string; // ISO date format
  meetingType?: 'regular' | 'testimony'; // Tipo de reunião
  attendance?: number; // Frequência da reunião
  
  // Presidência e Direção
  presidedBy: string; // Apenas letras
  directedBy: string;
  recognitions: string;
  pianist: string;
  conductor: string;
  receptionist: string;
  
  // Anúncios
  announcements: string; // Máximo 1000 caracteres
  stakeAnnouncements?: string; // Anúncios da Estaca - Máximo 500 caracteres
  
  // Hinos e Orações
  firstHymn: string;
  firstPrayer: string;
  
  // Apoio e Desobrigação
  supportAndRelease: SupportAndReleaseItem[];
  
  // Ordenanças (confirmações, apresentações)
  ordinances: OrdinanceItem[];
  
  // Designações de Chamados
  callingDesignations: CallingDesignationItem[];
  
  // Hino Sacramental
  sacramentalHymn: string;
  
  // Oradores (apenas para reunião regular)
  firstSpeaker: string;
  secondSpeaker: string;
  
  // Hino Intermediário (apenas para reunião regular)
  intermediateHymn: string;
  
  // Último Orador (apenas para reunião regular)
  lastSpeaker: string;
  
  // Testemunhos (apenas para reunião de testemunhos - 1º domingo)
  testimonies?: string; // Máximo 2000 caracteres
  
  // Último Hino e Oração
  lastHymn: string;
  lastPrayer: string;
  
  // Metadados
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'completed' | 'archived';
  
  // Log de alterações
  createdBy?: string; // Nome de quem criou
  lastEditedBy?: string; // Nome de quem editou por último
  lastEditedAt?: string; // Data/hora da última edição
  deletedBy?: string; // Nome de quem excluiu (para soft delete futuro)
}

export interface SupportAndReleaseItem {
  id: string;
  type: 'release' | 'support'; // desobrigação ou apoio
  fullName: string;
  position?: string; // Para desobrigação
  callingName?: string; // Para apoio
  notes?: string;
}

export interface OrdinanceItem {
  id: string;
  type: 'confirmation' | 'child-blessing' | 'new-member-support'; // confirmação, apresentação de criança ou apoio a membro novo
  fullName: string;
  performedBy?: string; // Quem realizou a ordenança (não usado para new-member-support)
  notes?: string;
}

export interface CallingDesignationItem {
  id: string;
  fullName: string;
  callingName: string;
  supportedDate: string; // Data que foi apoiado (data da ata)
  designatedBy?: string; // Quem designou
  designationDate?: string; // Data da designação
  notes?: string;
}

// ============================================
// TIPOS PARA ATA BATISMAL
// ============================================

export interface BaptismalRecord {
  id?: string;
  date: string; // ISO date format
  
  // Presidência e Direção
  presidedBy: string;
  directedBy: string;
  pianist: string;
  conductor: string;
  
  // Abertura
  openingHymn: string;
  openingPrayer: string;
  
  // Programa
  testimony: string; // Testemunho
  message: string; // Mensagem
  specialPresentation?: string; // Apresentação especial (opcional)
  
  // Parte Batismal
  baptismLocation: 'same-room' | 'baptism-room'; // Se está na sacramental ou sala separada
  personBeingBaptized: string; // Nome completo da pessoa batizada
  personPerformingBaptism: string; // Quem realiza a ordenança
  witnesses: string[]; // Testemunhas do batismo (array de nomes)
  
  // Ordenanças (Confirmação de Batismo)
  ordinances: OrdinanceItem[]; // Confirmações de batismo e outras ordenanças
  
  // Encerramento
  closingHymn: string;
  closingPrayer: string;
  
  // Metadados
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'completed' | 'archived';
}

export interface WelcomeOrganizationItem {
  id: string;
  organizationName: string; // Ex: "Presidência das Moças", "Presidência dos Rapazes"
  welcomeGivenBy: string; // Nome de quem deu as boas vindas
  notes?: string;
}

// ============================================
// TIPOS PARA ATA DE REUNIÃO DE BISPADO
// ============================================

export interface BishopricRecord {
  id?: string;
  date: string; // ISO date format
  
  // Dados básicos
  presidedBy: string;
  openingPrayer: string;
  
  // Assuntos tratados
  discussedMatters: string; // Bloco de notas para registro
  
  // Ações para próxima reunião (checklist)
  actionItems: ActionItem[];
  
  // Encerramento
  closingPrayer: string;
  
  // Metadados
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'completed' | 'archived';
  createdBy?: string;
  lastEditedBy?: string;
  lastEditedAt?: string;
}

export interface ActionItem {
  id: string;
  description: string;
  responsible?: string; // Responsável pela ação
  completed: boolean;
  notes?: string;
}

export interface FormErrors {
  [key: string]: string;
}

export const SACRAMENTAL_RECORD_INITIAL: Partial<SacramentalRecord> = {
  date: new Date().toISOString().split('T')[0],
  attendance: undefined,
  presidedBy: '',
  directedBy: '',
  recognitions: '',
  pianist: '',
  conductor: '',
  receptionist: '',
  announcements: '',
  firstHymn: '',
  firstPrayer: '',
  supportAndRelease: [],
  ordinances: [],
  callingDesignations: [],
  sacramentalHymn: '',
  firstSpeaker: '',
  secondSpeaker: '',
  intermediateHymn: '',
  lastSpeaker: '',
  lastHymn: '',
  lastPrayer: '',
  status: 'draft',
};

export const BAPTISMAL_RECORD_INITIAL: Partial<BaptismalRecord> = {
  date: new Date().toISOString().split('T')[0],
  presidedBy: '',
  directedBy: '',
  pianist: '',
  conductor: '',
  openingHymn: '',
  openingPrayer: '',
  testimony: '',
  message: '',
  specialPresentation: '',
  baptismLocation: 'same-room',
  personBeingBaptized: '',
  personPerformingBaptism: '',
  witnesses: ['', ''],
  ordinances: [],
  closingHymn: '',
  closingPrayer: '',
  status: 'draft',
};

export const BISHOPRIC_RECORD_INITIAL: Partial<BishopricRecord> = {
  date: new Date().toISOString().split('T')[0],
  presidedBy: '',
  openingPrayer: '',
  discussedMatters: '',
  actionItems: [],
  closingPrayer: '',
  status: 'draft',
};

// ============================================
// TIPOS PARA ATA DE CONSELHO DE ALA
// ============================================

export interface WardCouncilRecord {
  id?: string;
  date: string; // ISO date format
  
  // Dados básicos
  presidedBy: string;
  directedBy: string;
  openingPrayer: string;
  
  // Assuntos tratados por organização
  organizationMatters: OrganizationMatters;
  
  // Itens de ação (checklist)
  actionItems: ActionItem[];
  
  // Encerramento
  closingPrayer: string;
  
  // Metadados
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'completed' | 'archived';
  createdBy?: string;
  lastEditedBy?: string;
  lastEditedAt?: string;
}

export interface OrganizationMatters {
  rapazes: string; // Assuntos dos Rapazes
  mocas: string; // Assuntos das Moças
  socorro: string; // Sociedade de Socorro
  elderes: string; // Quórum de Elderes
  missionaria: string; // Obra Missionária
  primaria: string; // Primária
}

export const WARD_COUNCIL_RECORD_INITIAL: Partial<WardCouncilRecord> = {
  date: new Date().toISOString().split('T')[0],
  presidedBy: '',
  directedBy: '',
  openingPrayer: '',
  organizationMatters: {
    rapazes: '',
    mocas: '',
    socorro: '',
    elderes: '',
    missionaria: '',
    primaria: '',
  },
  actionItems: [],
  closingPrayer: '',
  status: 'draft',
};

// ============================================
// TIPOS PARA ENTREVISTAS DO BISPADO
// ============================================

export interface InterviewRecord {
  id?: string;
  date: string; // ISO date format
  scheduledBy: string; // Quem agendou (secretário da ala ou executivo)
  interviews: InterviewItem[];
  createdAt: string;
  updatedAt: string;
}

export interface InterviewItem {
  id: string;
  personName: string; // Nome da pessoa a ser entrevistada
  scheduledDate: string; // Data agendada
  scheduledTime: string; // Horário agendado
  responsibleMember?: string; // Membro do bispado responsável
  completed: boolean; // Se a entrevista foi realizada
  notes?: string; // Observações
}

export const INTERVIEW_RECORD_INITIAL: Partial<InterviewRecord> = {
  date: new Date().toISOString().split('T')[0],
  scheduledBy: '',
  interviews: [],
};

export const VALIDATION_RULES = {
  presidedBy: {
    required: true,
    pattern: /^[a-zA-ZáéíóúàâêôãõçÁÉÍÓÚÀÂÊÔÃÕÇ\s]*$/,
    maxLength: 100,
    message: 'Apenas letras são permitidas',
  },
  announcements: {
    maxLength: 1000,
    message: 'Máximo de 1000 caracteres',
  },
  fullName: {
    required: true,
    pattern: /^[a-zA-ZáéíóúàâêôãõçÁÉÍÓÚÀÂÊÔÃÕÇ\s]*$/,
    message: 'Apenas letras são permitidas',
  },
};
