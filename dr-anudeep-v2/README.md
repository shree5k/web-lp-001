# Dr. Anudeep website

Static landing page and an Eleventy blog. No Node server is required on the
production host. Run commands from this folder with Node 20 or newer.

```sh
npm ci
npm run dev
```

The preview runs at http://localhost:8080/ and includes clearly labelled draft
and demo articles. Stop the preview before running checks or building production.

```sh
npm test
npm run build
```

Publish only `_site/`. Configure `SITE_URL` with the final HTTPS origin before
deployment. Source files, dependencies, documentation and draft articles are not
deployment artifacts. `node_modules/`, `_site/` and local environment files are
ignored by Git.

```text
assets/
  css/           Base styles, tokens and component styles
  js/            Landing page, blog and visual effects
  images/        Hero, logo, expertise, gallery and blog uploads
  fonts/         Local display font
  vendor/        Third-party browser libraries and licence notices
blog/            Eleventy templates and shared partials
content/blog/    Article Markdown
docs/            Editing instructions, design notes and source credits
lib/             Build-time rendering logic
scripts/         Build commands
tests/           Code and production-build checks
```

- [Doctor’s guide: write and publish](docs/WRITING_ARTICLES.md)
- [Administrator setup: Pages CMS and hosting](docs/PUBLISHING.md)
- [Styles and components](docs/DESIGN_SYSTEM.md)
- [Content and image sources](docs/CONTENT_SOURCES.md)
- [Generated illustration provenance](docs/gallery-image-sources.json)

Article Markdown lives in `content/blog/`; CMS uploads go to `assets/images/blog/`.
The repository-root `.pages.yml` configures the writing interface. The three
demo drafts are intentional preview fixtures and are excluded from production.
Article URLs come from filenames, and the author defaults to Dr. Anudeep.
Optional author, featured and search settings are grouped in the editor.

The prepared GitHub Pages workflow supports repository subpaths and stays
disabled until the repository variable `SITE_HOST=github-pages` is set. See the
administrator guide before enabling a host; account setup is still required.

Site images use local WebP files at their original dimensions. The PNG/JPEG
duplicates, old section archives and unused Swiper dependencies have been
removed. The base stylesheet is `assets/css/base.css`; reference project folders are
not needed to build or test this site.
