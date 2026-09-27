// Run after npm run dev:conselho. Uses Chrome's debugging protocol; no extra dependency.
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const base = 'http://127.0.0.1:5173';
const profile = await mkdtemp(join(tmpdir(), 'council-browser-'));
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
], { windowsHide: true, stdio: 'ignore' });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let port;
for (let attempt = 0; attempt < 100; attempt++) {
  try { port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break; } catch { await delay(100); }
}
if (!port) { chrome.kill(); throw new Error('Chrome não iniciou.'); }
const sockets = [];
async function page() {
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  const socket = new WebSocket(target.webSocketDebuggerUrl); sockets.push(socket);
  await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
  const pending = new Map(); let sequence = 0; const errors = [];
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) { const handler = pending.get(message.id); pending.delete(message.id); if (message.error) handler.reject(new Error(message.error.message)); else handler.resolve(message.result); }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
    if (message.method === 'Page.javascriptDialogOpening') void send('Page.handleJavaScriptDialog', { accept: true });
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  await send('Network.setBlockedURLs', { urls: ['https://*'] });
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  const wait = async (expression, label = expression) => {
    for (let attempt = 0; attempt < 150; attempt++) { if (await evaluate(`!!document.body && (${expression})`)) return; await delay(100); }
    throw new Error(`Tempo esgotado: ${label}\n${await evaluate('document.body.innerText')}`);
  };
  const click = async (text, occurrence = 0) => {
    const expr = `Array.from(document.querySelectorAll('button')).filter(b => b.textContent.trim() === ${JSON.stringify(text)})[${occurrence}]`;
    await wait(`!!(${expr}) && !(${expr}).disabled`, `botão ${text}`); await evaluate(`(${expr}).click()`); await delay(80);
  };
  const fill = async (label, value) => {
    await evaluate(`(() => { const label = Array.from(document.querySelectorAll('label')).find(l => l.textContent.replace(/\\s*\\*$/, '').trim() === ${JSON.stringify(label)}); if (!label) throw new Error('Campo não encontrado'); const input = document.getElementById(label.htmlFor); const proto = input.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : input.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(input, ${JSON.stringify(value)}); input.dispatchEvent(new Event(input.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); })()`);
  };
  const save = async () => { await click('Salvar'); await wait(`!document.querySelector('form')`, 'formulário salvo'); };
  const go = async path => { await send('Page.navigate', { url: base + path }); await wait(`document.body.innerText.includes('Conselho') || document.body.innerText.includes('conselho')`); };
  return { send, evaluate, wait, click, fill, save, go, errors };
}

