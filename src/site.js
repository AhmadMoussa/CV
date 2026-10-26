// Website template — renders cv.yaml into index.html
import { esc, md, plain, range, initials, host, icon, list, pdfName } from './lib.js';

const bullets = (items) =>
  items?.length
    ? `<ul class="bullets">${list(items, (b) =>
        typeof b === 'string'
          ? `<li>${md(b)}</li>`
          : `<li>${md(b.text)}${b.sub ? `<ul>${list(b.sub, (s) => `<li>${md(s)}</li>`)}</ul>` : ''}</li>`
      )}</ul>`
    : '';

const results = (items) =>
  items?.length
    ? `<div class="results">${list(items, (r) => `<div class="result"><span class="result-value">${esc(r.value)}</span><span class="result-label">${md(r.label)}</span></div>`)}</div>`
    : '';

const companyName = (job) => (job.url ? `<a href="${esc(job.url)}">${esc(job.company)}</a>` : esc(job.company));

const experience = (job) => {
  const multi = job.roles.length > 1;
  return `
    <article class="company${multi ? ' multi' : ''}">
      <div class="logo" aria-hidden="true">${job.logo ? `<img src="${esc(job.logo)}" alt="">` : esc(job.company[0].toUpperCase())}</div>
      <div class="roles">
        ${list(job.roles, (role, i) => `
          <div class="role">
            <div class="row">
              <div>
                <h3>${md(role.title)}</h3>
                <p class="meta">${companyName(job)}${job.location ? ` <span class="dot">•</span> ${esc(job.location)}` : ''}</p>
              </div>
              <p class="date">${esc(range(role.start || job.start, role.end || job.end))}</p>
            </div>
            ${i === 0 && job.description ? `<p class="desc">${md(job.description)}</p>` : ''}
            ${bullets(role.bullets)}
            ${results(role.results)}
          </div>`)}
      </div>
    </article>`;
};

const education = (ed) => `
  <article class="entry">
    <div class="row">
      <div>
        <h3>${md(ed.degree)}</h3>
        <p class="meta">${esc(ed.school)}${ed.location ? ` <span class="dot">•</span> ${esc(ed.location)}` : ''}</p>
      </div>
      <p class="date">${esc(ed.date)}</p>
    </div>
    ${bullets(ed.bullets)}
  </article>`;

const skillGroup = (g) => `
  <div class="skill-group">
    <p class="label">${md(g.label)}</p>
    <ul class="chips">${list(g.items, (s) => `<li>${md(s)}</li>`)}</ul>
  </div>`;

export default function site(cv, { reload = '' } = {}) {
  const pdf = pdfName(cv);
  const year = new Date().getFullYear();
  const avatar = cv.photo
    ? `<img class="avatar" src="${esc(cv.photo)}" alt="${esc(cv.name)}">`
    : `<div class="avatar" aria-hidden="true">${esc(initials(cv.name))}</div>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(cv.name)} — ${esc(plain(cv.title))}</title>
  <meta name="description" content="${esc(plain(cv.bio))}">
  <meta property="og:title" content="${esc(cv.name)} — ${esc(plain(cv.title))}">
  <meta property="og:description" content="${esc(plain(cv.bio))}">
  <meta property="og:type" content="website">
  <link rel="icon" href="favicon.png" type="image/png">
  <link rel="apple-touch-icon" href="apple-touch-icon.png">
  <script>try { const t = localStorage.getItem('theme'); if (t) document.documentElement.dataset.theme = t; } catch {}</script>
  <link rel="stylesheet" href="fonts.css">
  <link rel="stylesheet" href="site.css">
</head>
<body>
  <aside class="sidebar">
    <div class="sidebar-top">
      ${avatar}
      <h2 class="name">${esc(cv.name)}</h2>
      <p class="title">${md(cv.title)}</p>
      <p class="bio">${md(cv.bio)}</p>
    </div>
    <ul class="facts">
      ${list(cv.facts, (f) => `<li>${icon(f.icon, 15)}<span>${md(f.text)}</span></li>`)}
    </ul>
    <div class="sidebar-bottom">
      ${cv.links?.length ? `<ul class="links">${list(cv.links, (l) => `<li><a href="${esc(l.url)}">${esc(l.label)}${icon('arrowUpRight', 13)}</a></li>`)}</ul>` : ''}
      <div class="cta">
        <a class="btn btn-dark" href="${pdf}" download>${icon('download', 16)}Download CV</a>
        <a class="btn btn-square" href="mailto:${esc(cv.email)}" aria-label="Email ${esc(cv.name)}">${icon('mail', 16)}</a>
      </div>
    </div>
  </aside>

  <div class="main">
    <header class="nav">
      <div class="nav-inner">
        <nav>
          <a href="#about">About</a>
          <a href="#experience">Experience</a>
          <a href="#education">Education</a>
          <a href="#skills">Skills</a>
        </nav>
        <div class="nav-actions">
          <button class="btn btn-sm btn-square theme-toggle" type="button" aria-label="Toggle dark mode">${icon('moon', 15, 'moon')}${icon('sun', 15, 'sun')}</button>
          <a class="btn btn-dark btn-sm" href="#contact">${icon('message', 14)}Contact Me</a>
        </div>
      </div>
    </header>

    <main id="top">
      <section class="hero">
        ${cv.hero_image ? `<img class="hero-image" src="${esc(cv.hero_image)}" alt="" width="104" height="104">` : ''}
        <h1>${md(cv.headline || cv.title)}</h1>
        ${cv.tagline ? `<p class="lead">${md(cv.tagline)}</p>` : ''}
        <a class="btn btn-soft" href="#experience">View Experience${icon('arrowRight', 16)}</a>
      </section>

      ${cv.about ? `
      <section id="about">
        <h2>About</h2>
        <p class="prose">${md(cv.about)}</p>
      </section>` : ''}

      <section id="experience">
        <h2>Experience</h2>
        <div class="timeline">${list(cv.experience, experience)}</div>
      </section>

      <section id="education">
        <h2>Education</h2>
        ${list(cv.education, education)}
      </section>

      <section id="skills">
        <h2>Skills &amp; Interests</h2>
        ${list(cv.skills, skillGroup)}
      </section>

      <section id="contact" class="contact">
        <h2>Let’s Connect</h2>
        ${cv.contact_note ? `<p class="lead">${md(cv.contact_note)}</p>` : ''}
        <div class="cards">
          <a class="card" href="mailto:${esc(cv.email)}">
            <span class="card-icon">${icon('mail', 18)}</span>
            <span><span class="card-title">Email Me</span><span class="card-sub">${esc(cv.email)}</span></span>
          </a>
          ${cv.phone ? `
          <a class="card" href="tel:${esc(cv.phone.replace(/[^\d+]/g, ''))}">
            <span class="card-icon">${icon('phone', 18)}</span>
            <span><span class="card-title">Call Me</span><span class="card-sub">${esc(cv.phone)}</span></span>
          </a>` : ''}
        </div>
      </section>
    </main>

    <footer class="footer">
      <span>© ${year} ${esc(cv.name)}</span>
      <a href="#top">Back to Top${icon('arrowUp', 14)}</a>
    </footer>
  </div>

  <script>
    const nav = document.querySelector('.nav');
    addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 8), { passive: true });

    const root = document.documentElement;
    document.querySelector('.theme-toggle').addEventListener('click', () => {
      const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
      root.dataset.theme = dark ? 'light' : 'dark';
      try { localStorage.setItem('theme', root.dataset.theme); } catch {}
    });
  </script>${reload}
</body>
</html>
`;
}
