import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomInt } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { transform } from 'esbuild';

const source = await readFile('src/lib/auth.ts', 'utf8');
const randomPin = () => String(randomInt(1000, 10000));
async function loadAuth(env) {
  const { code } = await transform(source, { loader: 'ts', format: 'esm', define: { 'import.meta.env': JSON.stringify(env) } });
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
}
const configured = () => Object.fromEntries(['VITE_SACRAMENTAL_PIN', 'VITE_BAPTISMAL_PIN', 'VITE_WARD_COUNCIL_PIN', 'VITE_DELETE_PIN'].map(name => [name, randomPin()]));

test('todos os PINs são lidos do ambiente, inclusive o batismal', async () => {
  const env = configured();
  const { AUTH_CONFIG } = await loadAuth(env);
  for (const [name, value] of Object.entries(env)) assert.equal(AUTH_CONFIG[name.replace('VITE_', '')], value);
  assert.equal(AUTH_CONFIG.WARD_COUNCIL_ADMIN_PIN, env.VITE_DELETE_PIN);
});

test('PIN administrativo específico tem prioridade sobre o PIN de exclusão', async () => {
  const env = { ...configured(), VITE_WARD_COUNCIL_ADMIN_PIN: randomPin() };
  const { AUTH_CONFIG } = await loadAuth(env);
  assert.equal(AUTH_CONFIG.WARD_COUNCIL_ADMIN_PIN, env.VITE_WARD_COUNCIL_ADMIN_PIN);
});

test('configuração ausente ou inválida não aceita PIN vazio nem registra valores nos logs', async () => {
  const messages = [];
  const originalError = console.error;
  console.error = message => messages.push(message);
  try {
    const invalid = 'valor-confidencial-invalido';
    const { AUTH_CONFIG, matchesConfiguredPin, validateDeletePin } = await loadAuth({ VITE_SACRAMENTAL_PIN: invalid });
    assert.equal(AUTH_CONFIG.SACRAMENTAL_PIN, '');
    assert.equal(AUTH_CONFIG.WARD_COUNCIL_PIN, '');
    assert.equal(matchesConfiguredPin('', ''), false);
    assert.equal(matchesConfiguredPin(invalid, invalid), false);
    assert.equal(validateDeletePin(''), false);
    assert.ok(messages.length > 0);
    assert.ok(messages.every(message => !message.includes(invalid)));
  } finally { console.error = originalError; }
});
