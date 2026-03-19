(function () {
  const field  = document.getElementById('playgroundField');
  const blocks = Array.from(document.querySelectorAll('.pg-block'));

  /* ── Randomise position & rotation, then entrance animation ── */
  const headerH = (document.querySelector('.header') || {}).offsetHeight || 80;

  blocks.forEach((block, i) => {
    const bw  = block.offsetWidth;
    const bh  = block.offsetHeight;
    const vw  = window.innerWidth;
    const vh  = window.innerHeight;

    const margin = 24;
    const x   = margin + Math.random() * Math.max(0, vw - bw - margin * 2);
    const y   = headerH + margin + Math.random() * Math.max(0, vh - headerH - bh - margin * 2);
    const rot = (Math.random() - 0.5) * 24; // –12° … +12°

    block.style.left = x + 'px';
    block.style.top  = y + 'px';
    block._rot       = rot;

    /* Start hidden + scaled down + already rotated */
    block.style.opacity   = '0';
    block.style.transform = `scale(0.72) rotate(${rot}deg)`;

    /* Staggered reveal — each block 90 ms apart */
    const delay = 60 + i * 90;
    setTimeout(() => {
      block.style.transition = `opacity 0.65s ${delay}ms cubic-bezier(0.16, 1, 0.3, 1),
                                transform 0.65s ${delay}ms cubic-bezier(0.16, 1, 0.3, 1)`;
      block.style.opacity   = '1';
      block.style.transform = `rotate(${rot}deg)`;

      /* Clear transition once entrance is done so dragging stays instant */
      setTimeout(() => {
        block.style.transition = '';
      }, 650 + delay + 50);
    }, 16); // one frame before triggering so initial paint is flushed
  });

  /* ── Drag state ── */
  let active    = null;
  let startMx   = 0, startMy   = 0;
  let startLeft = 0, startTop  = 0;
  let lastX     = 0;
  let velX      = 0;
  let didDrag   = false;
  let topZ      = 10;

  blocks.forEach((block) => {
    block.addEventListener('mousedown', onDown);
    block.addEventListener('touchstart', onDown, { passive: false });
  });

  function getXY(e) {
    return e.touches
      ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
      : { x: e.clientX,            y: e.clientY };
  }

  function onDown(e) {
    if (e.button && e.button !== 0) return;
    e.preventDefault();

    active  = e.currentTarget;
    didDrag = false;
    velX    = 0;

    /* Snap off any lingering transition, push to absolute top */
    active.style.transition = '';
    active.style.zIndex     = 9999;
    active.classList.add('is-dragging');

    const { x, y } = getXY(e);
    startMx   = x;
    startMy   = y;
    lastX     = x;
    startLeft = parseFloat(active.style.left) || 0;
    startTop  = parseFloat(active.style.top)  || 0;

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend',  onUp);
  }

  function onMove(e) {
    if (!active) return;
    e.preventDefault();

    const { x, y } = getXY(e);
    const dx = x - startMx;
    const dy = y - startMy;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) didDrag = true;

    /* Smooth velocity with an exponential moving average so tilt
       doesn't jitter from noisy per-event deltas                  */
    const rawVel = x - lastX;
    velX  = velX * 0.72 + rawVel * 0.28;   // lerp toward real delta
    lastX = x;
    const maxTilt = 12;
    const tilt    = Math.max(-maxTilt, Math.min(maxTilt, velX * 0.9));

    active.style.left      = (startLeft + dx) + 'px';
    active.style.top       = (startTop  + dy) + 'px';
    active.style.transform = `rotate(${active._rot + tilt}deg)`;
  }

  function onUp() {
    if (!active) return;

    active.classList.remove('is-dragging');

    /* Spring back to base rotation */
    active.style.transition = 'transform 0.55s cubic-bezier(0.25, 1, 0.5, 1)';
    active.style.transform  = `rotate(${active._rot}deg)`;

    /* Keep block in front of everything that came before it */
    active.style.zIndex = ++topZ;

    /* Clear transition after spring finishes */
    const released = active;
    setTimeout(() => { released.style.transition = ''; }, 600);

    /* Suppress link click if user actually dragged */
    if (didDrag) {
      const suppress = (ev) => {
        ev.preventDefault();
        ev.stopImmediatePropagation();
      };
      active.addEventListener('click', suppress, { once: true, capture: true });
    }

    active  = null;
    didDrag = false;
    velX    = 0;

    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup',   onUp);
    window.removeEventListener('touchmove', onMove);
    window.removeEventListener('touchend',  onUp);
  }
})();
