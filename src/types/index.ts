/**
 * Tipos compartilhados para a Ata Sacramental
 * Estrutura de dados para o formulário de ata sacramental SUD
 */

export interface SacramentalRecord {
  id?: string;
  date: string; // ISO date format
  
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
  
  // Hino Sacramental
  sacramentalHymn: string;
  
  // Oradores
  firstSpeaker: string;
  secondSpeaker: string;
  
  // Hino Intermediário
  intermediateHymn: string;
  
  // Último Orador
  lastSpeaker: string;
  
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