try {
  const p = await page();
  await p.send('Page.addScriptToEvaluateOnNewDocument', { source: "sessionStorage.setItem('wardcouncil_user_name','Secretário Teste');sessionStorage.setItem('wardcouncil_user_org','secretario');" });
  await p.go('/wardcouncil');
  await p.click('Criar reunião');
  await p.wait("location.pathname.includes('/edit/') && document.body.innerText.includes('Editar dados')");
  const firstId = await p.evaluate("location.pathname.split('/').pop()");
  await p.click('Editar dados'); await p.fill('Data da reunião', '2026-09-27'); await p.fill('Presidida por', 'Bispo Teste'); await p.fill('Dirigida por', 'Bispo Teste'); await p.save();
  for (const title of ['Apoiar os jovens', 'Serviço às famílias']) {
    await p.click('Sugerir assunto'); await p.fill('Assunto', title); await p.fill('O que precisamos resolver juntos?', 'Coordenar o apoio das organizações.'); await p.save();
    await p.click('Incluir na pauta');
  }
  await p.evaluate("document.querySelector('[aria-label=\"Subir Serviço às famílias\"]').click()");
  await p.wait("document.querySelector('article h3')?.textContent.includes('Serviço às famílias')");
  console.log('OK: criação, pauta colaborativa e ordenação.');

  // Second tab: self-identifying as bishop does not grant management access.
  const participant = await page();
  await participant.send('Page.addScriptToEvaluateOnNewDocument', { source: "sessionStorage.setItem('wardcouncil_user_name','Participante Teste');sessionStorage.setItem('wardcouncil_user_org','bispado');sessionStorage.setItem('wardcouncil_auth','true');sessionStorage.setItem('wardcouncil_auth_time',String(Date.now()));" });
  await participant.go(`/wardcouncil/edit/${firstId}`);
  await participant.wait("document.body.innerText.includes('Acesso do bispado')");
  assert.equal(await participant.evaluate("!!document.querySelector('[aria-label^=Subir]')"), false);
  await participant.click('Registrar discussão / decisão');
  await participant.fill('Discussão — resumo das contribuições', 'Contribuição do participante.');
  await p.click('Registrar discussão / decisão');
  await p.fill('Discussão — resumo das contribuições', 'Resumo conflitante.');
  await participant.save();
  await p.click('Salvar'); await p.wait("document.body.innerText.includes('alterado por outra pessoa')");
  await p.click('Cancelar');
  console.log('OK: controle do bispado e conflito entre duas abas.');

  for (let index = 0; index < 2; index++) {
    await p.click('Registrar discussão / decisão', index);
    await p.fill('Discussão — resumo das contribuições', 'As organizações apresentaram sugestões.');
    await p.fill('Resultado da discussão', index ? 'deferred' : 'decided');
    await p.fill('Decisão ou encaminhamento', index ? 'Retomar após consultar as famílias.' : 'Preparar uma oportunidade de serviço.');
    await p.save();
  }
  await p.click('Criar designação', 0);
  await p.fill('O que será feito?', 'Consultar disponibilidade das famílias'); await p.fill('Responsável', 'Maria Teste'); await p.fill('Prazo', '2026-10-04'); await p.save();
  await p.click('Finalizar ata'); await p.wait("document.body.innerText.includes('O conteúdo desta reunião está finalizado')");
  assert.equal(await p.evaluate("Array.from(document.querySelectorAll('button')).some(b => b.textContent === 'Sugerir assunto')"), false);
  await p.click('Visualizar ata'); await p.wait("document.body.innerText.includes('Preparar uma oportunidade de serviço.')");
  await p.click('Abrir edição'); await p.wait("location.pathname.includes('/edit/')");
  console.log('OK: discussão, decisões, prazo, finalização e visualização.');

  await p.go('/wardcouncil'); await p.click('Criar reunião'); await p.wait("document.body.innerText.includes('Editar dados')");
  const nextId = await p.evaluate("location.pathname.split('/').pop()");
  await p.click('Editar dados'); await p.fill('Data da reunião', '2026-10-04'); await p.fill('Presidida por', 'Bispo Teste'); await p.fill('Dirigida por', 'Bispo Teste'); await p.save();
  await p.click('Registrar retorno'); await p.fill('Situação', 'completed'); await p.fill('Retorno e próximos passos', 'Famílias consultadas e disponibilidade confirmada.'); await p.save();
  const records = await p.evaluate("JSON.parse(localStorage.getItem('wardcouncil-local-v2'))");
  assert.equal(records.find(record => record.id === firstId).actionItems.length, 1);
  assert.equal(records.find(record => record.id === firstId).actionItems[0].completed, true);
  assert.equal(records.find(record => record.id === nextId).actionItems.length, 0);
  assert.equal(Object.values(records.find(record => record.id === nextId).actionReviews)[0].update.note, 'Famílias consultadas e disponibilidade confirmada.');
  await p.send('Page.reload'); await p.wait("document.body.innerText.includes('Retornos registrados nesta reunião (1)')");
  await p.click('Finalizar ata'); await p.wait("document.body.innerText.includes('O conteúdo desta reunião está finalizado')");
  await p.click('Visualizar ata'); await p.wait("document.body.innerText.includes('Famílias consultadas e disponibilidade confirmada.')");
  console.log('OK: acompanhamento seguinte, histórico persistido e ação sem duplicação.');

  await p.go(`/wardcouncil/view/${firstId}`);
  await p.wait("document.body.innerText.includes('Consultar disponibilidade das famílias')");
  const desktop = await p.send('Page.captureScreenshot', { captureBeyondViewport: true });
  await writeFile(join(profile, 'conselho-desktop.png'), Buffer.from(desktop.data, 'base64'));
  await p.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await delay(300);
  assert.equal(await p.evaluate('document.documentElement.scrollWidth <= window.innerWidth'), true, 'Layout não deve transbordar no celular');
  const mobile = await p.send('Page.captureScreenshot', { captureBeyondViewport: true });
  await writeFile(join(profile, 'conselho-mobile.png'), Buffer.from(mobile.data, 'base64'));
  assert.deepEqual(p.errors, []); assert.deepEqual(participant.errors, []);
  console.log(`OK: desktop e celular, sem erros de execução. Capturas: ${profile}`);
} finally {
  for (const socket of sockets) socket.close();
  chrome.kill();
}
