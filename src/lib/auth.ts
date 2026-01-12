/**
 * Configuração de Autenticação Segura
 * 
 * SEGURANÇA:
 * - PINs são carregados de variáveis de ambiente
 * - Sessões expiram após 8 horas de inatividade
 * - Rate limiting para prevenir força bruta
 * 
 * CONFIGURAÇÃO:
 * 1. Configure as variáveis no arquivo .env (desenvolvimento)
 * 2. Configure no Vercel Dashboard > Settings > Environment Variables (produção)
 */

// Tempo de expiração da sessão (8 horas em milissegundos)
const SESSION_TIMEOUT = 8 * 60 * 60 * 1000;

// Configuração de rate limiting
const MAX_ATTEMPTS = 5; // Máximo de tentativas
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutos de bloqueio

// Configuração de PINs
// SACRAMENTAL: pega do Vercel (variável de ambiente)
// BAPTISMAL: hardcoded no código
// WARD_COUNCIL: pega do Vercel (variável de ambiente)
// DELETE: PIN especial para exclusão de atas (variável de ambiente)
const SACRAMENTAL_PIN_FROM_ENV = import.meta.env.VITE_SACRAMENTAL_PIN;
const WARD_COUNCIL_PIN_FROM_ENV = import.meta.env.VITE_WARD_COUNCIL_PIN;
const DELETE_PIN_FROM_ENV = import.meta.env.VITE_DELETE_PIN;

// Validar PIN do Sacramental
function validateSacramentalPin(pin: string | undefined): string {
  const fallback = '2026';
  
  if (!pin) {
    if (import.meta.env.DEV) {
      console.warn(`⚠️ SACRAMENTAL_PIN não configurado, usando fallback: ${fallback}`);
    }
    return fallback;
  }
  
  if (!/^\d{4}$/.test(pin)) {
    console.error(`❌ SACRAMENTAL_PIN inválido: "${pin}" (deve ter exatamente 4 dígitos)`);
    console.warn(`⚠️ Usando fallback: ${fallback}`);
    return fallback;
  }
  
  if (import.meta.env.DEV) {
    console.log(`✅ SACRAMENTAL_PIN configurado corretamente`);
  }
  
  return pin;
}

// Validar PIN do Conselho da Ala
function validateWardCouncilPin(pin: string | undefined): string {
  const fallback = '2027';
  
  if (!pin) {
    if (import.meta.env.DEV) {
      console.warn(`⚠️ WARD_COUNCIL_PIN não configurado, usando fallback: ${fallback}`);
    }
    return fallback;
  }
  
  if (!/^\d{4}$/.test(pin)) {
    console.error(`❌ WARD_COUNCIL_PIN inválido: "${pin}" (deve ter exatamente 4 dígitos)`);
    console.warn(`⚠️ Usando fallback: ${fallback}`);
    return fallback;
  }
  
  if (import.meta.env.DEV) {
    console.log(`✅ WARD_COUNCIL_PIN configurado corretamente`);
  }
  
  return pin;
}

// Validar PIN de Exclusão (configuração)
function getDeletePinFromEnv(pin: string | undefined): string {
  const fallback = '9999';
  
  if (!pin) {
    if (import.meta.env.DEV) {
      console.warn(`⚠️ DELETE_PIN não configurado, usando fallback: ${fallback}`);
    }
    return fallback;
  }
  
  if (!/^\d{4}$/.test(pin)) {
    console.error(`❌ DELETE_PIN inválido: "${pin}" (deve ter exatamente 4 dígitos)`);
    console.warn(`⚠️ Usando fallback: ${fallback}`);
    return fallback;
  }
  
  if (import.meta.env.DEV) {
    console.log(`✅ DELETE_PIN configurado corretamente`);
  }
  
  return pin;
}

if (import.meta.env.DEV) {
  console.log('🔐 Auth Config - Sacramental: variável ambiente | Batismal: hardcoded | Conselho Ala: variável ambiente | Delete: variável ambiente');
}

