// Local preview with live reload: rebuilds site + PDF whenever cv.yaml, src/ or public/ change
import fs from 'node:fs';
import path from 'node:path';
import { root, dist, loadCV, buildHTML, buildPDF, launch } from './build.js';
import { serve } from './lib.js';

const PORT = Number(process.env.PORT) || 3000;
const RELOAD = `\n  <script>new EventSource('/__reload').onmessage = () => location.reload();</script>`;
const clients = new Set();
const browser = await launch();

async function rebuild() {
  try {
    const cv = loadCV();
    await buildHTML(cv, { fresh: true, reload: RELOAD });
    const { pages } = await buildPDF(cv, browser);
    console.log(`✓ rebuilt ${new Date().toLocaleTimeString()} — PDF is ${pages} page${pages === 1 ? '' : 's'}`);
    for (const res of clients) res.write('data: reload\n\n');
  } catch (err) {
    console.error(`✗ ${err.message}`);
  }
}

await rebuild();
await serve(dist, PORT, (req, res) => {
  if (req.url !== '/__reload') return false;
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' });
  clients.add(res);
  req.on('close', () => clients.delete(res));
  return true;
});
console.log(`\n  Website  http://localhost:${PORT}\n  PDF view http://localhost:${PORT}/print.html\n`);

let timer;
for (const p of ['cv.yaml', 'src', 'public']) {
  fs.watch(path.join(root, p), { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(rebuild, 150);
  });
}
process.on('SIGINT', async () => {
  await browser.close();
  process.exit(0);
});
