# Landing page style system

`assets/css/tokens.css` owns the shared tokens. It loads after the `assets/css/base.css` and before the local component styles. Components consume tokens in their existing stylesheet; keep component changes in their owning stylesheet. The base CSS contains only utilities and reset rules used by the current site; add utilities there only when needed.

## Type and component roles

| Role | Default | Mobile adjustment |
| --- | --- | --- |
| Body | Inter/system sans, 15px, weight 400, line height 1.7 | Same |
| Section heading | Sans, `clamp(32px, 3.3vw, 46px)`, weight 300 | Fluid scale |
| Card title | Sans, 24px, weight 300 | 21px |
| Lead paragraph | Sans, 20px | 18px |
| Action label | Sans, 14px, weight 400 | Same |
| Metadata / eyebrow | 12px / 11px | Same |
| Dialog title | Sans, 28px | 24px |

Shared actions use a 48px minimum height, 24px horizontal padding and pill radius. Media, panels and dialogs use 24px corners; image controls use 8px corners. Main content is limited to 1216px, with a 1440px gallery variant. Standard section spacing is 88px, reducing to 48px below 768px; side gutters reduce from 32px to 20px.

## Palette and surface roles

| Token role | Value / purpose |
| --- | --- |
| Page / white | `#fdfbf5` / `#fff` |
| Sand / panel | `#ede9dd` / `#f5f1e8` |
| Expertise / practice card | `#f6f1e7` |
| Expertise titles | `#724713` |
| CTA surface | `#e8ddc6` |
| Mobile Book circle / glow | `#251706` / `#a78021` |
| Dark / shader | `#151412` / `#000` |
| Heading / strong | `#2c2c2c` / `#494137` |
| Body / readable accent | `#6c645a` / `#74644f` |
| Inverse / muted inverse | `#f3f3f3` / `#e2dcd2` |
| Decorative accent / gold | `#a6957e` / `#e0c4a0` |

Use readable accent for small labels and links on light surfaces. Decorative accent and gold are intended for non-text details or dark surfaces; they are not substitutes for body text. Text tokens meet 4.5:1 contrast against their supported opaque surfaces. Shader imagery and translucent layers still need rendered contrast review.

## Intentional exceptions

- Hero copy keeps its centred alignment on desktop and tablet, and left alignment on mobile. The description uses 17px/1.65 sans-serif text on desktop and 15px on mobile, with a natural phrase break on wider screens. Artwork position and header presentation are unchanged by this refinement.
- The approved hero and header keep their exact sizing, colors, responsive behavior and spacing. The care strip pairs custom gold line illustrations with sentence-case IvyMode titles, warm cream text, 13px descriptions and fine dividers; desktop columns become stacked rows on mobile. Its content stays visible without scroll-triggered reveals. IvyMode is also used for the hero, philosophy quote, patient review and closing care heading; other text uses the shared sans-serif roles.
- The expertise rail stays edge to edge with capsule images. The gallery keeps its wider container and square comparison geometry.
- Shader colors, animation behavior and section heights stay as implemented. Patient feedback retains its borderless glass card and ambient shader; it does not acquire scroll-linked motion.
- Icon controls, mobile navigation and the header retain their existing interaction-specific sizing.

## File names and reusable effects

- `assets/css/main.css` owns base page controls, header, hero and expertise. `assets/css/sections.css` owns the content sections.
- `assets/css/blog.css` owns the journal and article layouts, including 18px/1.8 long-form text with a 720px reading width. It scopes its sticky header and mobile navigation changes to `.blog-page`; the landing-page header is unchanged.
- `assets/css/shader-sections.css` owns the shared `.bands-background` layers and closing `.care-cta` presentation. `assets/js/effects/bands-background.js` renders the animated bands for any `[data-bands-background]` section.
- `data-bands-motion="ambient"` keeps animation local without scroll positioning or fading. The default mode retains the existing scroll effect.
- The renderer retains its original shader source attribution and integrity hash. These credit its origin; they are not runtime dependencies on the Ornn project.
- Generic `.site-header`, `.site-nav`, `.hero-wrap`, `.hero`, and `.button-link` classes replace source-project naming.

## Ownership and changes