export const AUTH_CONFIG = {
  // Sacramental: pega do Vercel
  SACRAMENTAL_PIN: validateSacramentalPin(SACRAMENTAL_PIN_FROM_ENV),
  // Batismal: hardcoded
  BAPTISMAL_PIN: '2015',
  // Conselho da Ala: pega do Vercel
  WARD_COUNCIL_PIN: validateWardCouncilPin(WARD_COUNCIL_PIN_FROM_ENV),
  // Delete: PIN especial para exclusão (variável de ambiente)
  DELETE_PIN: getDeletePinFromEnv(DELETE_PIN_FROM_ENV),
  
  // Chaves de sessão (não alterar)
  SACRAMENTAL_SESSION_KEY: 'sacramental_auth',
  BAPTISMAL_SESSION_KEY: 'baptismal_auth',
  WARD_COUNCIL_SESSION_KEY: 'wardcouncil_auth',
  
  // Chaves de timestamp
  SACRAMENTAL_TIMESTAMP_KEY: 'sacramental_auth_time',
  BAPTISMAL_TIMESTAMP_KEY: 'baptismal_auth_time',
  WARD_COUNCIL_TIMESTAMP_KEY: 'wardcouncil_auth_time',
  
  // Chaves de rate limiting
  ATTEMPTS_KEY: 'auth_attempts',
  LOCKOUT_KEY: 'auth_lockout',
  
  // Mensagens
  SACRAMENTAL_TITLE: 'Acesso Restrito - Bispado',
  SACRAMENTAL_DESCRIPTION: 'Digite o PIN de 4 dígitos fornecido ao Bispado',
  
  BAPTISMAL_TITLE: 'Acesso Restrito - Missionários',
  BAPTISMAL_DESCRIPTION: 'Digite o PIN de 4 dígitos fornecido aos Missionários',
  
  WARD_COUNCIL_TITLE: 'Acesso Restrito - Conselho da Ala',
  WARD_COUNCIL_DESCRIPTION: 'Digite o PIN de 4 dígitos fornecido aos Líderes',
};

/**
 * Interface para dados de rate limiting
 */
interface RateLimitData {
  attempts: number;
  firstAttempt: number;
}

/**
 * Verificar se está em lockout (bloqueado por muitas tentativas)
 */
export function isLockedOut(): { locked: boolean; remainingTime?: number } {
  const lockoutEnd = localStorage.getItem(AUTH_CONFIG.LOCKOUT_KEY);
  
  if (!lockoutEnd) {
    return { locked: false };
  }
  
  const lockoutTime = parseInt(lockoutEnd, 10);
  const now = Date.now();
  
  if (now < lockoutTime) {
    const remainingTime = Math.ceil((lockoutTime - now) / 1000 / 60); // minutos
    return { locked: true, remainingTime };
  }
  
  // Lockout expirou, limpar
  localStorage.removeItem(AUTH_CONFIG.LOCKOUT_KEY);
  localStorage.removeItem(AUTH_CONFIG.ATTEMPTS_KEY);
  return { locked: false };
}

/**
 * Registrar tentativa de login
 */
export function recordLoginAttempt(success: boolean): void {
  if (success) {
    // Login bem-sucedido, limpar tentativas
    localStorage.removeItem(AUTH_CONFIG.ATTEMPTS_KEY);
    localStorage.removeItem(AUTH_CONFIG.LOCKOUT_KEY);
    return;
  }
  
  // Login falhou, registrar tentativa
  const attemptsData = localStorage.getItem(AUTH_CONFIG.ATTEMPTS_KEY);
  let data: RateLimitData;
  
  if (attemptsData) {
    data = JSON.parse(attemptsData);
    data.attempts += 1;
  } else {
    data = {
      attempts: 1,
      firstAttempt: Date.now(),
    };
  }
  
  // Se passou 15 minutos desde a primeira tentativa, resetar
  if (Date.now() - data.firstAttempt > LOCKOUT_TIME) {
    data = {
      attempts: 1,
      firstAttempt: Date.now(),
    };
  }
  
  localStorage.setItem(AUTH_CONFIG.ATTEMPTS_KEY, JSON.stringify(data));
  
  // Se atingiu o máximo de tentativas, bloquear
  if (data.attempts >= MAX_ATTEMPTS) {
    const lockoutEnd = Date.now() + LOCKOUT_TIME;
    localStorage.setItem(AUTH_CONFIG.LOCKOUT_KEY, lockoutEnd.toString());
  }
}

