/* A transparent overlay thumb; page scrolling remains native. */
(() => {
  function metrics(viewport, content, scroll) {
    const range = Math.max(0, content - viewport);
    const height = Math.min(viewport, Math.max(32, viewport * viewport / Math.max(content, 1)));
    return { range, height, top: range ? Math.max(0, Math.min(1, scroll / range)) * (viewport - height) : 0 };
  }
  if (typeof module !== 'undefined' && module.exports) { module.exports = { metrics }; return; }
  const root = document.documentElement;
  const thumb = document.createElement('div');
  thumb.className = 'page-scroll-thumb';
  thumb.setAttribute('aria-hidden', 'true');
  document.body.appendChild(thumb);
  root.classList.add('has-overlay-scrollbar');
  let frame = 0, drag = null;
  const update = () => {
    frame = 0;
    const m = metrics(innerHeight, root.scrollHeight, scrollY);
    thumb.hidden = !m.range;
    thumb.style.height = `${m.height}px`;
    thumb.style.transform = `translateY(${m.top}px)`;
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  addEventListener('pageshow', schedule);
  if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(document.body);
  thumb.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    const m = metrics(innerHeight, root.scrollHeight, scrollY);
    if (!m.range || innerHeight <= m.height) return;
    drag = { y: event.clientY, scroll: scrollY, ratio: m.range / (innerHeight - m.height) };
    thumb.setPointerCapture(event.pointerId);
    root.classList.add('is-scrollbar-dragging');
    event.preventDefault();
  });
  thumb.addEventListener('pointermove', event => {
    if (drag) window.scrollTo({ top: drag.scroll + (event.clientY - drag.y) * drag.ratio, behavior: 'instant' });
  });
  const release = () => { drag = null; root.classList.remove('is-scrollbar-dragging'); };
  thumb.addEventListener('lostpointercapture', release);
  thumb.addEventListener('pointerup', release);
  thumb.addEventListener('pointercancel', release);
  update();
})();
