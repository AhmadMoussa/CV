// Builds dist/: the website (index.html) and the PDF CV, both from cv.yaml
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import puppeteer from 'puppeteer';
import { serve, pdfName } from './lib.js';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const dist = path.join(root, 'dist');
const src = (...p) => path.join(root, 'src', ...p);

const FONTS = [
  '@fontsource/geist/files/geist-latin-400-normal.woff2',
  '@fontsource/geist/files/geist-latin-500-normal.woff2',
  '@fontsource/geist/files/geist-latin-600-normal.woff2',
  '@fontsource/habibi/files/habibi-latin-400-normal.woff2',
];

export const loadCV = () => YAML.parse(fs.readFileSync(path.join(root, 'cv.yaml'), 'utf8'));

// `fresh` re-imports the templates so `npm run dev` picks up edits to them
export async function buildHTML(cv, { fresh = false, reload = '' } = {}) {
  const q = fresh ? `?t=${Date.now()}` : '';
  const { default: site } = await import(`./site.js${q}`);
  const { default: print } = await import(`./print.js${q}`);

  fs.rmSync(dist, { recursive: true, force: true });
  fs.mkdirSync(path.join(dist, 'fonts'), { recursive: true });
  fs.cpSync(path.join(root, 'public'), dist, { recursive: true });
  for (const f of FONTS) fs.copyFileSync(path.join(root, 'node_modules', f), path.join(dist, 'fonts', path.basename(f)));
  for (const f of ['fonts.css', 'site.css', 'print.css', 'sketch.js']) fs.copyFileSync(src(f), path.join(dist, f));

  fs.writeFileSync(path.join(dist, 'index.html'), site(cv, { reload }));
  fs.writeFileSync(path.join(dist, 'print.html'), print(cv, { reload }));
}

export const launch = () => puppeteer.launch({ args: process.env.CI ? ['--no-sandbox'] : [] });

export async function buildPDF(cv, browser) {
  const server = await serve(dist);
  const page = await browser.newPage();
  try {
    await page.goto(`http://localhost:${server.address().port}/print.html`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const file = path.join(dist, pdfName(cv));
    await page.pdf({ path: file, preferCSSPageSize: true, printBackground: true });
    const pages = (fs.readFileSync(file, 'latin1').match(/\/Type\s*\/Page\b/g) || []).length;
    return { file, pages };
  } finally {
    await page.close();
    server.close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const cv = loadCV();
  await buildHTML(cv);
  const browser = await launch();
  const { file, pages } = await buildPDF(cv, browser);
  await browser.close();
  console.log(`✓ dist/index.html\n✓ dist/${path.basename(file)} (${pages} page${pages === 1 ? '' : 's'})`);
}
