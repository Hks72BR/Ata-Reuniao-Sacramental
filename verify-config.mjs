#!/usr/bin/env node

/**
 * Script de Verificação de Configuração de Senhas
 * 
 * Este script verifica se as variáveis de ambiente estão configuradas corretamente
 * e se as senhas têm o formato válido (4 dígitos).
 */

console.log('\n🔐 Verificação de Configuração de Senhas\n');
console.log('='.repeat(50));

// Verificar se o arquivo .env existe
import { existsSync } from 'fs';
import { join } from 'path';

const envPath = join(process.cwd(), '.env');
const hasEnvFile = existsSync(envPath);

console.log('\n📁 Arquivo .env:');
console.log(`   ${hasEnvFile ? '✅' : '❌'} ${hasEnvFile ? 'Encontrado' : 'Não encontrado'}`);

if (!hasEnvFile) {
  console.log('\n⚠️  AVISO: Arquivo .env não encontrado!');
  console.log('   Para desenvolvimento local, você precisa:');
  console.log('   1. Copiar .env.example para .env');
  console.log('   2. Configurar suas senhas no arquivo .env');
  console.log('\n   Comando: cp .env.example .env\n');
}

// Verificar variáveis de ambiente (apenas em produção estas virão do Vercel)
console.log('\n🔑 Variáveis de Ambiente:');

const sacramentalPin = process.env.VITE_SACRAMENTAL_PIN;
const baptismalPin = process.env.VITE_BAPTISMAL_PIN;

function validatePin(pin, name) {
  if (!pin) {
    console.log(`   ❌ ${name}: Não configurado`);
    return false;
  }
  
  if (!/^\d{4}$/.test(pin)) {
    console.log(`   ❌ ${name}: "${pin}" (inválido - deve ter 4 dígitos)`);
    return false;
  }
  
  console.log(`   ✅ ${name}: Configurado corretamente (${pin})`);
  return true;
}

const sacramentalValid = validatePin(sacramentalPin, 'VITE_SACRAMENTAL_PIN');
const baptismalValid = validatePin(baptismalPin, 'VITE_BAPTISMAL_PIN');

// Resultado final
console.log('\n' + '='.repeat(50));

if (!hasEnvFile && !sacramentalPin && !baptismalPin) {
  console.log('\n⚠️  STATUS: CONFIGURAÇÃO NECESSÁRIA');
  console.log('\n📝 Próximos passos:');
  console.log('   1. Para desenvolvimento local:');
  console.log('      - Execute: cp .env.example .env');
  console.log('      - Edite o arquivo .env com suas senhas');
  console.log('      - Reinicie o servidor: npm run dev');
  console.log('\n   2. Para produção no Vercel:');
  console.log('      - Configure as variáveis no Dashboard do Vercel');
  console.log('      - Faça um Redeploy');
  console.log('      - Consulte: SEGURANCA.md e TROUBLESHOOTING.md');
} else if (sacramentalValid && baptismalValid) {
  console.log('\n✅ STATUS: CONFIGURAÇÃO VÁLIDA!');
  console.log('\n   Todas as senhas estão configuradas corretamente.');
  console.log('   O sistema está pronto para uso.');
} else {
  console.log('\n❌ STATUS: CONFIGURAÇÃO INVÁLIDA!');
  console.log('\n   Algumas senhas estão incorretas ou faltando.');
  console.log('   Verifique os erros acima e corrija.');
  console.log('\n   LEMBRE-SE: Senhas devem ter exatamente 4 dígitos (0-9)');
  console.log('   Exemplos válidos: 2026, 2025, 1234, 9876');
  console.log('   Exemplos inválidos: abc1, 123, 12345, 20a6');
}

console.log('\n' + '='.repeat(50) + '\n');

// Exit code: 0 se tudo OK, 1 se houver problemas
process.exit((sacramentalValid && baptismalValid) ? 0 : 1);
