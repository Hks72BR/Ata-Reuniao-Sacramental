import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomInt } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { build, transform } from 'esbuild';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const source = await readFile('src/lib/auth.ts', 'utf8');
const randomPin = () => String(randomInt(1000, 10000));
async function loadAuth(env) {
  const { code } = await transform(source, { loader: 'ts', format: 'esm', define: { 'import.meta.env': JSON.stringify(env) } });
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
}
const configured = () => Object.fromEntries(['VITE_SACRAMENTAL_PIN', 'VITE_BAPTISMAL_PIN', 'VITE_WARD_COUNCIL_PIN', 'VITE_DELETE_PIN'].map(name => [name, randomPin()]));

test('link compartilhado pede o PIN configurado e permanece somente leitura', async () => {
  const env = configured();
  const { outputFiles } = await build({
    entryPoints: ['src/pages/wardcouncil/WardCouncilView.tsx'],
    bundle: true, write: false, format: 'esm', platform: 'node',
    external: ['react', 'react/jsx-runtime'],
    define: { 'import.meta.env': JSON.stringify(env) },
    plugins: [{
      name: 'mock-view-services',
      setup(build) {
        build.onResolve({ filter: /^wouter$|^@\/lib\/wardCouncilFirestore$|^@\/lib\/wardCouncilLocal$|^@\/components\/(WardCouncilContent|WardCouncilForms|PinAuthModal)$/ }, args => ({ path: args.path, namespace: 'mock-view-services' }));
        build.onLoad({ filter: /.*/, namespace: 'mock-view-services' }, args => {
          const mocks = {
            wouter: 'export const useLocation = () => [globalThis.councilShareTestPath, () => {}];',
            '@/lib/wardCouncilFirestore': 'export const subscribeToWardCouncilRecord = () => { throw new Error("SSR must not subscribe"); };',
            '@/lib/wardCouncilLocal': 'export const councilLocalMode = false;',
            '@/components/WardCouncilContent': 'export const WardCouncilContent = () => null;',
            '@/components/WardCouncilForms': 'export const councilSecondary = "";',
            '@/components/PinAuthModal': 'export const PinAuthModal = props => { globalThis.councilShareTestModal = props; return null; };',
          };
          return { contents: mocks[args.path] };
        });
      },
    }],
  });
  const code = outputFiles[0].text.replace(/from "(react(?:\/jsx-runtime)?)"/g, (_match, name) =>
    `from "${import.meta.resolve(name)}"`);
  const { default: View } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
  const originalStorage = globalThis.sessionStorage;
  const values = new Map();
  globalThis.sessionStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
  try {
    globalThis.councilShareTestPath = '/wardcouncil/shared/example';
    let html = renderToStaticMarkup(createElement(View));
    assert.match(html, /Digite o PIN do Conselho/);
    assert.doesNotMatch(html, /Abrir edição|Histórico|Compartilhar ata/);
    assert.equal(globalThis.councilShareTestModal.correctPin, env.VITE_WARD_COUNCIL_PIN);
    assert.equal(globalThis.councilShareTestModal.storageKey, 'wardcouncil_auth');
    assert.equal(globalThis.councilShareTestModal.timestampKey, 'wardcouncil_auth_time');
    values.set('wardcouncil_auth', 'true');
    values.set('wardcouncil_auth_time', String(Date.now()));
    html = renderToStaticMarkup(createElement(View));
    assert.match(html, /somente leitura/);
    assert.doesNotMatch(html, /Abrir edição|Histórico|Compartilhar ata/);
    globalThis.councilShareTestPath = '/wardcouncil/view/example';
    html = renderToStaticMarkup(createElement(View));
    assert.match(html, /Abrir edição/);
    assert.match(html, /Compartilhar ata/);
    values.set('wardcouncil_auth_time', String(Date.now() - 9 * 60 * 60 * 1000));
    globalThis.councilShareTestPath = '/wardcouncil/shared/example';
    assert.match(renderToStaticMarkup(createElement(View)), /Digite o PIN do Conselho/);
  } finally {
    globalThis.sessionStorage = originalStorage;
    delete globalThis.councilShareTestPath;
    delete globalThis.councilShareTestModal;
  }
});

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