- Change reusable values in `assets/css/tokens.css`. Component layout belongs to its existing adapter: `assets/css/main.css` for base controls/expertise, `assets/css/sections.css` for content sections, `assets/css/gallery.css` for comparisons, and `assets/css/shader-sections.css` for the closing shader section.
- Imported utilities assign `--font-sans` directly to text elements. The scoped bridge in `assets/css/sections.css` maps it to `--font-body` below the hero and inside dialogs; keep that bridge scoped so font updates do not alter the approved hero/header.
- Use role tokens rather than adding near-duplicate colors, one-off text sizes or `!important` caption overrides. Add a token only for a reusable role; keep justified layout exceptions local.
- Preserve rolling-label markup, animation selectors, dialog IDs, shader attributes and image comparison variables when changing presentation.
- Blog pages use reusable header/footer partials in `blog/_includes/` and load `assets/js/blog.js` for navigation plus the shared contact launcher. They do not load landing-page animation, dialog or rail scripts. See `PUBLISHING.md` for article editing and build commands.
- `assets/js/contact.js` owns the shared floating contact launcher and its destinations. Its presentation is in `assets/css/main.css`. It opens on mouse hover, button activation or keyboard navigation, and sits above the mobile dock on the landing page. Blog pages use the lower position because they have no dock.
- Do not refresh the protected hero/header test baseline automatically. An intentional change to that approved design requires explicit review.
- Keep only current image assets; `docs/gallery-image-sources.json` retains the prompts for the live gallery illustrations. Superseded binaries, stock photos and duplicate fonts have been removed.

Run the dependency-free code checks from the workspace root:

```sh
node --test dr-anudeep-v2/tests/*.test.cjs
python3 dr-anudeep-v2/tests/test_integrity.py
python3 dr-anudeep-v2/tests/test_design_system.py
```

The style tests verify stylesheet order, variable resolution, token contrast, responsive roles and preserved hero/header declarations. These checks do not prove rendered font wrapping, device layout or GPU shader appearance.

The floating contact control and its menu options use a borderless dark glass surface: translucent fill, 24px backdrop blur, a faint gold glow and soft shadows. Shared contact glass tokens keep both surfaces consistent. The launcher layers a warm lower-edge highlight and diffuse amber halo over the glass; opening or hovering gently increases the glow without adding a border. Its hover lift, icon movement and staggered option entrance respect reduced-motion preferences; consultation buttons retain their cream finish.

The floating contact launcher starts as a 56px icon and expands to a 128px labelled pill after a 220ms visual delay when scroll position exceeds zero. Returning to the top cancels pending expansion; collapse has no delay. Returning to the top collapses it again, on every page. Mobile, desktop, restored scroll positions and reduced motion are supported.

Hero light experiment: `hero--glass-glow` adds only a faint, static warm glow at the lower-right edge (7% opacity on desktop, 5% on mobile), with no blur or panel behind the copy. Removing that modifier restores the original hero finish.

Dialog scrollbars and the no-JavaScript page fallback use a thin native bronze thumb and transparent track, with rounded 6px styling where WebKit scrollbar selectors apply. System high-contrast colors take precedence. The expertise rail retains its hidden scrollbar.

The page scrollbar uses `assets/js/scrollbar.js` to draw a draggable 3px bronze overlay thumb with no gutter or track. Native page scrolling stays active; without JavaScript or in forced-colors mode the native scrollbar remains available. Dialogs retain thin native scrollbars.

Selected editorial sections from `dr-anudeep-exploration` are now used in the main landing page: surgeon, gallery and practice. Their `.editorial-section` scope owns the warmer surfaces, wider gutters, IvyMode headings and more generous spacing; other sections keep their approved tokens. The existing main JavaScript continues to own entrances, image parallax and gallery controls. The practice image uses 125% overscan for a visible -16% vertical parallax without uncovering the card. Its booking button uses a dark warm surface and ivory text. Clinical expertise keeps the original horizontal looping rail and keyboard controls, with only the editorial heading/card typography and 01–08 numbers adopted. Runtime-created copies inherit the numbers and remain hidden from assistive technology.

