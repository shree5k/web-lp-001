"""Code-only design-system safeguards; no browser or third-party dependencies.

These tests check token wiring, contrast, and approved CSS invariants. They do
not substitute for rendered-page review of wrapping, typography, or GPU output.
"""
from hashlib import sha256
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
LOCAL_CSS = ('assets/css/main.css', 'assets/css/sections.css', 'assets/css/gallery.css', 'assets/css/shader-sections.css', 'assets/css/reels.css')
VARIABLE = re.compile(r'var\(\s*(--[\w-]+)')
DECLARATION = re.compile(r'(--[\w-]+)\s*:\s*([^;{}]+)')
# Updated for the requested mobile hero typography and composition. The baseline capture
# included footer selectors by accident; those are intentionally excluded here.
# USP item styles are excluded after the explicitly requested care-strip redesign;
# header and artwork retain their prior baseline. Hero copy layout is excluded
# after the explicitly requested typography and layout refinement.
PROTECTED_SELECTORS = frozenset([
    '.header-brand', '.header-brand-copy .brand-prefix', '.header-brand-copy small',
    '.header-content', '.header-logo', 
     
    '.hero-image-motion', '.hero-image-motion, .hero-slide, .hero-shade',  '.hero-scroll',
    '.hero-scroll a', '.hero-shade', '.hero-slide', '.is-scrolled .reference-nav',
     '.logos-container', '.media-window', '.practice-brand',
    '.practice-brand > .header-brand-copy', '.practice-brand > span',
    '.practice-brand small', '.reference-header', '.reference-header.is-scrolled',
    '.reference-hero',  '.reference-hero h1 em',
    '.reference-hero-wrap', '.reference-hero-wrap > #media',
    '.reference-hero-wrap > #media > .max-w-7xl', '.reference-nav',
    '.reference-nav .book-link', '.reference-nav a', '.reference-nav a::after',
    '.reference-nav a:hover::after',  
      
     
])
# Header logo scale, copy spacing and booking separator updated at the user's request.
PROTECTED_HASH = 'ce610d863c8da613253765a3528d5956e139c3177d85ac588d1a990212f5944c'


class Stylesheets(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.hrefs = []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'link' and attrs.get('rel') == 'stylesheet':
            self.hrefs.append(attrs['href'])


def declarations(text):
    return {name: value.strip() for name, value in DECLARATION.findall(text)}


def luminance(color):
    value = color.strip().lstrip('#')
    if len(value) == 3:
        value = ''.join(channel * 2 for channel in value)
    if len(value) != 6:
        raise ValueError(f'Expected an opaque hex color, got {color}')
    channels = [int(value[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    linear = [v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in channels]
    return sum(v * weight for v, weight in zip(linear, (.2126, .7152, .0722)))


def contrast(a, b):
    light, dark = sorted((luminance(a), luminance(b)), reverse=True)
    return (light + .05) / (dark + .05)


class DesignSystem(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.system = (ROOT / 'assets/css/tokens.css').read_text()
        cls.tokens = declarations(cls.system.split('@media', 1)[0])

    def test_stylesheet_order(self):
        links = Stylesheets((ROOT / 'index.html').read_text()).hrefs
        self.assertEqual(links.count('assets/css/tokens.css'), 1)
        token_index = links.index('assets/css/tokens.css')
        imports = [i for i, href in enumerate(links) if href == 'assets/css/base.css']
        self.assertTrue(imports)
        self.assertLess(max(imports), token_index)
        for local in LOCAL_CSS:
            self.assertGreater(links.index(local), token_index)

    def test_custom_properties_resolve_without_cycles(self):
        # Slider position is supplied by inline markup/runtime rather than tokens.
        local_sources = [self.system] + [(ROOT / name).read_text() for name in LOCAL_CSS]
        sources = local_sources + [(ROOT / 'index.html').read_text()]
        definitions = set().union(*(set(declarations(source)) for source in sources))
        for name, source in zip(('assets/css/tokens.css',) + LOCAL_CSS, local_sources):
            with self.subTest(stylesheet=name):
                self.assertFalse(set(VARIABLE.findall(source)) - definitions)

        def resolve(name, ancestors=()):
            self.assertNotIn(name, ancestors, f'Circular token: {ancestors + (name,)}')
            for dependency in VARIABLE.findall(self.tokens[name]):
                self.assertIn(dependency, self.tokens)
                resolve(dependency, ancestors + (name,))

        for name in self.tokens:
            resolve(name)

    def test_readable_foregrounds_meet_normal_text_contrast(self):
        for foreground in ('--text-heading', '--text-body', '--text-strong', '--text-accent'):
            for background in ('--surface-white', '--surface-page', '--surface-sand', '--surface-panel'):
                with self.subTest(foreground=foreground, background=background):
                    self.assertGreaterEqual(contrast(self.tokens[foreground], self.tokens[background]), 4.5)
        for foreground in ('--text-inverse', '--text-inverse-muted', '--text-inverse-subtle'):
            for background in ('--surface-dark', '--surface-shader'):
                with self.subTest(foreground=foreground, background=background):
                    self.assertGreaterEqual(contrast(self.tokens[foreground], self.tokens[background]), 4.5)

    def test_shared_roles_and_mobile_scale(self):
        # Role availability and accessibility limits, not an exact palette snapshot.
        for name in ('--font-body', '--font-display', '--type-section', '--type-body',
                     '--type-card', '--type-dialog', '--type-action', '--leading-body',
                     '--section-space', '--page-gutter', '--radius-card', '--radius-pill'):
            self.assertIn(name, self.tokens)
        self.assertGreaterEqual(float(self.tokens['--button-height'].removesuffix('px')), 44)
        self.assertGreaterEqual(float(self.tokens['--leading-body']), 1.5)
        self.assertIn('(max-width: 767px)', self.system)
        mobile = declarations(self.system.split('@media', 1)[1])
        for name in ('--section-space', '--page-gutter', '--type-dialog'):
            self.assertLess(float(mobile[name].removesuffix('px')), float(self.tokens[name].removesuffix('px')))

    def test_approved_header_and_hero_artwork_are_preserved(self):
        css = (ROOT / 'assets/css/main.css').read_text()
        # Normalize only renamed class identifiers to the approved old baseline.
        # This preserves declaration/order checks rather than resnapshotting CSS.
        old_names = {'site-header': 'reference-header', 'site-nav': 'reference-nav',
                     'hero-wrap': 'reference-hero-wrap', 'hero': 'reference-hero'}
        def original_selector(selector):
            return re.sub(r'\.(site-header|site-nav|hero-wrap|hero)(?![\w-])',
                          lambda match: '.' + old_names[match.group(1)], selector.strip())
        rules = [[original_selector(selector), ' '.join(body.split())]
                 for selector, body in re.findall(r'([^{}]+)\{([^{}]*)\}', css)
                 if original_selector(selector) in PROTECTED_SELECTORS]
        canonical = json.dumps(rules, separators=(',', ':'))
        self.assertEqual(sha256(canonical.encode()).hexdigest(), PROTECTED_HASH,
                         'Approved header/hero artwork declarations changed; review explicitly before updating baseline.')

    def test_gallery_caption_does_not_need_important_overrides(self):
        self.assertNotIn('!important', (ROOT / 'assets/css/gallery.css').read_text())


if __name__ == '__main__':
    unittest.main(verbosity=2)
