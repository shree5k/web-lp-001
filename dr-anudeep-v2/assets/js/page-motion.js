/* Inner-page motion shares the landing page's local GSAP runtime. */
(() => {
  function initializePageMotion(view, document) {
    const gsap = view.gsap, trigger = view.ScrollTrigger;
    if (!gsap || !trigger) return;
    const reduced = view.matchMedia('(prefers-reduced-motion: reduce)');
    let context, desktop;
    const cleanup = () => {
      desktop?.revert(); desktop = null;
      context?.revert(); context = null;
    };
    function initialize() {
      cleanup();
      if (reduced.matches) return;
      try {
        gsap.registerPlugin(trigger);
        context = gsap.context(() => {});
        context.add(() => {
          const entrance = node => ({ trigger: node, start: 'top 88%', once: true });
          gsap.fromTo('.page-hero__copy .refined-eyebrow, .page-hero h1, .page-intro, .page-text-link',
            { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 1, delay: .15, stagger: .12, ease: 'power3.out' });
          gsap.fromTo('.page-hero__image', { opacity: 0, y: 24 },
            { opacity: 1, y: 0, duration: 1.2, delay: .25, ease: 'power3.out' });
          gsap.fromTo('.page-opening__footer', { opacity: 0, y: 12 },
            { opacity: 1, y: 0, duration: .8, delay: .5, ease: 'power3.out' });
          const sidebar = document.querySelector('.services-sidebar');
          if (sidebar) gsap.fromTo(sidebar, { opacity: 0 }, { opacity: 1, duration: .8, scrollTrigger: entrance(sidebar) });
          document.querySelectorAll('.services-entry').forEach(section => {
            const content = section.querySelector('.services-entry__content');
            const image = section.querySelector('.services-entry__image');
            if (content) gsap.fromTo(content, { opacity: 0, y: 24 },
              { opacity: 1, y: 0, duration: .85, ease: 'power3.out', scrollTrigger: entrance(section) });
            if (image) gsap.fromTo(image, { opacity: 0, y: 18 },
              { opacity: 1, y: 0, duration: 1, ease: 'power3.out', scrollTrigger: entrance(section) });
          });
          const consultation = document.querySelector('.page-consultation');
          if (consultation) gsap.fromTo(consultation, { opacity: 0, y: 24 },
            { opacity: 1, y: 0, duration: .9, ease: 'power3.out', scrollTrigger: entrance(consultation) });
          desktop = gsap.matchMedia();
          desktop.add('(min-width: 768px)', () => {
            gsap.fromTo('.page-hero__portrait img', { scale: 1.06, yPercent: 0 },
              { scale: 1.06, yPercent: -3, ease: 'none', scrollTrigger: { trigger: '.page-opening', start: 'top top', end: 'bottom top', scrub: 1.5 } });
            document.querySelectorAll('.services-entry__image img').forEach(image => {
              gsap.fromTo(image, { scale: 1.1, yPercent: 0 },
                { scale: 1.1, yPercent: -4, ease: 'none', scrollTrigger: { trigger: image.parentElement, start: 'top bottom', end: 'bottom top', scrub: 1.5 } });
            });
          });
        });
        trigger.refresh();
      } catch { cleanup(); }
    }
    reduced.addEventListener('change', initialize);
    const pagehide = event => { if (!event.persisted) cleanup(); };
    const pageshow = event => { if (event.persisted) trigger.refresh(); };
    view.addEventListener('pagehide', pagehide);
    view.addEventListener('pageshow', pageshow);
    initialize();
    return () => {
      cleanup();
      reduced.removeEventListener('change', initialize);
      view.removeEventListener('pagehide', pagehide);
      view.removeEventListener('pageshow', pageshow);
    };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { initializePageMotion };
  else initializePageMotion(window, document);
})();
