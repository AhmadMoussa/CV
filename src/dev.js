// Local preview with live reload: rebuilds site + PDF whenever cv.yaml, src/ or public/ change
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { serve } from './lib.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 3000;
const clients = new Set();

// Each rebuild runs in a fresh process so edits to any source file are picked up
const rebuild = () =>
  new Promise((resolve) => {
    execFile(process.execPath, [path.join(root, 'src', 'build.js'), '--dev'], (err, stdout, stderr) => {
      const time = new Date().toLocaleTimeString();
      if (err) {
        console.error(`✗ ${time} build failed\n${stderr || err.message}`);
      } else {
        console.log(`${time}\n${stdout.trim()}`);
        for (const res of clients) res.write('data: reload\n\n');
      }
      resolve();
    });
  });

await rebuild();
await serve(path.join(root, 'dist'), PORT, (req, res) => {
  if (req.url !== '/__reload') return false;
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' });
  clients.add(res);
  req.on('close', () => clients.delete(res));
  return true;
});
console.log(`\n  Website  http://localhost:${PORT}\n  PDF view http://localhost:${PORT}/print.html\n`);

let timer, building = false, queued = false;
const schedule = () => {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    if (building) return (queued = true);
    building = true;
    await rebuild();
    building = false;
    if (queued) (queued = false), schedule();
  }, 150);
};
for (const p of ['cv.yaml', 'src', 'public']) fs.watch(path.join(root, p), { recursive: true }, schedule);
