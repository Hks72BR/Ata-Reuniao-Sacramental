/**
 * Utilitários para comunicação com oradores via WhatsApp e E-mail
 */

import { formatDate } from './utils';

interface InvitationData {
  speakerName: string;
  date: string;
  theme?: string;
  timeLimit?: string;
  wardName?: string;
}

/**
 * Gera o link do WhatsApp com a mensagem pré-preenchida
 */
export function getWhatsAppLink(data: InvitationData): string {
  const message = encodeURIComponent(
    `*📜 Convite para Discursante - ${data.wardName || 'Ala Casa Grande'}*\n\n` +
    `Olá, *${data.speakerName}*,\n\n` +
    `É com muita alegria que o convidamos para compartilhar uma mensagem inspiradora em nossa próxima *Reunião Sacramental*. Sua preparação e testemunho serão uma bênção para todos nós.\n\n` +
    `📅 *Detalhes da Designação:*\n` +
    `• *Data:* ${formatDate(data.date)}\n` +
    (data.theme ? `• *Tema:* ${data.theme}\n` : '') +
    (data.timeLimit ? `• *Tempo:* ${data.timeLimit} minutos\n` : '') +
    `\n` +
    `_"Pois onde estiverem dois ou três reunidos em meu nome, ali estou eu no meio deles." (Mateus 18:20)_\n\n` +
    `Agradecemos imensamente por sua disposição em servir. Por favor, confirme o recebimento deste convite.\n\n` +
    `Atenciosamente,\n` +
    `*Bispado da ${data.wardName || 'Ala Casa Grande'}*`
  );

  return `https://wa.me/?text=${message}`;
}

/**
 * Gera o link mailto para envio de e-mail
 */
export function getEmailLink(data: InvitationData): string {
  const subject = encodeURIComponent(`Convite para Discursante - ${data.wardName || 'Ala Casa Grande'}`);
  const body = encodeURIComponent(
    `Olá, ${data.speakerName},\n\n` +
    `É com muita alegria que o convidamos para compartilhar uma mensagem inspiradora em nossa próxima Reunião Sacramental. Sua preparação e testemunho serão uma bênção para todos nós.\n\n` +
    `Detalhes da Designação:\n` +
    `Data: ${formatDate(data.date)}\n` +
    (data.theme ? `Tema: ${data.theme}\n` : '') +
    (data.timeLimit ? `Tempo: ${data.timeLimit} minutos\n` : '') +
    `\n` +
    `"Pois onde estiverem dois ou três reunidos em meu nome, ali estou eu no meio deles." (Mateus 18:20)\n\n` +
    `Agradecemos imensamente por sua disposição em servir. Por favor, confirme o recebimento deste convite.\n\n` +
    `Atenciosamente,\n` +
    `Bispado da ${data.wardName || 'Ala Casa Grande'}`
  );

  return `mailto:?subject=${subject}&body=${body}`;
}

/**
 * Abre o link do WhatsApp em uma nova aba
 */
export function sendWhatsAppInvitation(data: InvitationData): void {
  window.open(getWhatsAppLink(data), '_blank');
}

/**
 * Abre o cliente de e-mail padrão
 */
export function sendEmailInvitation(data: InvitationData): void {
  window.location.href = getEmailLink(data);
}
