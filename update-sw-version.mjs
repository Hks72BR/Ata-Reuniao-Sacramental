/**
 * Script para atualizar automaticamente a versão do Service Worker
 * Executado antes de cada build
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const swPath = join(__dirname, 'public', 'sw.js');

try {
  // Ler o arquivo do Service Worker
  let swContent = readFileSync(swPath, 'utf8');
  
  // Gerar novo timestamp
  const buildTimestamp = new Date().toISOString();
  
  // Substituir o timestamp no arquivo
  swContent = swContent.replace(
    /const BUILD_TIMESTAMP = '[^']+';/,
    `const BUILD_TIMESTAMP = '${buildTimestamp}';`
  );
  
  // Salvar arquivo atualizado
  writeFileSync(swPath, swContent, 'utf8');
  
  console.log(`✅ Service Worker versão atualizada: ${buildTimestamp}`);
} catch (error) {
  console.error('❌ Erro ao atualizar versão do Service Worker:', error);
  process.exit(1);
}
