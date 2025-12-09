/**
 * Funções utilitárias centralizadas
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { SacramentalRecord, FormErrors } from '@/types';

/**
 * Combina classes CSS com Tailwind
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Verifica se uma data é o primeiro domingo do mês
 */
export function isFirstSunday(dateString: string): boolean {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  // Verifica se é domingo (0 = domingo)
  if (date.getDay() !== 0) {
    return false;
  }
  
  // Verifica se é o primeiro domingo (dia 1-7)
  return day >= 1 && day <= 7;
}

/**
 * Gerar texto formatado da ata para exportação
 */
export function generateRecordText(record: SacramentalRecord): string {
  let text = `ATA SACRAMENTAL\n`;
  text += `Data: ${formatDate(record.date)}\n`;
  text += `${'='.repeat(60)}\n\n`;

  text += `PRESIDÊNCIA E DIREÇÃO\n`;
  text += `${'-'.repeat(60)}\n`;
  text += `Presidida por: ${record.presidedBy}\n`;
  text += `Dirigida por: ${record.directedBy}\n`;
  text += `Reconhecimentos: ${record.recognitions}\n`;
  text += `Pianista: ${record.pianist}\n`;
  text += `Regente: ${record.conductor}\n`;
  text += `Recepcionista: ${record.receptionist}\n\n`;

  text += `ANÚNCIOS\n`;
  text += `${'-'.repeat(60)}\n`;
  text += `${record.announcements}\n\n`;

  text += `ORDEM DO SERVIÇO\n`;
  text += `${'-'.repeat(60)}\n`;
  text += `1º Hino: ${record.firstHymn}\n`;
  text += `1ª Oração: ${record.firstPrayer}\n\n`;

  text += `APOIO E DESOBRIGAÇÃO\n`;
  text += `${'-'.repeat(60)}\n`;
  record.supportAndRelease.forEach((item) => {
    if (item.type === 'release') {
      text += `Desobrigação: ${item.fullName} - Posição: ${item.position}\n`;
    } else {
      text += `Apoio: ${item.fullName} - Chamado: ${item.callingName}\n`;
    }
  });
  text += `\n`;

  text += `HINO SACRAMENTAL\n`;
  text += `${'-'.repeat(60)}\n`;
  text += `${record.sacramentalHymn}\n\n`;

  // Renderização condicional: Oradores ou Testemunhos
  if (record.meetingType === 'testimony' || isFirstSunday(record.date)) {
    text += `REUNIÃO DE TESTEMUNHOS\n`;
    text += `${'-'.repeat(60)}\n`;
    text += `Primeiro Domingo do Mês\n`;
    text += `\nMembros que Prestaram Testemunho:\n`;
    text += `${record.testimonies || 'Nenhum testemunho registrado'}\n\n`;
  } else {
    text += `ORADORES\n`;
    text += `${'-'.repeat(60)}\n`;
    text += `1º Orador: ${record.firstSpeaker}\n`;
    text += `2º Orador: ${record.secondSpeaker}\n`;
    text += `Hino Intermediário: ${record.intermediateHymn}\n`;
    text += `Último Orador: ${record.lastSpeaker}\n\n`;
  }

  text += `HINOS E ORAÇÃO FINAL\n`;
  text += `${'-'.repeat(60)}\n`;
  text += `Último Hino: ${record.lastHymn}\n`;
  text += `Última Oração: ${record.lastPrayer}\n`;

  return text;
}

/**
 * Formatar data para exibição (sem problema de timezone)
 */
