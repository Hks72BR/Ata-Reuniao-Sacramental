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

// PINs ausentes ou inválidos desabilitam o acesso correspondente.
function readConfiguredPin(name: string, value: string | undefined): string {
  if (value && /^\d{4}$/.test(value)) return value;
  console.error(`${name} ausente ou inválido: configure quatro dígitos no ambiente.`);
  return '';
}

export function matchesConfiguredPin(enteredPin: string, configuredPin: string): boolean {
  return /^\d{4}$/.test(configuredPin) && enteredPin === configuredPin;
}

export const AUTH_CONFIG = {
  SACRAMENTAL_PIN: readConfiguredPin('VITE_SACRAMENTAL_PIN', import.meta.env.VITE_SACRAMENTAL_PIN),
  BAPTISMAL_PIN: readConfiguredPin('VITE_BAPTISMAL_PIN', import.meta.env.VITE_BAPTISMAL_PIN),
  WARD_COUNCIL_PIN: readConfiguredPin('VITE_WARD_COUNCIL_PIN', import.meta.env.VITE_WARD_COUNCIL_PIN),
  DELETE_PIN: readConfiguredPin('VITE_DELETE_PIN', import.meta.env.VITE_DELETE_PIN),
  // Se não houver PIN específico, utiliza o PIN administrativo de exclusão configurado.
  WARD_COUNCIL_ADMIN_PIN: readConfiguredPin('VITE_WARD_COUNCIL_ADMIN_PIN ou VITE_DELETE_PIN', import.meta.env.VITE_WARD_COUNCIL_ADMIN_PIN || import.meta.env.VITE_DELETE_PIN),
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
  let timestampKey: string;
  if (sessionKey === AUTH_CONFIG.SACRAMENTAL_SESSION_KEY) {
    timestampKey = AUTH_CONFIG.SACRAMENTAL_TIMESTAMP_KEY;
  } else if (sessionKey === AUTH_CONFIG.BAPTISMAL_SESSION_KEY) {
    timestampKey = AUTH_CONFIG.BAPTISMAL_TIMESTAMP_KEY;
  } else if (sessionKey === AUTH_CONFIG.WARD_COUNCIL_SESSION_KEY) {
    timestampKey = AUTH_CONFIG.WARD_COUNCIL_TIMESTAMP_KEY;
  } else {
    // Fallback
    timestampKey = AUTH_CONFIG.BAPTISMAL_TIMESTAMP_KEY;
  }
  
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

export function hasCouncilAccess(): boolean {
  return isAuthenticated(AUTH_CONFIG.WARD_COUNCIL_SESSION_KEY) || isAuthenticated(AUTH_CONFIG.SACRAMENTAL_SESSION_KEY);
}

/**
 * Validar PIN de Exclusão
 * Retorna true se o PIN estiver correto
 */
export function validateDeletePin(enteredPin: string): boolean {
  return matchesConfiguredPin(enteredPin, AUTH_CONFIG.DELETE_PIN);
}

/**
 * Remove autenticação (logout)
 */
export function logout(sessionKey: string): void {
  sessionStorage.removeItem(sessionKey);
  
  // Remover timestamp correspondente
  let timestampKey: string;
  if (sessionKey === AUTH_CONFIG.SACRAMENTAL_SESSION_KEY) {
    timestampKey = AUTH_CONFIG.SACRAMENTAL_TIMESTAMP_KEY;
  } else if (sessionKey === AUTH_CONFIG.BAPTISMAL_SESSION_KEY) {
    timestampKey = AUTH_CONFIG.BAPTISMAL_TIMESTAMP_KEY;
  } else if (sessionKey === AUTH_CONFIG.WARD_COUNCIL_SESSION_KEY) {
    timestampKey = AUTH_CONFIG.WARD_COUNCIL_TIMESTAMP_KEY;
  } else {
    // Fallback
    timestampKey = AUTH_CONFIG.BAPTISMAL_TIMESTAMP_KEY;
  }
  
  sessionStorage.removeItem(timestampKey);
}

/**
 * Limpar todas as autenticações
 */
export function logoutAll(): void {
  sessionStorage.removeItem(AUTH_CONFIG.SACRAMENTAL_SESSION_KEY);
  sessionStorage.removeItem(AUTH_CONFIG.BAPTISMAL_SESSION_KEY);
  sessionStorage.removeItem(AUTH_CONFIG.WARD_COUNCIL_SESSION_KEY);
  sessionStorage.removeItem(AUTH_CONFIG.SACRAMENTAL_TIMESTAMP_KEY);
  sessionStorage.removeItem(AUTH_CONFIG.BAPTISMAL_TIMESTAMP_KEY);
  sessionStorage.removeItem(AUTH_CONFIG.WARD_COUNCIL_TIMESTAMP_KEY);
}
