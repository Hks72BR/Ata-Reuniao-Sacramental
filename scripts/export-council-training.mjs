import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const profile = await mkdtemp(join(tmpdir(), 'council-training-'));
const output = resolve('docs/treinamento-conselho-ala.pdf');
const browser = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--user-data-dir=${profile}`, '--remote-debugging-port=0', 'about:blank',
], { windowsHide: true, stdio: 'ignore' });
const delay = ms => new Promise(accept => setTimeout(accept, ms));
let socket;
try {
  let port;
  for (let attempt = 0; attempt < 100; attempt++) {
    try { port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break; }
    catch { await delay(100); }
  }
  if (!port) throw new Error('Chrome não iniciou.');
  const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
  await new Promise(accept => socket.addEventListener('open', accept, { once: true }));
  const pending = new Map(); let sequence = 0;
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (!message.id) return;
    const handler = pending.get(message.id); pending.delete(message.id);
    if (message.error) handler.reject(new Error(message.error.message)); else handler.accept(message.result);
  });
  const send = (method, params = {}) => new Promise((accept, reject) => {
    const id = ++sequence; pending.set(id, { accept, reject }); socket.send(JSON.stringify({ id, method, params }));
  });
  await send('Page.enable');
  await send('Emulation.setEmulatedMedia', { media: 'print' });
  await send('Page.navigate', { url: pathToFileURL(resolve('docs/treinamento-conselho-ala.html')).href });
  for (let attempt = 0; attempt < 100; attempt++) {
    const ready = await send('Runtime.evaluate', { expression: "document.readyState === 'complete' && document.querySelectorAll('.page').length === 6", returnByValue: true });
    if (ready.result.value) break;
    await delay(100);
  }
  const layout = await send('Runtime.evaluate', { returnByValue: true, expression: `Array.from(document.querySelectorAll('.page')).map((page, index) => {
    const footer = page.querySelector('.footer').getBoundingClientRect();
    const end = Math.max(...Array.from(page.children).filter(child => !child.classList.contains('footer')).map(child => child.getBoundingClientRect().bottom));
    return { page: index + 1, freeSpace: Math.round(footer.top - end) };
  })` });
  if (layout.result.value.some(page => page.freeSpace < 8)) throw new Error(`Conteúdo próximo demais do rodapé: ${JSON.stringify(layout.result.value)}`);
  const result = await send('Page.printToPDF', { printBackground: true, preferCSSPageSize: true, displayHeaderFooter: false });
  const pdf = Buffer.from(result.data, 'base64');
  const pageCount = [...pdf.toString('latin1').matchAll(/\/Type\s*\/Page\b/g)].length;
  if (pageCount !== 6) throw new Error(`Esperadas 6 páginas, encontradas ${pageCount}.`);
  await writeFile(output, pdf);
  await send('Emulation.setDeviceMetricsOverride', { width: 794, height: 1123, deviceScaleFactor: 1, mobile: false });
  const preview = await send('Page.captureScreenshot');
  await writeFile(join(profile, 'capa.png'), Buffer.from(preview.data, 'base64'));
  console.log(`PDF criado e paginação conferida: ${output} (${pageCount} páginas).`);
  console.log(`Prévia: ${join(profile, 'capa.png')}`);
} finally {
  socket?.close();
  browser.kill();
}
