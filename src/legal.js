// Impressum + privacy notice (German legal requirements) — rendered to impressum.html
import { esc, list } from './lib.js';

export default function legal(cv, { reload = '' } = {}) {
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>Impressum & Datenschutz — ${esc(cv.name)}</title>
  <link rel="icon" href="favicon.png" type="image/png">
  <script>try { const t = localStorage.getItem('theme'); if (t) document.documentElement.dataset.theme = t; } catch {}</script>
  <link rel="stylesheet" href="fonts.css">
  <link rel="stylesheet" href="site.css">
</head>
<body class="legal">
  <main>
    <p><a class="back" href="./">← ${esc(cv.name)}</a></p>

    <h1>Impressum</h1>
    <p class="muted">Angaben gemäß § 5 DDG und § 18 Abs. 1 MStV</p>
    <p>${esc(cv.name)}<br>${list(cv.legal.address, (line) => `${esc(line)}<br>`)}</p>
    <p>E-Mail: <a href="mailto:${esc(cv.email)}">${esc(cv.email)}</a>${cv.phone ? `<br>Telefon: ${esc(cv.phone)}` : ''}</p>

    <h2>Datenschutz</h2>
    <p>Verantwortlich für die Datenverarbeitung auf dieser Website ist ${esc(cv.name)} (Kontakt siehe oben).</p>
    <p><strong>Hosting.</strong> Diese Website wird über GitHub Pages der GitHub, Inc. (USA) bereitgestellt. Beim Aufruf der Seiten verarbeitet GitHub technisch notwendige Daten wie Ihre IP-Adresse in Server-Logfiles, um die Website auszuliefern und vor Missbrauch zu schützen. Details: <a href="https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement">GitHub Privacy Statement</a>.</p>
    <p><strong>Keine Cookies, kein Tracking.</strong> Diese Website setzt keine Cookies und nutzt keine Analyse- oder Tracking-Dienste. Schriftarten werden von dieser Website selbst ausgeliefert. Ihre Auswahl für die helle oder dunkle Darstellung wird nur lokal in Ihrem Browser gespeichert.</p>
    <p><strong>Kontakt.</strong> Wenn Sie mich per E-Mail oder Telefon kontaktieren, verwende ich Ihre Angaben ausschließlich zur Bearbeitung Ihrer Anfrage.</p>
    <p><strong>Ihre Rechte.</strong> Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung Ihrer Daten sowie das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.</p>
  </main>${reload}
</body>
</html>
`;
}
