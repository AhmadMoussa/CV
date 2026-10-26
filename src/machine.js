// Machine-readable versions of the CV for search engines, AI crawlers and résumé tools.
// Everything here is derived from cv.yaml, so it stays in sync with the site and PDF.
import { plain, range, isoMonth, host, pdfName } from './lib.js';

const abs = (cv, p = '') => new URL(p, cv.url.endsWith('/') ? cv.url : `${cv.url}/`).href;
const city = (cv) => (cv.location || '').split(',')[0].trim();
// "German (C2)" → { language: 'German', level: 'C2' }
const languages = (cv) =>
  (cv.skills?.find((g) => /^languages?/i.test(g.label))?.items || []).map((item) => {
    const [, language, level] = plain(item).match(/^(.*?)\s*(?:\(([ABC][12])\))?$/);
    return { language, level };
  });
const status = (cv) => [cv.availability, cv.work_authorisation].filter(Boolean).map(plain);
const place = (cv) => `${cv.location}${cv.timezone ? ` (${cv.timezone})` : ''}`;
const otherSkills = (cv) => cv.skills?.filter((g) => !/^(languages?|interests?)/i.test(g.label)) || [];
const interests = (cv) => cv.skills?.find((g) => /^interests?/i.test(g.label))?.items || [];

// Bullets (strings or { text, sub }) flattened to plain strings
const flatBullets = (items = []) =>
  items.flatMap((b) => (typeof b === 'string' ? [plain(b)] : [plain(b.text), ...(b.sub || []).map(plain)]));
const resultsLine = (results) =>
  results?.length ? [`Key results: ${results.map((r) => `${r.value} ${plain(r.label)}`).join(', ')}`] : [];

// Each role as its own entry, newest first
const roles = (cv) =>
  (cv.experience || []).flatMap((job) =>
    job.roles.map((role, i) => ({
      job,
      role,
      start: role.start || job.start,
      end: role.end || job.end,
      description: i === 0 ? job.description : '',
    }))
  );

// ── schema.org JSON-LD (Google ProfilePage + Person) ─────────
export function jsonLd(cv, modified) {
  const person = {
    '@type': 'Person',
    '@id': abs(cv, '#person'),
    name: cv.name,
    jobTitle: plain(cv.title),
    description: plain(cv.about || cv.bio),
    url: abs(cv),
    ...(cv.photo && { image: abs(cv, cv.photo) }),
    email: `mailto:${cv.email}`,
    ...(cv.phone && { telephone: cv.phone }),
    ...(cv.location && { homeLocation: { '@type': 'Place', name: cv.location } }),
    sameAs: (cv.links || []).map((l) => l.url),
    knowsLanguage: languages(cv).map((l) => l.language),
    knowsAbout: otherSkills(cv).flatMap((g) => g.items.map(plain)),
    alumniOf: (cv.education || []).map((e) => ({
      '@type': 'EducationalOrganization',
      name: e.school,
      ...(e.location && { address: e.location }),
    })),
    // schema.org Role pattern: Person → EmployeeRole (dates, title) → Organization
    worksFor: roles(cv).map(({ job, role, start, end }) => ({
      '@type': 'EmployeeRole',
      roleName: plain(role.title),
      ...(isoMonth(start) && { startDate: isoMonth(start) }),
      ...(isoMonth(end) && { endDate: isoMonth(end) }),
      worksFor: { '@type': 'Organization', name: job.company, ...(job.url && { url: job.url }) },
    })),
  };
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: abs(cv),
    dateModified: modified,
    mainEntity: person,
  };
}

// ── JSON Resume (https://jsonresume.org/schema) ──────────────
export function resumeJson(cv) {
  return {
    $schema: 'https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json',
    basics: {
      name: cv.name,
      label: plain(cv.title),
      ...(cv.photo && { image: abs(cv, cv.photo) }),
      email: cv.email,
      ...(cv.phone && { phone: cv.phone }),
      url: abs(cv),
      summary: plain(cv.about || cv.bio),
      location: { city: city(cv) },
      profiles: (cv.links || []).map((l) => ({
        network: l.label,
        username: new URL(l.url).pathname.split('/').filter(Boolean).pop() || host(l.url),
        url: l.url,
      })),
    },
    work: roles(cv).map(({ job, role, start, end, description }) => ({
      name: job.company,
      position: plain(role.title),
      ...(job.url && { url: job.url }),
      ...(job.location && { location: job.location }),
      ...(isoMonth(start) && { startDate: isoMonth(start) }),
      ...(isoMonth(end) && { endDate: isoMonth(end) }),
      ...(description && { summary: plain(description) }),
      highlights: [...flatBullets(role.bullets), ...resultsLine(role.results)],
    })),
    education: (cv.education || []).map((e) => {
      const [studyType, area] = plain(e.degree).split(/,\s*/);
      return {
        institution: e.school,
        ...(area && { area }),
        studyType,
        ...(isoMonth(e.date) && { endDate: isoMonth(e.date) }),
        courses: flatBullets(e.bullets),
      };
    }),
    skills: otherSkills(cv).map((g) => ({ name: plain(g.label), keywords: g.items.map(plain) })),
    languages: languages(cv).map((l) => ({ language: l.language, fluency: l.level ? `${l.level} (CEFR)` : 'Fluent' })),
    interests: interests(cv).map((i) => ({ name: plain(i) })),
  };
}

