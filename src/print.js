// PDF template — renders cv.yaml into print.html, which the build prints to PDF
import { esc, md, plain, range, host, list } from './lib.js';

const bullets = (items, extra = []) => {
  const all = [...(items || []), ...extra];
  return all.length
    ? `<ul>${list(all, (b) =>
        typeof b === 'string'
          ? `<li>${md(b)}</li>`
          : `<li>${md(b.text)}${b.sub ? `<ul>${list(b.sub, (s) => `<li>${md(s)}</li>`)}</ul>` : ''}</li>`
      )}</ul>`
    : '';
};

const resultsLine = (results) =>
  results?.length ? [`**Key Results:** ${results.map((r) => `${r.value} ${r.label}`).join(', ')}`] : [];

const job = (j) => `
  <div class="entry">
    <div class="row head">
      <span class="org">${j.url ? `<a href="${esc(j.url)}">${esc(j.company)}</a>` : esc(j.company)}</span>
      <span class="aside">${esc(j.location || '')}</span>
    </div>
    ${list(j.roles, (role, i) => `
      <div class="role">
        <div class="row">
          <span class="position">${md(role.title)}</span>
          <span class="aside">${esc(range(role.start || j.start, role.end || j.end))}</span>
        </div>
        ${i === 0 && j.description ? `<p class="desc">${md(j.description)}</p>` : ''}
        ${bullets(role.bullets, resultsLine(role.results))}
      </div>`)}
  </div>`;

const school = (e) => `
  <div class="entry">
    <div class="row head">
      <span class="org">${esc(e.school)}</span>
      <span class="aside">${esc(e.location || '')}</span>
    </div>
    <div class="role">
      <div class="row">
        <span class="position">${md(e.degree)}</span>
        <span class="aside">${esc(e.date || '')}</span>
      </div>
      ${bullets(e.bullets)}
    </div>
  </div>`;

export default function print(cv, { reload = '' } = {}) {
  const contact = [
    `<a href="mailto:${esc(cv.email)}">${esc(cv.email)}</a>`,
    cv.phone && `<a href="tel:${esc(cv.phone.replace(/[^\d+]/g, ''))}">${esc(cv.phone)}</a>`,
    cv.location && esc(`${cv.location}${cv.timezone ? ` (${cv.timezone})` : ''}`),
    cv.website && `<a href="${esc(cv.website)}">${esc(host(cv.website))}</a>`,
    ...(cv.links || []).filter((l) => l.url !== cv.website && l.pdf !== false).map((l) => `<a href="${esc(l.url)}">${esc(l.label)}</a>`),
  ].filter(Boolean);
  const status = [cv.availability, cv.work_authorisation].filter(Boolean).map(md);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${esc(cv.name)} — CV</title>
  <meta name="robots" content="noindex">
  <meta name="author" content="${esc(cv.name)}">
  <meta name="description" content="${esc(plain(cv.title))}">
  <link rel="stylesheet" href="fonts.css">
  <link rel="stylesheet" href="print.css">
</head>
<body>
  <header>
    <div>
      <h1>${esc(cv.name)}</h1>
      <p class="title">${md(cv.title)}</p>
      <p class="contact">${contact.map((c) => `<span class="nw">${c}</span>`).join('<span class="sep">|</span>')}</p>
      ${status.length ? `<p class="status">${status.join('<span class="sep">·</span>')}</p>` : ''}
    </div>
    ${cv.pdf_photo && cv.photo ? `<img class="photo" src="${esc(cv.photo)}" alt="${esc(cv.name)}">` : ''}
  </header>

  ${cv.about ? `<p class="summary">${md(cv.about)}</p>` : ''}

  <section>
    <h2>Work Experience</h2>
    ${list(cv.experience, job)}
  </section>

  <section>
    <h2>Education</h2>
    ${list(cv.education, school)}
  </section>

  <section>
    <h2>Skills &amp; Interests</h2>
    <ul class="skills">
      ${list(cv.skills, (g) => `<li><strong>${md(g.label)}:</strong> ${g.items.map(md).join(', ')}</li>`)}
    </ul>
  </section>${reload}
</body>
</html>
`;
}
