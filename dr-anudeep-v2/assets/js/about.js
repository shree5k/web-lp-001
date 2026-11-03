/* About body motion; the shared hero animation is handled by page-motion.js. */
(() => {
  function initializeAboutMotion(view, document) {
    const { gsap, ScrollTrigger } = view;
    if (!gsap || !ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const reveal = (target, trigger = target, stagger = 0) => gsap.from(target, {
        opacity: 0, y: 24, stagger, duration: .9, ease: 'power3.out',
        scrollTrigger: { trigger, start: 'top 88%', once: true }
      });
      document.querySelectorAll('.about-section__heading, .about-research__heading').forEach(node => reveal(node.children, node, .1));
      const journey = document.querySelector('.about-journey');
      if (journey) {
        gsap.fromTo(journey, { '--journey-progress': 0 }, {
          '--journey-progress': 1, duration: 1.8, ease: 'power2.inOut',
          scrollTrigger: {trigger: journey, start: 'top 80%', once: true}
        });
        document.querySelectorAll('.about-journey__stop').forEach(node => {
          // Individual triggers keep lower mobile stops readable as they enter view.
          reveal(node.children, node, .06);
        });
      }
      document.querySelectorAll('.about-experience article, .about-research__notes article').forEach(node => reveal(node));
      const portrait = document.querySelector('.about-experience-portrait');
      if (portrait) reveal(portrait);
    });
    media.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
      const image = document.querySelector('.about-experience-portrait img');
      if (image) gsap.fromTo(image, { yPercent: 0 }, {
        yPercent: -3, ease: 'none', scrollTrigger: {trigger: image.parentElement, start:'top bottom', end:'bottom top', scrub:1.5}
      });
    });
    view.addEventListener('pagehide', event => { if (!event.persisted) media.revert(); });
    view.addEventListener('pageshow', event => { if (event.persisted) ScrollTrigger.refresh(); });
    return media;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { initializeAboutMotion };
  else initializeAboutMotion(window, document);
})();