// ── Markdown CV (cv.md) — same content as the PDF ────────────
const mdBullets = (items = [], extra = []) =>
  [...items, ...extra]
    .map((b) => (typeof b === 'string' ? `- ${b}` : [`- ${b.text}`, ...(b.sub || []).map((s) => `  - ${s}`)].join('\n')))
    .join('\n');

export function markdown(cv) {
  const contact = [
    cv.email,
    cv.phone,
    place(cv),
    cv.url && `[${host(cv.url)}](${abs(cv)})`,
    ...(cv.links || []).map((l) => `[${l.label}](${l.url})`),
  ].filter(Boolean);

  const experience = (cv.experience || []).map((job) => {
    const head = `### ${job.url ? `[${job.company}](${job.url})` : job.company}${job.location ? ` — ${job.location}` : ''}`;
    const rolesMd = job.roles.map((role, i) =>
      [
        `**${plain(role.title)}** · ${range(role.start || job.start, role.end || job.end)}`,
        i === 0 && job.description,
        mdBullets(role.bullets, resultsLine(role.results).map((r) => r.replace(/^Key results:/, '**Key results:**'))),
      ]
        .filter(Boolean)
        .join('\n\n')
    );
    return [head, ...rolesMd].join('\n\n');
  });

  const education = (cv.education || []).map((e) =>
    [`### ${e.school}${e.location ? ` — ${e.location}` : ''}`, '', `**${plain(e.degree)}** · ${e.date}`, '', mdBullets(e.bullets)].join('\n')
  );

  return [
    `# ${cv.name}`,
    '',
    `${plain(cv.title)}  `,
    contact.join(' · '),
    ...(status(cv).length ? ['', `**${status(cv).join(' · ')}**`] : []),
    '',
    cv.about || cv.bio,
    '',
    '## Work Experience',
    '',
    experience.join('\n\n'),
    '',
    '## Education',
    '',
    education.join('\n\n'),
    '',
    '## Skills & Interests',
    '',
    (cv.skills || []).map((g) => `- **${g.label}:** ${g.items.join(', ')}`).join('\n'),
    '',
  ].join('\n');
}

// ── llms.txt (https://llmstxt.org) ───────────────────────────
export function llmsTxt(cv) {
  return [
    `# ${cv.name}`,
    '',
    `> ${plain(cv.title)} based in ${place(cv)}. ${plain(cv.bio)}`,
    ...(status(cv).length ? ['', `Availability: ${status(cv).join('. ')}.`] : []),
    '',
    plain(cv.about || ''),
    '',
    '## CV',
    '',
    `- [CV in Markdown](${abs(cv, 'cv.md')}): full CV — experience, education, skills`,
    `- [CV as PDF](${abs(cv, pdfName(cv))}): one-page printable CV with the same content`,
    `- [CV as JSON Resume](${abs(cv, 'resume.json')}): structured data following the jsonresume.org schema`,
    '',
    '## Contact',
    '',
    `- Email: ${cv.email}`,
    ...(cv.phone ? [`- Phone: ${cv.phone}`] : []),
    ...(cv.links || []).map((l) => `- [${l.label}](${l.url})`),
    '',
  ].join('\n');
}

// ── robots.txt + sitemap.xml ─────────────────────────────────
export const robotsTxt = (cv) =>
  `# Search engines and AI crawlers are welcome to read and index this CV.
User-agent: *
Allow: /

Sitemap: ${abs(cv, 'sitemap.xml')}
`;

export const sitemap = (cv, modified) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[abs(cv), abs(cv, pdfName(cv)), abs(cv, 'cv.md')]
  .map((loc) => `  <url><loc>${loc}</loc><lastmod>${modified}</lastmod></url>`)
  .join('\n')}
</urlset>
`;
