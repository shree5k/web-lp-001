# Website brand guide

Standalone visual reference for the current landing page. Open `/brand-guide/` on the development server, or open this folder’s `index.html` directly. The build includes the page; public navigation does not link to it, and it is marked noindex.

The guide follows a narrative: care centred on you → recognition → visual character → the experience of care. Full-width belief, colour and type spreads lead into interface examples and desktop/mobile website compositions. The plain logo cover is retained. Native details elements hold technical specifications; the closing experience embeds the actual landing page at 1440px desktop and 390px mobile viewport widths. A small ResizeObserver adapter scales the frames without changing their responsive layouts.

Presentation takes cues from the pacing and varied specimen scales in [Mother Design’s Purple Garden case study](https://www.motherdesign.com/work/PurpleGarden). All brand artwork, colours, font and examples come from this site; no reference-site assets are included.

`guide.css` owns this page’s styles. Shared values load from `../assets/css/tokens.css`; the logo, font and images use existing local assets. Rolling labels, the scroll cue and contact-material hover/focus preview use CSS and respect reduced motion. `guide.js` scales only the live website frames; it does not modify the landing page. The landing page is unchanged.

When changing the site, review specimens against the owning component CSS as well as shared tokens. Hero and editorial sections have local overrides. Preserve image provenance in `docs/CONTENT_SOURCES.md`.
