/* Shared responsive header navigation; ordinary links remain usable without JS. */
(() => {
  'use strict';
  function initializeNavigation(view, document) {
    const page = document.body;
    const toggle = document.querySelector('.blog-menu-toggle');
    const menu = document.getElementById('blog-menu');
    const header = toggle?.closest('.site-header');
    if (!page || !toggle || !menu || !header) return;
    const mobile = view.matchMedia('(max-width: 1023px)');
    const reduced = view.matchMedia('(prefers-reduced-motion: reduce)');
    const label = toggle.querySelector('.nav-toggle__label');
    let expanded = false, animation;
    function setExpanded(open, { restoreFocus = false, immediate = false } = {}) {
      expanded = mobile.matches && open;
      animation?.cancel();
      animation = null;
      toggle.hidden = !mobile.matches;
      toggle.setAttribute('aria-expanded', String(expanded));
      toggle.setAttribute('aria-label', expanded ? 'Close navigation' : 'Open navigation');
      if (label) label.textContent = expanded ? 'Close' : 'Menu';
      header.classList.toggle('nav-open', expanded);
      menu.inert = mobile.matches && !expanded;
      if (restoreFocus) toggle.focus();
      if (!mobile.matches || immediate || reduced.matches || !menu.animate) {
        menu.hidden = mobile.matches && !expanded;
        return;
      }
      if (menu.hidden && !expanded) return;
      menu.hidden = false;
      const current = expanded;
      animation = menu.animate(current
        ? [{ opacity: 0, transform: 'translateY(-10px)', clipPath: 'inset(0 0 100% 0)' }, { opacity: 1, transform: 'translateY(0)', clipPath: 'inset(0)' }]
        : [{ opacity: 1, transform: 'translateY(0)', clipPath: 'inset(0)' }, { opacity: 0, transform: 'translateY(-6px)', clipPath: 'inset(0 0 100% 0)' }],
      { duration: current ? 300 : 200, easing: 'cubic-bezier(.22,1,.36,1)' });
      const pending = animation;
      animation.finished.then(() => {
        if (animation !== pending) return;
        menu.hidden = mobile.matches && !expanded;
        animation = null;
      }).catch(() => {});
    }
    toggle.addEventListener('click', () => setExpanded(!expanded));
    toggle.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown' && mobile.matches) {
        event.preventDefault(); setExpanded(true); menu.querySelector('a')?.focus();
      }
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && expanded) { event.preventDefault(); setExpanded(false, {restoreFocus:true}); }
    });
    document.addEventListener('click', event => {
      if (expanded && !header.contains(event.target)) setExpanded(false);
    });
    header.addEventListener('focusout', event => {
      if (expanded && event.relatedTarget && !header.contains(event.relatedTarget)) setExpanded(false);
    });
    menu.addEventListener('click', event => {
      if (mobile.matches && event.target.closest('a')) setExpanded(false, {restoreFocus:true});
    });
    mobile.addEventListener('change', () => {
      const focusedMenu = menu.contains(document.activeElement);
      const focusedToggle = document.activeElement === toggle;
      setExpanded(false, {immediate:true});
      if (mobile.matches && focusedMenu) toggle.focus();
      if (!mobile.matches && focusedToggle) menu.querySelector('a')?.focus();
    });
    reduced.addEventListener('change', () => setExpanded(expanded, {immediate:true}));
    view.addEventListener('pageshow', () => setExpanded(false, {immediate:true}));
    menu.setAttribute('data-lenis-prevent', '');
    page.classList.add('nav-enhanced');
    setExpanded(false, {immediate:true});
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { initializeNavigation };
  else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initializeNavigation(window, document), {once:true});
  else initializeNavigation(window, document);
})();