export function formatDate(dateString: string): string {
  // Usar a data sem conversão de timezone
  const [year, month, day] = dateString.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  
  return date.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Validar data no formato ISO
 */
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Validar se uma string contém apenas letras (com acentos)
 */
export function isOnlyLetters(str: string): boolean {
  return /^[a-zA-ZáéíóúàâêôãõçÁÉÍÓÚÀÂÊÔÃÕÇ\s]*$/.test(str);
}

/**
 * Validar formulário completo
 */
export function validateRecord(record: Partial<SacramentalRecord>): FormErrors {
  const errors: FormErrors = {};

  // Validar presidedBy (obrigatório)
  if (!record.presidedBy?.trim()) {
    errors.presidedBy = 'Presidência é obrigatória';
  } else if (!isOnlyLetters(record.presidedBy)) {
    errors.presidedBy = 'Apenas letras são permitidas';
  }

  // Validar directedBy
  if (record.directedBy && !isOnlyLetters(record.directedBy)) {
    errors.directedBy = 'Apenas letras são permitidas';
  }

  // Validar recognitions
  if (record.recognitions && !isOnlyLetters(record.recognitions)) {
    errors.recognitions = 'Apenas letras são permitidas';
  }

  // Validar pianist
  if (record.pianist && !isOnlyLetters(record.pianist)) {
    errors.pianist = 'Apenas letras são permitidas';
  }

  // Validar conductor
  if (record.conductor && !isOnlyLetters(record.conductor)) {
    errors.conductor = 'Apenas letras são permitidas';
  }

  // Validar receptionist
  if (record.receptionist && !isOnlyLetters(record.receptionist)) {
    errors.receptionist = 'Apenas letras são permitidas';
  }

  // Validar anúncios (máximo 1000 caracteres)
  if (record.announcements && record.announcements.length > 1000) {
    errors.announcements = 'Máximo de 1000 caracteres';
  }

  // Validar data
  if (record.date && !isValidDate(record.date)) {
    errors.date = 'Data inválida';
  }

  // Validar oradores
  if (record.firstSpeaker && !isOnlyLetters(record.firstSpeaker)) {
    errors.firstSpeaker = 'Apenas letras são permitidas';
  }

  if (record.secondSpeaker && !isOnlyLetters(record.secondSpeaker)) {
    errors.secondSpeaker = 'Apenas letras são permitidas';
  }

  if (record.lastSpeaker && !isOnlyLetters(record.lastSpeaker)) {
    errors.lastSpeaker = 'Apenas letras são permitidas';
  }

  // Validar orações
  if (record.firstPrayer && !isOnlyLetters(record.firstPrayer)) {
    errors.firstPrayer = 'Apenas letras são permitidas';
  }

  if (record.lastPrayer && !isOnlyLetters(record.lastPrayer)) {
    errors.lastPrayer = 'Apenas letras são permitidas';
  }

  return errors;
}

/**
 * Baixar arquivo de texto
 */
export function downloadTextFile(content: string, filename: string): void {
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

/**
 * Gerar ID único
 */
export function generateId(): string {
  return `ata-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Formatar data para nome de arquivo
 */
export function formatDateForFilename(dateString: string): string {
  return dateString.replace(/\//g, '-');
}

/**
 * Gerar PDF a partir de elemento HTML
 * @param element - Elemento HTML a ser convertido
 * @param filename - Nome do arquivo PDF
 */
export async function generatePDF(element: HTMLElement, filename: string): Promise<void> {
  // Importação dinâmica para evitar problemas de SSR
  const html2pdf = (await import('html2pdf.js')).default;
  
  // Obter dimensões do conteúdo
  const contentHeight = element.scrollHeight;
  const contentWidth = element.scrollWidth;
  
  // Calcular proporções para ajustar à página
  const a4WidthMM = 210;
  const a4HeightMM = 297;
  const margin = 10;
  const availableWidth = a4WidthMM - (margin * 2);
  
  // Calcular altura necessária mantendo proporção
  const scale = availableWidth / (contentWidth * 0.264583); // Converter px para mm
  const calculatedHeight = (contentHeight * 0.264583 * scale) + (margin * 2);
  
  const opt = {
    margin: [margin, margin, margin, margin] as [number, number, number, number],
    filename: filename,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      logging: false,
      letterRendering: true,
      scrollY: 0,
      scrollX: 0,
    },
    jsPDF: { 
      unit: 'mm' as const, 
      format: [a4WidthMM, Math.max(calculatedHeight, a4HeightMM)] as [number, number], 
      orientation: 'portrait' as const
    },
    pagebreak: { mode: 'avoid-all' as const }
  };

  try {
    await html2pdf().set(opt).from(element).save();
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw new Error('Falha ao gerar PDF');
  }
}
