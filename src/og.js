// Link-preview card (1200×630) — screenshotted to og.png at build time
import { esc, md, host } from './lib.js';

export default function og(cv) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="fonts.css">
  <style>
    * { box-sizing: border-box; margin: 0; }
    html, body { width: 1200px; height: 630px; }
    body {
      display: flex; align-items: center; gap: 72px; padding: 0 88px;
      background: #e3ddd4; color: #141210; font-family: 'Geist', sans-serif; letter-spacing: -0.01em;
    }
    .text { flex: 1; display: flex; flex-direction: column; }
    .photo { width: 112px; height: 112px; object-fit: cover; margin-bottom: 36px; }
    h1 { font: 400 78px/1.05 'Habibi', serif; letter-spacing: -0.02em; }
    .title { font-size: 32px; color: #5c544c; margin-top: 14px; }
    .tagline { font-size: 26px; line-height: 1.4; color: #2f2a26; margin-top: 28px; max-width: 20em; }
    .site { display: flex; align-items: center; gap: 12px; margin-top: 44px; font-size: 24px; font-weight: 500; }
    .site::before { content: ''; width: 12px; height: 12px; border-radius: 50%; background: #d45800; }
    .art { width: 340px; height: 340px; border-radius: 50%; object-fit: cover; flex: none; }
  </style>
</head>
<body>
  <div class="text">
    ${cv.photo ? `<img class="photo" src="${esc(cv.photo)}" alt="">` : ''}
    <h1>${esc(cv.name)}</h1>
    <p class="title">${md(cv.title)}</p>
    ${cv.tagline ? `<p class="tagline">${md(cv.tagline)}</p>` : ''}
    ${cv.url ? `<p class="site">${esc(host(cv.url))}</p>` : ''}
  </div>
  ${cv.hero_image ? `<img class="art" src="${esc(cv.hero_image)}" alt="">` : ''}
</body>
</html>
`;
}
