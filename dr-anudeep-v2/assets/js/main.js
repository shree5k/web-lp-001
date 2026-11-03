(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  let lenis;
  let removeTicker;
  let motionContext;
  const header = document.querySelector('.site-header');
  let lastScroll = window.scrollY;
  let headerHidden = false;

  const updateHeader = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 50);
    const hide = y > window.innerHeight && y > lastScroll;
    if (Math.abs(y - lastScroll) > 1 && hide !== headerHidden) {
      headerHidden = hide;
      if (gsap && !reduced.matches) gsap.to(header, { y: hide ? -120 : 0, duration: .6, ease: 'power3.out', overwrite: true });
      else header.style.transform = hide ? 'translateY(-120px)' : '';
    }
    lastScroll = y;
  };
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  const expertiseRail = document.querySelector('.expertise-rail');
  const expertisePrevious = document.querySelector('.expertise-prev');
  const expertiseNext = document.querySelector('.expertise-next');
  const expertiseOriginals = expertiseRail ? [...expertiseRail.querySelectorAll('.expertise-card')] : [];
  const expertiseCopies = [];
  let expertiseCopySets = 0;
  function expertiseLoopSpan() {
    return expertiseCopies.length ? expertiseCopies[0].offsetLeft - expertiseOriginals[0].offsetLeft : 0;
  }
  function ensureExpertiseLoop() {
    if (!expertiseOriginals.length) return;
    const gap = parseFloat(getComputedStyle(expertiseRail).gap) || 0;
    const first = expertiseOriginals[0], last = expertiseOriginals[expertiseOriginals.length - 1];
    const span = last.offsetLeft - first.offsetLeft + last.getBoundingClientRect().width + gap;
    const sets = Math.ceil(expertiseRail.clientWidth / Math.max(1, span)) + 1;
    while (expertiseCopySets < sets) {
      expertiseOriginals.forEach(original => {
        const copy = original.cloneNode(true);
        copy.removeAttribute('id');
        copy.dataset.loopCopy = 'true';
        copy.dataset.originalId = original.id;
        copy.setAttribute('aria-hidden', 'true');
        copy.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
        copy.querySelectorAll('button, a, input, [tabindex]').forEach(node => node.setAttribute('tabindex', '-1'));
        copy.addEventListener('pointerdown', event => { if (event.pointerType === 'mouse') event.preventDefault(); });
        expertiseRail.appendChild(copy); expertiseCopies.push(copy);
      });
      expertiseCopySets++;
    }
  }
  function normalizeExpertiseLoop() {
    const span = expertiseLoopSpan();
    if (!span || autoFocused || autoPointerDown) return;
    if (expertiseRail.scrollLeft >= span) expertiseRail.scrollLeft %= span;
    autoPosition = expertiseRail.scrollLeft;
  }
  ensureExpertiseLoop();
  let expertiseDialogOpen = false;
  let autoFrame = null, autoLastTime = null, autoPosition = 0;
  let autoHovered = false, autoFocused = false, autoPointerDown = false;
  let autoVisible = expertiseRail ? expertiseRail.getBoundingClientRect().bottom > 0 && expertiseRail.getBoundingClientRect().top < window.innerHeight : false;
  function autoAllowed() {
    return expertiseRail && !reduced.matches && !document.hidden && autoVisible && !autoHovered && !autoFocused && !autoPointerDown && !expertiseDialogOpen;
  }
  function syncExpertiseAuto() {
    if (autoFrame !== null) window.cancelAnimationFrame(autoFrame);
    autoFrame = null; autoLastTime = null;
    if (!autoAllowed() || !window.requestAnimationFrame) return;
    autoPosition = expertiseRail.scrollLeft;
    autoFrame = window.requestAnimationFrame(tickExpertiseAuto);
  }
  function tickExpertiseAuto(time) {
    autoFrame = null;
    if (!autoAllowed()) { autoLastTime = null; return; }
    const delta = autoLastTime === null ? 0 : Math.min((time - autoLastTime) / 1000, .1);
    autoLastTime = time;
    const span = expertiseLoopSpan();
    if (span > 0) {
      autoPosition = (autoPosition + 20 * delta) % span;
      expertiseRail.scrollLeft = autoPosition;
    }
    autoFrame = window.requestAnimationFrame(tickExpertiseAuto);
  }
  function pauseExpertiseForInteraction() {
    autoPosition = expertiseRail.scrollLeft;
  }
  if (expertiseRail) {
    expertiseRail.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') { autoHovered = true; syncExpertiseAuto(); } });
    expertiseRail.addEventListener('pointerleave', () => { autoHovered = false; syncExpertiseAuto(); });
    expertiseRail.addEventListener('focusin', event => { autoFocused = event.target?.matches?.(':focus-visible') ?? true; syncExpertiseAuto(); });
    expertiseRail.addEventListener('focusout', event => { autoFocused = expertiseRail.contains(event.relatedTarget); syncExpertiseAuto(); });
    expertiseRail.addEventListener('pointerdown', () => { autoPointerDown = true; syncExpertiseAuto(); });
    window.addEventListener('pointerup', () => { if (autoPointerDown) { autoPointerDown = false; pauseExpertiseForInteraction(); syncExpertiseAuto(); } });
    window.addEventListener('pointercancel', () => { autoPointerDown = false; pauseExpertiseForInteraction(); syncExpertiseAuto(); });
    expertiseRail.addEventListener('wheel', pauseExpertiseForInteraction, { passive: true });
    expertiseRail.addEventListener('scroll', () => { autoPosition = expertiseRail.scrollLeft; }, { passive: true });
    expertiseRail.addEventListener('scrollend', normalizeExpertiseLoop);
    document.addEventListener('visibilitychange', syncExpertiseAuto);
    reduced.addEventListener('change', syncExpertiseAuto);
    if (window.IntersectionObserver) {
      const observer = new window.IntersectionObserver(entries => { autoVisible = entries.some(entry => entry.isIntersecting); syncExpertiseAuto(); });
      observer.observe(expertiseRail);
    }
    syncExpertiseAuto();
  }
  function updateExpertiseControls() {
    if (!expertisePrevious || !expertiseNext) return;
    if (expertiseLoopSpan() > 0) { expertisePrevious.disabled = false; expertiseNext.disabled = false; return; }
    expertisePrevious.disabled = expertiseRail.scrollLeft <= 2;
    expertiseNext.disabled = expertiseRail.scrollLeft >= expertiseRail.scrollWidth - expertiseRail.clientWidth - 2;
  }
  function advanceExpertise(direction) {
    pauseExpertiseForInteraction();
    const span = expertiseLoopSpan();
    if (span && direction < 0 && expertiseRail.scrollLeft < 1) expertiseRail.scrollLeft += span;
    const first = expertiseRail.querySelector('.expertise-card');
    const gap = parseFloat(getComputedStyle(expertiseRail).gap) || 0;
    expertiseRail.scrollBy({ left: direction * (first.getBoundingClientRect().width + gap), behavior: 'instant' });
    syncExpertiseAuto();
  }
  if (expertiseRail) {
    expertisePrevious?.addEventListener('click', () => advanceExpertise(-1));
    expertiseNext?.addEventListener('click', () => advanceExpertise(1));
    expertiseRail.addEventListener('scroll', updateExpertiseControls, { passive: true });
    expertiseRail.addEventListener('keydown', event => {
      if (event.target !== expertiseRail || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault(); advanceExpertise(event.key === 'ArrowLeft' ? -1 : 1);
    });
    window.addEventListener('resize', () => { ensureExpertiseLoop(); updateExpertiseControls(); });
    updateExpertiseControls();
  }

  function scrollToTarget(target) {
    if (lenis) lenis.scrollTo(target, { offset: -80, duration: 1.2 });
    else window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 80, behavior: reduced.matches ? 'instant' : 'smooth' });
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || link.hash.length < 2) return;
    let id;
    try { id = decodeURIComponent(link.hash.slice(1)); }
    catch { return; }
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    if (expertiseRail && target.classList.contains('expertise-card')) {
      expertiseRail.scrollTo({ left: target.offsetLeft - expertiseRail.querySelector('.expertise-card').offsetLeft, behavior: reduced.matches ? 'instant' : 'smooth' });
    }
    scrollToTarget(target);
    history.pushState(null, '', link.hash);
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });

  let dialogOpener;
  const dialogAnimations = new Map();
  function enterDialog(dialog) {
    if (reduced.matches || !dialog.classList.contains('treatment-dialog') || typeof dialog.animate !== 'function') return;
    try {
      const animation = dialog.animate([
        { opacity: 0, transform: 'translateY(18px) scale(.985)' },
        { opacity: 1, transform: 'translateY(0) scale(1)' }
      ], { duration: 320, easing: 'cubic-bezier(.22, 1, .36, 1)' });
      dialogAnimations.set(dialog, { animation, closing: false });
      animation.onfinish = () => { if (dialogAnimations.get(dialog)?.animation === animation) dialogAnimations.delete(dialog); };
    } catch { /* Native dialog remains usable when animation is unavailable. */ }
  }
  function closeDialog(dialog) {
    if (!dialog.open || dialogAnimations.get(dialog)?.closing) return;
    if (reduced.matches || !dialog.classList.contains('treatment-dialog') || typeof dialog.animate !== 'function') { dialog.close(); return; }
    const visual = getComputedStyle(dialog);
    const from = { opacity: visual.opacity || '1', transform: visual.transform || 'none' };
    dialogAnimations.get(dialog)?.animation.cancel();
    dialog.classList.toggle('is-closing', true);
    try {
      const animation = dialog.animate([from, { opacity: 0, transform: 'translateY(10px) scale(.985)' }],
        { duration: 200, easing: 'cubic-bezier(.4, 0, 1, 1)', fill: 'forwards' });
      dialogAnimations.set(dialog, { animation, closing: true });
      animation.onfinish = () => dialog.close();
    } catch { dialog.close(); }
  }
  reduced.addEventListener('change', () => {
    if (!reduced.matches) return;
    for (const [dialog, state] of [...dialogAnimations]) {
      if (state.closing) dialog.close();
      else { state.animation.cancel(); dialogAnimations.delete(dialog); }
    }
  });
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-dialog]');
    if (!button) return;
    if (button.tagName === 'A' && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
    const dialog = document.getElementById(button.dataset.dialog);
    const originalId = button.closest?.('[data-loop-copy]')?.dataset.originalId;
    dialogOpener = originalId ? document.getElementById(originalId).querySelector('[data-dialog]') : button;
    dialog.showModal();
    enterDialog(dialog);
    expertiseDialogOpen = true; syncExpertiseAuto();
    lenis?.stop();
  });
  document.querySelectorAll('.treatment-dialog, .gallery-dialog, .reels-dialog').forEach(dialog => {
    dialog.querySelector('.dialog-close').addEventListener('click', () => closeDialog(dialog));
    dialog.addEventListener('click', event => {
      const box = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) closeDialog(dialog);
    });
    dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(dialog); });
    dialog.addEventListener('close', () => {
      dialogAnimations.get(dialog)?.animation.cancel();
      dialogAnimations.delete(dialog);
      dialog.classList.toggle('is-closing', false);
      expertiseDialogOpen = false; dialogOpener?.focus(); syncExpertiseAuto(); lenis?.start();
    });
    dialog.setAttribute('data-lenis-prevent', '');
  });
  document.querySelectorAll('.result-comparison input').forEach(input => input.addEventListener('input', () => {
    input.parentElement.style.setProperty('--comparison', `${input.value}%`);
  }));

  // Section entrances and scroll effects share the local GSAP runtime.
  function initializeMotion() {
    if (reduced.matches || !gsap || !ScrollTrigger) return;
    try {
      // GSAP requires a callback to create a new context.
      motionContext = gsap.context(() => {});
      motionContext.add(() => {
        const trigger = node => ({ trigger: node, start: 'top 85%', toggleActions: 'play none none reverse' });
        const reveal = (node, from, duration = 1, extra = {}) => {
          if (!node) return;
          return gsap.fromTo(node, { opacity: 0, ...from }, {
            opacity: 1, x: 0, y: 0, rotation: 0, scale: 1, duration,
            ease: 'power3.out', scrollTrigger: trigger(node), ...extra
          });
        };
        gsap.fromTo(header, { y: -100 }, { y: 0, duration: .6, ease: 'power3.out' });
        gsap.fromTo('.site-nav a', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: .5, stagger: .1 });
        gsap.fromTo('.mobile-dock', { y: 100 }, { y: 0, duration: .6, ease: 'power3.out' });
        gsap.fromTo('.hero-slide', { opacity: 0 }, { opacity: 1, duration: 1.5, ease: 'power1.out' });
        gsap.fromTo('.hero-content h1', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1, delay: .2, ease: 'power3.out' });
        gsap.fromTo('.hero-kicker, .hero-copy > p:not(.hero-kicker)', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: .9, delay: .3, stagger: .15, ease: 'power3.out' });
        gsap.fromTo('.hero-content .button-entrance', { opacity: 0, y: 30, scale: .9 }, { opacity: 1, y: 0, scale: 1, duration: .8, delay: .6, ease: 'back.out(1.7)' });
        gsap.fromTo('.hero-scroll', { opacity: 0 }, { opacity: 1, delay: 1.5, duration: 1 });
        const hero = document.getElementById('home');
        // Keep mobile artwork anchored; rebuild desktop effects on breakpoint changes.
        const heroMotion = gsap.matchMedia();
        heroMotion.add('(min-width: 768px)', () => {
          gsap.fromTo('.hero-slide', { scale: 1.1 }, { scale: 1, duration: 1.5, ease: 'power1.out' });
          gsap.to('.hero-image-motion', { y: 400, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: '+=800', scrub: true } });
          gsap.to('.hero-image-motion', { opacity: 0, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: '60% top', scrub: true } });
        });
        gsap.to('.hero-content', { y: -100, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: '+=800', scrub: true } });
        gsap.to('.hero-shade', { opacity: .8, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: '+=400', scrub: true } });

        ['about', 'location'].forEach(id => {
          const section = document.getElementById(id);
          if (!section) return;
          const copy = section.querySelector('.motion-copy');
          const image = section.querySelector('.motion-image-reveal');
          const parallax = section.querySelector('.motion-image-parallax');
          const leftImage = id === 'location';
          reveal(copy, { x: leftImage ? 60 : -60 });
          reveal(image, { x: leftImage ? -60 : 60, scale: 1.04 }, 1);
          if (parallax) gsap.to(parallax, { yPercent: id === 'about' ? -8 : -16, ease: 'none', scrollTrigger: { trigger: image, start: 'top bottom', end: 'bottom top', scrub: id === 'about' ? 2 : 1.2 } });
          if (id === 'about') {
            gsap.fromTo(copy.querySelectorAll('p, h2, .button-entrance'), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .8, stagger: .15, ease: 'power3.out', scrollTrigger: trigger(copy) });
          }
        });
        reveal(document.querySelector('#packages .text-center'), { y: 50 });
        gsap.fromTo('.expertise-card', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .6, stagger: .04, ease: 'power3.out', scrollTrigger: trigger(document.querySelector('.expertise-rail')) });
        reveal(document.querySelector('#ethos .philosophy-copy'), { y: 20 }, .8);
        reveal(document.querySelector('.result-gallery-heading'), { y: 20 }, .6);
        gsap.fromTo('.result-gallery-card', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .6, stagger: .1, ease: 'power3.out', scrollTrigger: trigger(document.querySelector('.result-gallery-grid')) });
        const reelsHeading = document.querySelector('.clinic-reels__heading');
        const reelsRail = document.querySelector('.clinic-reels__rail');
        if (reelsHeading) reveal(reelsHeading, { y: 20 }, .8);
        if (reelsRail) gsap.fromTo('.clinic-reel__poster', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .8, stagger: .12, ease: 'power3.out', scrollTrigger: trigger(reelsRail) });
        gsap.fromTo('.footer-grid > div', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .6, stagger: .1, ease: 'power3.out', scrollTrigger: { trigger: '.footer-grid', start: 'top 90%', once: true } });
        return () => heroMotion.revert();
      });
      if (window.Lenis) {
        lenis = new Lenis({ duration: 1, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), orientation: 'vertical', gestureOrientation: 'vertical', smoothWheel: true, wheelMultiplier: .7, touchMultiplier: 1.5, infinite: false, lerp: .1 });
        lenis.on('scroll', ScrollTrigger.update);
        const tick = time => lenis?.raf(time * 1000);
        gsap.ticker.add(tick);
        removeTicker = () => gsap.ticker.remove(tick);
      }
      ScrollTrigger.refresh();
    } catch (error) {
      // Revert every initialized reveal if an animation dependency fails.
      motionContext?.revert();
      lenis?.destroy(); lenis = null;
      removeTicker?.();
      console.error('Animation setup failed; static content remains available.', error);
    }
  }
  function resetMotion() {
    motionContext?.revert(); motionContext = null;
    removeTicker?.(); removeTicker = null;
    lenis?.destroy(); lenis = null;
    header.style.transform = '';
    headerHidden = false; lastScroll = window.scrollY;
    initializeMotion();
  }
  reduced.addEventListener('change', resetMotion);
  initializeMotion();
  if (document.fonts) document.fonts.ready.then(() => ScrollTrigger?.refresh());
  window.addEventListener('load', () => ScrollTrigger?.refresh(), { once: true });
  let resizeTimer;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => ScrollTrigger?.refresh(), 500); }, { passive: true });
})();
