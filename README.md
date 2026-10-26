# Ahmad Moussa — CV website

A small static CV site whose downloadable PDF is generated from the same data, so the two never drift apart.

```
cv.yaml  ──►  dist/index.html            (the website)
         ──►  dist/Ahmad_Moussa_CV.pdf   (the PDF, printed by headless Chrome)
```

## Updating your CV

1. Edit **`cv.yaml`**. That's the only file you need to touch for content.
2. Commit and push to `main`. GitHub Actions rebuilds the site and the PDF and publishes both.

Text fields support `**bold**`, `*italic*` and `[links](https://…)`.

## Working locally

```bash
npm install
npm run dev      # http://localhost:3000, rebuilds site + PDF on every save
npm run build    # one-off build into dist/
```

`npm run dev` also serves `/print.html`, a live preview of the PDF layout. The terminal tells you how many pages the PDF has after each rebuild, so you'll notice if an addition spills onto a second page.

## Project layout

| Path | What it is |
| --- | --- |
| `cv.yaml` | All CV content |
| `src/site.js`, `src/site.css` | Website template and styles |
| `src/print.js`, `src/print.css` | PDF template and styles (A4) |
| `src/sketch.js` | The generative Truchet badge in the hero (click it) |
| `src/build.js`, `src/dev.js` | Build script and live-reload dev server |
| `public/` | Copied as-is to the site root (favicon, photo, `CNAME`, …) |

## Photo and company logos

Images live in `public/` and are referenced from `cv.yaml`:

```yaml
photo: photo.jpg                 # sidebar photo (remove to show initials)
experience:
  - company: fxhash
    logo: logos/fxhash.png       # square tile in the timeline (remove to show the first letter)
```

## Publishing on GitHub Pages (one-time setup)

1. Push this repo to GitHub.
2. In the repo, go to **Settings → Pages → Build and deployment** and set **Source** to **GitHub Actions**.
3. The next push (or **Actions → Deploy → Run workflow**) publishes the site at `https://<user>.github.io/<repo>/`.

To use your own domain, add a `public/CNAME` file containing the domain (e.g. `cv.gorillasun.com`) and point a DNS CNAME record at `<user>.github.io`.

## Notes

- Fonts (Geist and Habibi) are self-hosted from `@fontsource`, so the site makes no requests to Google Fonts.
- The site follows the visitor's light/dark system setting, with a toggle in the nav. The PDF is always light.
- Icons are from [Lucide](https://lucide.dev) (ISC). The Gorilla Sun sun is from [Font Awesome Free](https://fontawesome.com/license/free) (CC BY 4.0).
