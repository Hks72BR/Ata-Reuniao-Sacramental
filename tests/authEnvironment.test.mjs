import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomInt } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { build, transform } from 'esbuild';

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

test('acesso ao Conselho aceita líderes e Bispado, mas não sessões ausentes, expiradas ou de outro módulo', async () => {
  const originalStorage = globalThis.sessionStorage;
  const values = new Map();
  globalThis.sessionStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
  try {
    const { AUTH_CONFIG, hasWardCouncilAccess, hasCouncilAccess, isAuthenticated, login } = await loadAuth(configured());
    assert.equal(hasWardCouncilAccess(), false);
    login(AUTH_CONFIG.BAPTISMAL_SESSION_KEY, AUTH_CONFIG.BAPTISMAL_TIMESTAMP_KEY);
    assert.equal(hasWardCouncilAccess(), false);
    for (const [session, timestamp] of [
      [AUTH_CONFIG.WARD_COUNCIL_SESSION_KEY, AUTH_CONFIG.WARD_COUNCIL_TIMESTAMP_KEY],
      [AUTH_CONFIG.SACRAMENTAL_SESSION_KEY, AUTH_CONFIG.SACRAMENTAL_TIMESTAMP_KEY],
    ]) {
      values.clear();
      login(session, timestamp);
      assert.equal(hasWardCouncilAccess(), true);
      assert.equal(hasCouncilAccess(), true);
      assert.equal(isAuthenticated(AUTH_CONFIG.SACRAMENTAL_SESSION_KEY), session === AUTH_CONFIG.SACRAMENTAL_SESSION_KEY);
      values.set(timestamp, String(Date.now() - 9 * 60 * 60 * 1000));
      assert.equal(hasWardCouncilAccess(), false);
      assert.equal(values.has(session), false);
    }
    login(AUTH_CONFIG.WARD_COUNCIL_SESSION_KEY, AUTH_CONFIG.WARD_COUNCIL_TIMESTAMP_KEY);
    login(AUTH_CONFIG.SACRAMENTAL_SESSION_KEY, AUTH_CONFIG.SACRAMENTAL_TIMESTAMP_KEY);
    values.set(AUTH_CONFIG.WARD_COUNCIL_TIMESTAMP_KEY, String(Date.now() - 9 * 60 * 60 * 1000));
    assert.equal(hasWardCouncilAccess(), true);
  } finally { globalThis.sessionStorage = originalStorage; }
});

test('persistência exige sessão Sacramental para criar e gerenciar, mas permite participação dos líderes', async () => {
  const { outputFiles } = await build({
    stdin: { contents: "export * from './src/lib/auth'; export * from './src/lib/wardCouncilFirestore';", resolveDir: process.cwd() },
    bundle: true, write: false, format: 'esm', platform: 'node',
    define: { 'import.meta.env': JSON.stringify({ ...configured(), DEV: true, VITE_WARD_COUNCIL_LOCAL: 'true' }) },
    plugins: [{
      name: 'mock-firebase',
      setup(build) {
        build.onResolve({ filter: /^firebase\/firestore$|^\.\/firebase$/ }, args => ({ path: args.path, namespace: 'mock-firebase' }));
        build.onLoad({ filter: /.*/, namespace: 'mock-firebase' }, args => ({
          contents: args.path === './firebase' ? 'export const db = {};' :
            'export const collection = () => {}, deleteField = () => {}, doc = () => {}, getDocs = () => {}, onSnapshot = () => {}, orderBy = () => {}, query = () => {}, runTransaction = () => {}, setDoc = () => {}, updateDoc = () => {};',
        }));
      },
    }],
  });
  const api = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`);
  const keys = ['sessionStorage', 'localStorage', 'window', 'navigator'];
  const originals = keys.map(key => Object.getOwnPropertyDescriptor(globalThis, key));
  const storage = () => {
    const values = new Map();
    return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  };
  const mocks = [storage(), storage(), { dispatchEvent() {} }, { locks: { request: async (_key, operation) => operation() } }];
  keys.forEach((key, index) => Object.defineProperty(globalThis, key, { configurable: true, value: mocks[index] }));
  try {
    const { AUTH_CONFIG, login, logoutAll } = api;
    await assert.rejects(api.createBlankWardCouncilRecord(), /sessão expirou/);
    login(AUTH_CONFIG.WARD_COUNCIL_SESSION_KEY, AUTH_CONFIG.WARD_COUNCIL_TIMESTAMP_KEY);
    await assert.rejects(api.createBlankWardCouncilRecord(), /PIN Sacramental/);
    login(AUTH_CONFIG.SACRAMENTAL_SESSION_KEY, AUTH_CONFIG.SACRAMENTAL_TIMESTAMP_KEY);
    const id = await api.createBlankWardCouncilRecord();
    logoutAll();
    login(AUTH_CONFIG.WARD_COUNCIL_SESSION_KEY, AUTH_CONFIG.WARD_COUNCIL_TIMESTAMP_KEY);
    await api.mutateCouncilRecord(id, { type: 'metadata', patch: { presidedBy: 'Bispo', directedBy: 'Bispo' } }, 'Líder');
    assert.equal((await api.getAllWardCouncilRecordsFromCloud())[0].presidedBy, 'Bispo');
    for (const type of ['finalize', 'reopen']) {
      await assert.rejects(api.mutateCouncilRecord(id, { type }, 'Líder'), /bispado/);
    }
    login(AUTH_CONFIG.SACRAMENTAL_SESSION_KEY, AUTH_CONFIG.SACRAMENTAL_TIMESTAMP_KEY);
    await api.mutateCouncilRecord(id, { type: 'finalize' }, 'Bispo');
    assert.equal((await api.getAllWardCouncilRecordsFromCloud())[0].status, 'completed');
    await api.mutateCouncilRecord(id, { type: 'reopen' }, 'Bispo');
    assert.equal((await api.getAllWardCouncilRecordsFromCloud())[0].status, 'draft');
  } finally {
    keys.forEach((key, index) => {
      if (originals[index]) Object.defineProperty(globalThis, key, originals[index]);
      else delete globalThis[key];
    });
  }
});