/**
 * Obter número de tentativas restantes
 */
export function getRemainingAttempts(): number {
  const attemptsData = localStorage.getItem(AUTH_CONFIG.ATTEMPTS_KEY);
  
  if (!attemptsData) {
    return MAX_ATTEMPTS;
  }
  
  const data: RateLimitData = JSON.parse(attemptsData);
  
  // Se passou 15 minutos, resetar
  if (Date.now() - data.firstAttempt > LOCKOUT_TIME) {
    localStorage.removeItem(AUTH_CONFIG.ATTEMPTS_KEY);
    return MAX_ATTEMPTS;
  }
  
  return Math.max(0, MAX_ATTEMPTS - data.attempts);
}

/**
 * Verificar se a sessão expirou
 */
function isSessionExpired(timestampKey: string): boolean {
  const timestamp = sessionStorage.getItem(timestampKey);
  
  if (!timestamp) {
    return true;
  }
  
  const sessionTime = parseInt(timestamp, 10);
  const now = Date.now();
  
  return (now - sessionTime) > SESSION_TIMEOUT;
}

/**
 * Atualizar timestamp da sessão
 */
function updateSessionTimestamp(timestampKey: string): void {
  sessionStorage.setItem(timestampKey, Date.now().toString());
}

/**
 * Verifica se está autenticado e se a sessão não expirou
 */
export function isAuthenticated(sessionKey: string): boolean {
  const isAuth = sessionStorage.getItem(sessionKey) === 'true';
  
  if (!isAuth) {
    return false;
  }
  
  // Determinar qual timestamp key usar
  const timestampKey = sessionKey === AUTH_CONFIG.SACRAMENTAL_SESSION_KEY
    ? AUTH_CONFIG.SACRAMENTAL_TIMESTAMP_KEY
    : AUTH_CONFIG.BAPTISMAL_TIMESTAMP_KEY;
  
  // Verificar se sessão expirou
  if (isSessionExpired(timestampKey)) {
    logout(sessionKey);
    return false;
  }
  
  // Atualizar timestamp (renovar sessão)
  updateSessionTimestamp(timestampKey);
  
  return true;
}

/**
 * Realizar login (verificar PIN)
 */
export function login(sessionKey: string, timestampKey: string): void {
  sessionStorage.setItem(sessionKey, 'true');
  updateSessionTimestamp(timestampKey);
}

/**
 * Validar PIN de Exclusão
 * Retorna true se o PIN estiver correto
 */
export function validateDeletePin(enteredPin: string): boolean {
  return enteredPin === AUTH_CONFIG.DELETE_PIN;
}

/**
 * Remove autenticação (logout)
 */
export function logout(sessionKey: string): void {
  sessionStorage.removeItem(sessionKey);
  
  // Remover timestamp correspondente
  const timestampKey = sessionKey === AUTH_CONFIG.SACRAMENTAL_SESSION_KEY
    ? AUTH_CONFIG.SACRAMENTAL_TIMESTAMP_KEY
    : AUTH_CONFIG.BAPTISMAL_TIMESTAMP_KEY;
  
  sessionStorage.removeItem(timestampKey);
}

/**
 * Limpar todas as autenticações
 */
export function logoutAll(): void {
  sessionStorage.removeItem(AUTH_CONFIG.SACRAMENTAL_SESSION_KEY);
  sessionStorage.removeItem(AUTH_CONFIG.BAPTISMAL_SESSION_KEY);
  sessionStorage.removeItem(AUTH_CONFIG.SACRAMENTAL_TIMESTAMP_KEY);
  sessionStorage.removeItem(AUTH_CONFIG.BAPTISMAL_TIMESTAMP_KEY);
}
