/* Populate the shared native dialog; main.js owns modal focus and scroll locking. */
(() => {
  function initializeClinicReels(document) {
    const dialog = document.getElementById('clinic-reels-player');
    if (!dialog) return;
    const holder = dialog.querySelector('.reels-dialog__embed');
    const title = dialog.querySelector('#clinic-reel-title');
    const original = dialog.querySelector('.reels-dialog__original');
    document.querySelectorAll('[data-reel-id]').forEach(link => {
      link.addEventListener('click', event => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button > 0) return;
        if (!dialog.hasAttribute('data-lenis-prevent') || typeof dialog.showModal !== 'function') return;
        const id = link.dataset.reelId;
        if (!/^[A-Za-z0-9_-]{6,32}$/.test(id)) return;
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.instagram.com/reel/${id}/embed/`;
        iframe.title = link.dataset.reelTitle || 'Instagram reel from the clinic';
        iframe.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        holder.replaceChildren(iframe);
        title.textContent = link.dataset.reelTitle || 'Clinic reel';
        original.href = link.href;
        event.preventDefault();
      });
    });
    dialog.addEventListener('close', () => holder.replaceChildren());
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { initializeClinicReels };
  else initializeClinicReels(document);
})();
