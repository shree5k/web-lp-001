/* Published contact destinations from https://dranudeep.in/, checked 31 October 2026. */
(() => {
  'use strict';
  async function copyPhoneNumber(document, number) {
    try {
      const clipboard = document.defaultView?.navigator?.clipboard;
      if (clipboard?.writeText) { await clipboard.writeText(number); return; }
    } catch { /* Try the local selection fallback when clipboard permission is unavailable. */ }
    const field = document.createElement('textarea');
    field.value = number;
    field.setAttribute('readonly', '');
    field.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
    (document.querySelector('.contact-float') || document.body).appendChild(field);
    try {
      field.select();
      if (!document.execCommand?.('copy')) throw new Error('Clipboard unavailable');
    } finally { field.remove(); }
  }
  function initializeContactMenu(document) {
    if (document.querySelector('.contact-float')) return;
    const icons = {
      contact: '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 3.9a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z"/><path d="M8 11h8m-8 4h5"/>',
      call: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
      whatsapp: '<path fill="currentColor" stroke="none" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>',
      instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>'
    };
    const svg = name => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
    const channels = [
      { name: 'Call', icon: 'call', copy: '+918070607068', label: 'Copy clinic phone number +91 80706 07068' },
      { name: 'WhatsApp', icon: 'whatsapp', href: 'https://wa.me/918070607068', label: 'Contact the clinic on WhatsApp', external: true },
      { name: 'Instagram', icon: 'instagram', href: 'https://www.instagram.com/icosmeticsurgeon/', label: 'View Instagram @icosmeticsurgeon', external: true }
    ];
    const root = document.createElement('aside');
    root.className = 'contact-float';
    root.setAttribute('aria-label', 'Contact the clinic');
    root.innerHTML = `<div class="contact-float__options" id="contact-options" hidden>${channels.map(channel => channel.copy
      ? `<button class="contact-float__option" type="button" data-copy-phone="${channel.copy}" aria-label="${channel.label}" title="Copy phone number"><span class="contact-float__call-copy"><span class="contact-float__call-label" aria-live="polite">Call</span><span class="contact-float__phone">+91 80706 07068</span></span>${svg(channel.icon)}</button>`
      : `<a class="contact-float__option" href="${channel.href}" aria-label="${channel.label}"${channel.external ? ' target="_blank" rel="noopener noreferrer"' : ''}><span>${channel.name}</span>${svg(channel.icon)}</a>`).join('')}</div><button class="contact-float__toggle" type="button" aria-expanded="false" aria-controls="contact-options" aria-label="Open contact options">${svg('contact')}<span>Contact</span></button>`;
    document.body.appendChild(root);
    const toggle = root.querySelector('.contact-float__toggle');
    const options = root.querySelector('.contact-float__options');
    // Expand immediately on scroll and return to the icon at the top.
    const view = document.defaultView;
    const updateScrollState = () => {
      const expanded = (view?.scrollY || 0) > 0;
      root.classList.toggle('is-expanded', expanded);
    };
    view?.addEventListener('scroll', updateScrollState, { passive: true });
    view?.addEventListener('resize', updateScrollState, { passive: true });
    view?.addEventListener('pageshow', updateScrollState);
    updateScrollState();
    let open = false;
    let pinned = false;
    const update = next => {
      open = next;
      options.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close contact options' : 'Open contact options');
      root.classList.toggle('is-open', open);
    };
    root.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse') update(true);
    });
    root.addEventListener('pointerleave', () => {
      if (!pinned && !options.contains(document.activeElement)) update(false);
    });
    toggle.addEventListener('click', () => {
      pinned = !open;
      update(pinned);
    });
    root.addEventListener('focusout', event => {
      if (!root.contains(event.relatedTarget)) { pinned = false; update(false); }
    });
    let copyTimer, copyAttempt = 0;
    options.addEventListener('click', async event => {
      const button = event.target.closest('[data-copy-phone]');
      if (button) {
        const attempt = ++copyAttempt;
        const label = button.querySelector('.contact-float__call-label');
        view.clearTimeout(copyTimer);
        pinned = true; update(true);
        label.textContent = 'Copying…';
        try {
          await copyPhoneNumber(document, button.getAttribute('data-copy-phone'));
          if (attempt !== copyAttempt) return;
          label.textContent = 'Copied';
        } catch {
          if (attempt !== copyAttempt) return;
          label.textContent = 'Couldn’t copy';
        }
        // Restore keyboard focus if the selection fallback temporarily moved it.
        if (open && !root.contains(document.activeElement)) button.focus();
        copyTimer = view.setTimeout(() => { label.textContent = 'Call'; }, 1800);
        return;
      }
      if (event.target.closest('a')) { pinned = false; update(false); toggle.focus(); }
    });
    document.addEventListener('pointerdown', event => {
      if (open && !root.contains(event.target)) { pinned = false; update(false); }
    });
    document.addEventListener('keydown', event => {
      if (event.target === toggle && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
        event.preventDefault(); pinned = true; update(true);
        options.querySelector(event.key === 'ArrowUp' ? 'a:last-child' : 'button, a').focus();
      } else if (open && event.key === 'Escape') {
        const restoreFocus = root.contains(document.activeElement);
        pinned = false; update(false);
        if (restoreFocus) { event.preventDefault(); toggle.focus(); }
      }
    });
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { initializeContactMenu, copyPhoneNumber };
  else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initializeContactMenu(document), { once: true });
  else initializeContactMenu(document);
})();
