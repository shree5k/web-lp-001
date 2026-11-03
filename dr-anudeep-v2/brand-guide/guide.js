(function () {
  'use strict';

  function fitPreview(availableWidth, viewportWidth, viewportHeight) {
    if (![availableWidth, viewportWidth, viewportHeight].every(Number.isFinite)
      || availableWidth <= 0 || viewportWidth <= 0 || viewportHeight <= 0) return null;
    const scale = Math.min(1, availableWidth / viewportWidth);
    return { scale, height: viewportHeight * scale };
  }

  function initializePreviews(document, view) {
    const targets = [...document.querySelectorAll('.live-viewport')];
    function resize(target) {
      const frame = target.querySelector('iframe');
      if (!frame) return;
      const width = Number(target.dataset.previewWidth);
      const height = Number(target.dataset.previewHeight);
      const fitted = fitPreview(target.clientWidth, width, height);
      if (!fitted) return;
      // Scale the whole viewport; the page's media queries keep their real width.
      frame.style.width = `${width}px`;
      frame.style.height = `${height}px`;
      frame.style.transform = `scale(${fitted.scale})`;
      target.style.height = `${fitted.height}px`;
    }
    targets.forEach(resize);
    if (typeof view.ResizeObserver === 'function') {
      const observer = new view.ResizeObserver(entries => entries.forEach(entry => resize(entry.target)));
      targets.forEach(target => observer.observe(target));
      return () => observer.disconnect();
    }
    const onResize = () => targets.forEach(resize);
    view.addEventListener('resize', onResize);
    return () => view.removeEventListener('resize', onResize);
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { fitPreview, initializePreviews };
  } else if (typeof document !== 'undefined') {
    initializePreviews(document, window);
  }
}());
