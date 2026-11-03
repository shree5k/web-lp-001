# Blog setup and publishing

For the doctor, use [Writing and publishing an article](WRITING_ARTICLES.md).
This guide covers the one-time administrator setup and local development.

## What is ready

- The repository-root `.pages.yml` exposes **Articles** and article images.
- New filenames are generated from the first title using `{fields.title}.md`.
  Filename editing and renaming are disabled, so later title edits keep the URL.
- The build derives the article URL from its filename. An existing explicit
  `slug` is supported but must match that filename.
- Missing or blank authors default to **Dr. Anudeep T Channaiah** in the website
  build. Optional overrides are stored in the `advanced` object. Legacy flat
  author, featured and search-description fields remain supported.
- Missing publication status defaults to Draft. Drafts and `demo: true` articles
  are never included in production routes, feed, sitemap or related reading.
- The three demo drafts remain local preview fixtures and are hidden from the
  doctor's article list through the CMS `exclude` setting.
- Both root-domain hosting and repository paths such as `/web-lp-001/` work.
- A GitHub Pages workflow is prepared locally but is disabled unless the
  repository variable `SITE_HOST` is set to `github-pages`.

The CMS is not an `/admin` page inside the website. Its interface is hosted at
[app.pagescms.org](https://app.pagescms.org/). No accounts have been connected,
invites sent, code pushed or remote deployments run by this setup.

## Connect Pages CMS once

1. Put the website source, repository-root `.pages.yml`, and chosen hosting
   configuration in the intended GitHub repository.
2. Sign into Pages CMS with an administrator's GitHub account and install its
   GitHub App for that repository. Open the production branch; the prepared
   configuration should provide **Articles** and **Media**.
3. Invite the doctor by email. Collaborators can edit configured content and
   media without a GitHub account, but cannot manage the CMS configuration or
   collaborator list.
4. Connect one hosting provider below. CMS saves become GitHub commits; a
   connected successful production build makes eligible articles public.
5. Before inviting the doctor to publish real content, check one new Draft in
   the editor, publish an approved test article, edit its title, verify its URL
   stays unchanged, and change it back to Draft. This hosted end-to-end check
   requires the account connections; local code checks cannot perform it.

References: [CMS setup](https://pagescms.org/docs/quick-start/),
[email collaborators](https://pagescms.org/docs/configuration/collaborators/),
[generated filenames](https://pagescms.org/docs/configuration/content/filename/).

## GitHub Pages

The repository-root workflow is `.github/workflows/publish-doctor-site.yml`.
It uses GitHub's deployment actions, runs the checks and production build, then
uploads only `dr-anudeep-v2/_site`. It does not publish source or preview builds.

One-time setup in the GitHub repository:

1. Under **Settings → Pages**, choose **GitHub Actions** as the build source.
2. Under **Settings → Secrets and variables → Actions → Variables**, add
   `SITE_HOST` with the value `github-pages`. This enables the prepared workflow.
3. Push the prepared files to `main`, or run **Publish doctor website** from the
   Actions tab on `main`. Content saves to `main` subsequently trigger it.
4. Use the same `main` branch in Pages CMS. If the production branch changes,
   update the workflow branch filter and job condition together.
5. Configure a custom domain and HTTPS under Pages settings if needed.

The workflow reads the origin and repository path from GitHub Pages. It sets
`SITE_URL` and `SITE_PATH_PREFIX` automatically; do not enter the repository path
into `SITE_URL`. Example: origin `https://shree5k.github.io`, prefix `/web-lp-001`.
With a custom domain, the prefix is normally empty.

The workflow stays skipped if `SITE_HOST` is unset or set to another host. This
avoids deploying to GitHub Pages unintentionally when Cloudflare is selected.

GitHub restricts using Pages to run online businesses and sites primarily
facilitating commercial transactions. Review the
[GitHub Pages usage policy](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
before using it for the clinic. Cloudflare remains the suggested alternative
for the public practice website.

## Cloudflare Pages alternative

Connect the same repository through Cloudflare's Git integration. Leave
`SITE_HOST` unset so the GitHub Pages workflow stays disabled.

| Setting | Value |
| --- | --- |
| Root directory | `dr-anudeep-v2` |
| Production branch | `main` |
| Build command | `npm run build` |
| Output directory | `_site` |
| `SITE_URL` | Final HTTPS origin, such as `https://www.your-domain.example` |
| `SITE_PATH_PREFIX` | Leave unset for domain-root hosting |

Branch previews should use the production build too. Do not deploy
`build:preview`: it deliberately contains unpublished content.
See [Cloudflare build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/).

## Local development

Use Node 20 or newer and run `npm ci` from `dr-anudeep-v2/` first.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local server with visibly labelled drafts and demos |
| `npm run build` | Production output in `_site/` |
| `npm run build:preview` | Local noindex output with drafts and demos |
| `npm test` | Article, root/subpath build, link, asset and interaction checks |

Stop the development server before running checks: build tests recreate `_site`.
The root-domain local preview is at http://localhost:8080/blog/.

For a local repository-path build:

```sh
SITE_URL=https://example.test SITE_PATH_PREFIX=/clinic npm run build
```

`SITE_URL` must be an HTTPS origin without a path or query. If absent,
`CF_PAGES_URL` can supply the origin. If neither is valid, absolute metadata is
omitted. `SITE_PATH_PREFIX` is optional and must be a path such as `/clinic`.
Only `_site/` is deployable; source, documentation, dependencies and CMS config
are not deployment artifacts.

## Article format and images

Articles live in `content/blog/*.md`. Uploads are stored in
`assets/images/blog/`, with CMS URLs beginning `/assets/images/blog/`. Keep
uploaded images reasonably sized; uploads are not automatically transcoded.

A new editor-created article can omit `slug` and `author`:

```yaml
---
title: "Preparing for your consultation"
summary: "A short, reviewed introduction for the article listing."
cover: /assets/images/blog/consultation.webp
coverAlt: "A plain description of the cover image."
category: Consultation
date: "2026-10-30"
status: draft
advanced:
  featured: false
  seoDescription: ""
---

The reviewed Markdown article goes here.
```

Required published fields are title, summary, cover, coverAlt, category, date and
body. Categories are Consultation, Facial Aesthetics, Body Contouring,
Reconstruction and Recovery. The default author can be overridden with
`advanced.author`; search text defaults to the summary.

Save this example as `preparing-for-your-consultation.md` for the corresponding
permanent URL. Avoid generic reserved filenames `category.md` and `page.md`.
Do not rename a published file without arranging a redirect. There is no
scheduled publishing, separate published revision or hosted draft-preview
service in this setup. Draft source is readable if the repository is public.
