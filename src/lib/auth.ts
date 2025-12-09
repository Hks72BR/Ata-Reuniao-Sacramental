/**
 * Configuração de PINs de Acesso
 * 
 * INSTRUÇÕES PARA ALTERAR OS PINs:
 * 1. Mude os valores abaixo para seus PINs desejados (4 dígitos)
 * 2. Faça commit e push para o GitHub
 * 3. O Vercel fará deploy automático
 * 
 * IMPORTANTE: Mantenha este arquivo privado no repositório
 */

export const AUTH_CONFIG = {
  // PIN para acessar Ata Sacramental (Bispado)
  SACRAMENTAL_PIN: '1234', // ALTERE AQUI para o PIN do Bispado
  
  // PIN para acessar Ata Batismal (Missionários)
  BAPTISMAL_PIN: '5678', // ALTERE AQUI para o PIN dos Missionários
  
  // Chaves de sessão (não alterar)
  SACRAMENTAL_SESSION_KEY: 'sacramental_auth',
  BAPTISMAL_SESSION_KEY: 'baptismal_auth',
  
  // Mensagens
  SACRAMENTAL_TITLE: 'Acesso Restrito - Bispado',
  SACRAMENTAL_DESCRIPTION: 'Digite o PIN de 4 dígitos fornecido ao Bispado',
  
  BAPTISMAL_TITLE: 'Acesso Restrito - Missionários',
  BAPTISMAL_DESCRIPTION: 'Digite o PIN de 4 dígitos fornecido aos Missionários',
};

/**
 * Verifica se está autenticado
 */
export function isAuthenticated(sessionKey: string): boolean {
  return sessionStorage.getItem(sessionKey) === 'true';
}

/**
 * Remove autenticação (logout)
 */
export function logout(sessionKey: string): void {
  sessionStorage.removeItem(sessionKey);
}

/**
 * Limpar todas as autenticações
 */
export function logoutAll(): void {
  sessionStorage.removeItem(AUTH_CONFIG.SACRAMENTAL_SESSION_KEY);
  sessionStorage.removeItem(AUTH_CONFIG.BAPTISMAL_SESSION_KEY);
}
