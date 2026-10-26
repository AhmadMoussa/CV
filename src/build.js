// Builds dist/: the website (index.html) and the PDF CV, both from cv.yaml.
// `--dev` adds a live-reload snippet (used by `npm run dev`).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import puppeteer from 'puppeteer';
import { serve, pdfName } from './lib.js';
import site from './site.js';
import print from './print.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const reload = process.argv.includes('--dev')
  ? `\n  <script>new EventSource('/__reload').onmessage = () => location.reload();</script>`
  : '';

const FONTS = [
  '@fontsource/geist/files/geist-latin-400-normal.woff2',
  '@fontsource/geist/files/geist-latin-500-normal.woff2',
  '@fontsource/geist/files/geist-latin-600-normal.woff2',
  '@fontsource/habibi/files/habibi-latin-400-normal.woff2',
];

const cv = YAML.parse(fs.readFileSync(path.join(root, 'cv.yaml'), 'utf8'));

// 1. Website + print page
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, 'fonts'), { recursive: true });
fs.cpSync(path.join(root, 'public'), dist, { recursive: true });
for (const f of FONTS) fs.copyFileSync(path.join(root, 'node_modules', f), path.join(dist, 'fonts', path.basename(f)));
for (const f of ['fonts.css', 'site.css', 'print.css']) fs.copyFileSync(path.join(root, 'src', f), path.join(dist, f));
fs.writeFileSync(path.join(dist, 'index.html'), site(cv, { reload }));
fs.writeFileSync(path.join(dist, 'print.html'), print(cv, { reload }));

// 2. PDF, printed from print.html by headless Chrome
const server = await serve(dist);
const browser = await puppeteer.launch({ args: process.env.CI ? ['--no-sandbox'] : [] });
try {
  const page = await browser.newPage();
  await page.goto(`http://localhost:${server.address().port}/print.html`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const file = path.join(dist, pdfName(cv));
  await page.pdf({ path: file, preferCSSPageSize: true, printBackground: true });
  const pages = (fs.readFileSync(file, 'latin1').match(/\/Type\s*\/Page\b/g) || []).length;
  console.log(`✓ dist/index.html\n✓ dist/${path.basename(file)} (${pages} page${pages === 1 ? '' : 's'})`);
} finally {
  await browser.close();
  server.close();
}
