/**
 * Tipos compartilhados para a Ata Sacramental
 * Estrutura de dados para o formulário de ata sacramental SUD
 */

export interface SacramentalRecord {
  id?: string;
  date: string; // ISO date format
  meetingType?: 'regular' | 'testimony'; // Tipo de reunião
  
  // Presidência e Direção
  presidedBy: string; // Apenas letras
  directedBy: string;
  recognitions: string;
  pianist: string;
  conductor: string;
  receptionist: string;
  
  // Anúncios
  announcements: string; // Máximo 1000 caracteres
  
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
  type: 'confirmation' | 'child-blessing'; // confirmação ou apresentação de criança
  fullName: string;
  performedBy?: string; // Quem realizou a ordenança
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

export interface FormErrors {
  [key: string]: string;
}

export const SACRAMENTAL_RECORD_INITIAL: Partial<SacramentalRecord> = {
  date: new Date().toISOString().split('T')[0],
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
