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
