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
import og from './og.js';
import { resumeJson, markdown, llmsTxt, robotsTxt, sitemap } from './machine.js';

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
const modified = new Date().toISOString().slice(0, 10);
const write = (file, content) => fs.writeFileSync(path.join(dist, file), content);

// 1. Website + print page
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, 'fonts'), { recursive: true });
fs.cpSync(path.join(root, 'public'), dist, { recursive: true });
for (const f of FONTS) fs.copyFileSync(path.join(root, 'node_modules', f), path.join(dist, 'fonts', path.basename(f)));
for (const f of ['fonts.css', 'site.css', 'print.css']) fs.copyFileSync(path.join(root, 'src', f), path.join(dist, f));
write('index.html', site(cv, { reload, modified }));
write('print.html', print(cv, { reload }));
write('og.html', og(cv));

// 2. Machine-readable versions for search engines, AI agents and résumé tools
write('cv.md', markdown(cv));
write('llms.txt', llmsTxt(cv));
write('resume.json', JSON.stringify(resumeJson(cv), null, 2) + '\n');
write('robots.txt', robotsTxt(cv));
write('sitemap.xml', sitemap(cv, modified));

// 3. PDF (from print.html) and link-preview image (from og.html), via headless Chrome
const server = await serve(dist);
const browser = await puppeteer.launch({ args: process.env.CI ? ['--no-sandbox'] : [] });
try {
  const page = await browser.newPage();
  await page.goto(`http://localhost:${server.address().port}/print.html`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const file = path.join(dist, pdfName(cv));
  await page.pdf({ path: file, preferCSSPageSize: true, printBackground: true });
  const pages = (fs.readFileSync(file, 'latin1').match(/\/Type\s*\/Page\b/g) || []).length;

  await page.setViewport({ width: 1200, height: 630 });
  await page.goto(`http://localhost:${server.address().port}/og.html`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(dist, 'og.png') });
  fs.rmSync(path.join(dist, 'og.html'));

  console.log(`✓ dist/index.html\n✓ dist/${path.basename(file)} (${pages} page${pages === 1 ? '' : 's'})\n✓ dist/og.png, cv.md, resume.json, llms.txt, robots.txt, sitemap.xml`);
} finally {
  await browser.close();
  server.close();
}
