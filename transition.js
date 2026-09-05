/* Shared email-copy button and accessible toast. */
(function () {
  const buttons = document.querySelectorAll('[data-copy-email]');
  if (!buttons.length) return;

  const email = 'danilophinic@gmail.com';
  const toast = document.createElement('div');
  toast.className = 'email-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.setAttribute('aria-atomic', 'true');
  document.body.appendChild(toast);
  let hideTimer;

  function fallbackCopy() {
    const previousFocus = document.activeElement;
    const field = document.createElement('textarea');
    field.value = email;
    field.setAttribute('readonly', '');
    field.style.cssText = 'position:fixed;left:-9999px;top:0;font-size:16px';
    document.body.appendChild(field);
    field.select();
    try {
      if (!document.execCommand('copy')) throw new Error('Copy unavailable');
    } finally {
      field.remove();
      if (previousFocus) previousFocus.focus({ preventScroll: true });
    }
  }

  buttons.forEach(button => button.addEventListener('click', async () => {
    let message = 'Email copied';
    try {
      try {
        if (!navigator.clipboard || !window.isSecureContext) throw new Error('Use fallback');
        await navigator.clipboard.writeText(email);
      } catch (_) {
        fallbackCopy();
      }
    } catch (_) {
      message = 'Copy unavailable — ' + email;
    }
    clearTimeout(hideTimer);
    toast.textContent = message;
    toast.classList.add('is-visible');
    hideTimer = setTimeout(() => {
      toast.classList.remove('is-visible');
      toast.textContent = '';
    }, message === 'Email copied' ? 2500 : 6000);
  }));
})();

/* ── Smooth scroll (Lenis) ──────────────────────────────────────── */
(function () {
  if (document.body.classList.contains('playground-page')) return;

  const s = document.createElement('script');
  s.src = 'https://unpkg.com/lenis@1.1.14/dist/lenis.min.js';
  s.onload = function () {
    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      syncTouch: false,
    });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    window.__lenis = lenis;
  };
  document.head.appendChild(s);
})();

/* ── Mobile menu toggle ──────────────────────────────────────────── */
(function () {
  const toggle = document.getElementById('menuToggle');
  const menu   = document.getElementById('mobileMenu');
  if (!toggle || !menu) return;

  function openMenu() {
    menu.classList.add('is-open');
    toggle.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden'; // prevent scroll behind menu
  }

  function closeMenu() {
    menu.classList.remove('is-open');
    toggle.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', () => {
    menu.classList.contains('is-open') ? closeMenu() : openMenu();
  });

  // Close when a menu link is clicked
  menu.querySelectorAll('.mobile-menu-link').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) closeMenu();
  });
})();

/* ── Page transitions ────────────────────────────────────────────── */
(function () {
  const overlay = document.getElementById('page-transition');
  const box     = overlay && overlay.querySelector('.transition-box');
  if (!overlay || !box) return;

  /* ── Animate the box (same keyframe + easing as the header dot) ── */
  function animateBox() {
    box.style.animation = 'none';
    void box.offsetWidth;                        // force reflow to restart
    box.style.animation = 'box-jump 0.64s cubic-bezier(0.25, 1, 0.5, 1) both';
  }

  /* ── Page reveal on load ────────────────────────────────────────
     Overlay covers the screen instantly, box plays its animation,
     then the overlay slides up — delayed so the box is seen in full.
  ─────────────────────────────────────────────────────────────── */
  overlay.style.transition = 'none';
  overlay.style.transform  = 'translateY(0)';
  overlay.style.pointerEvents = 'all';

  animateBox();                                  // box plays immediately

  // Wait until box animation is nearly done, THEN start sliding away
  setTimeout(() => {
    overlay.style.transition = 'transform 0.56s cubic-bezier(0.16, 1, 0.3, 1)';
    overlay.style.transform  = 'translateY(-105%)';
  }, 560);

  setTimeout(() => {
    overlay.style.pointerEvents = 'none';
  }, 1200);

})();