Clinical expertise has no visible arrow controls; swiping, keyboard navigation, hover pause, automatic looping and resizing remain supported. Hero kicker and description use the exploration’s size, colour, tracking and line-height while retaining the main hero composition.

Header branding uses a 72px logo with a 22px name and 10px gap; compact desktop uses a 60px logo and 8px gap. The booking separator is a faint 18px vertical stroke instead of a full-height border. The header baseline was reviewed and updated for these explicitly requested changes; hero geometry remains protected.

The hero care strip uses aligned 20px IvyMode titles and 40px icons (36px on mobile), with no subtext. Desktop dividers are short and faint; mobile rows use fine horizontal separators.

The hero scroll cue uses two small downward SVG arrowheads linking to the surgeon section, with a 44px minimum hit area. A 1.8s staggered fade creates a gentle downward wave; reduced motion shows both arrowheads statically.

Expertise dialogs enter with a 320ms fade and small upward movement; closing reverses into a 200ms fade. The backdrop fades with the panel. Close button, outside click and Escape share the exit path; focus restoration and scroll resumption wait until the exit completes. Reduced motion or missing animation support closes immediately.

The standalone `/services/` page uses scoped `body.services-page` styles and the editorial warm palette, IvyMode headings, a capsule image and numbered service groups. Its desktop category index is sticky; mobile uses a horizontal native list. All procedures remain server-rendered and available without JavaScript.

Services art direction: dark opening with a layered, arched image composition; warm editorial catalog with images and numbered headings for all service categories. A dark consultation section closes the page. Decorative photos reuse the locally credited stock assets and do not depict patient results.

The landing hero headline uses warm ivory `#f3eee4` for both lines, preserving its existing type scale and line breaks.

The landing headline retains its earlier IvyMode weight 400, 1.12 line-height, and tracking of -.025em on desktop and -.03em on mobile. The second line inherits the headline font and colour.

Services motion uses the same local GSAP/ScrollTrigger versions as home through `assets/js/services.js`: staggered hero text, image entrances, once-only service reveals and restrained desktop image parallax. Reduced motion, missing libraries or initialization failure leaves the content visible; preference changes revert active animations. The landing runtime is not loaded or changed.

All 11 services categories now have contextual, locally stored imagery with a consistent 6px rounded rectangular frame. Alternating arch crops and text-only category variants were removed. Existing entrance and desktop parallax selectors cover the added images.

The home Instagram section sits immediately before Care centred on you. Three user-selected reels use their real, locally cached cover images and accurate source handles. Paper-like frames tilt lightly on desktop and straighten on hover; mobile is a swipeable native rail. `assets/js/reels.js` populates an Instagram iframe only after selection; `main.js` owns the shared native dialog, focus return, Escape/backdrop dismissal and scroll pause. Closing removes the iframe to stop playback. Without enhancement, cards open their original Instagram links. Entrance motion follows the existing GSAP treatment and reduced-motion setting.

The floating Call option displays +91 80706 07068 and copies +918070607068 when activated, with an announced Copied confirmation. It stays open for feedback, uses a selection fallback when Clipboard API access is unavailable, and does not dial the number. WhatsApp and Instagram retain their existing destinations.


### Shared inner-page sections

`lib/page-components.cjs` renders the hero (`renderPageHero`) and consultation (`renderNextStep`) used by About and Expertise. Their responsive layout lives in `assets/css/page-sections.css` and animation lifecycle in `assets/js/page-motion.js`. Hero content and images are page-specific; About uses an unaccented name and a contained portrait. The booking panel has a single shared source for copy, styling and link. About body-section motion remains in `about.js`; the landing page does not load these components.


### About body composition

The training section is a five-location route, horizontal on desktop and vertical below 600px, with all qualifications visible without controls. FIRM remains separate because the source does not specify its location. The experience section reuses the approved doctor portrait (not presented as an action photograph) beside compact institution groups. Research uses the established dark brown and ivory palette with two concise contribution notes. About body motion draws the route once, reveals each mobile stop independently and applies a small desktop-only portrait parallax. Reduced motion retains a complete static route. The shared hero is unchanged.


Consultation buttons use the rolling-label hover without scaling the button. Hero and surgeon CTA entrance animations remain on `.button-entrance` wrappers.
