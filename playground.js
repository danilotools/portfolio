(function () {
  const field  = document.getElementById('playgroundField');
  const blocks = Array.from(document.querySelectorAll('.pg-block'));

  /* ── 1. Audio (Web Audio API) ── */
  let audioCtx = null;
  function getCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  }
  function playTone(freq1, freq2, dur, vol) {
    try {
      const ctx  = getCtx();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq1, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq2, ctx.currentTime + dur);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + dur + 0.01);
    } catch (_) {}
  }
  function playPickup() { playTone(180, 90,  0.12, 0.22); }
  function playDrop()   { playTone(320, 200, 0.08, 0.16); }

  /* ── Randomise position & rotation + entrance animation ── */
  const headerH = (document.querySelector('.header') || {}).offsetHeight || 80;

  blocks.forEach((block, i) => {
    const bw  = block.offsetWidth;
    const bh  = block.offsetHeight;
    const vw  = window.innerWidth;
    const vh  = window.innerHeight;

    const margin = 24;
    const x   = margin + Math.random() * Math.max(0, vw - bw - margin * 2);
    const y   = headerH + margin + Math.random() * Math.max(0, vh - headerH - bh - margin * 2);
    const rot = (Math.random() - 0.5) * 24;

    block.style.left = x + 'px';
    block.style.top  = y + 'px';
    block._rot       = rot;

    block.style.opacity   = '0';
    block.style.transform = `scale(0.72) rotate(${rot}deg)`;

    const delay = 60 + i * 90;
    setTimeout(() => {
      block.style.transition = `opacity 0.65s ${delay}ms cubic-bezier(0.16, 1, 0.3, 1),
                                transform 0.65s ${delay}ms cubic-bezier(0.16, 1, 0.3, 1)`;
      block.style.opacity   = '1';
      block.style.transform = `rotate(${rot}deg)`;

      setTimeout(() => {
        block.style.transition = '';
      }, 650 + delay + 50);
    }, 16);
  });

  /* ── Drag state ── */
  let active    = null;
  let startMx   = 0, startMy   = 0;
  let startLeft = 0, startTop  = 0;
  let lastX     = 0, lastY     = 0;
  let velX      = 0, velY      = 0;
  let didDrag   = false;
  let topZ      = 10;

  const throwRAFs = new WeakMap();

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

    const raf = throwRAFs.get(e.currentTarget);
    if (raf) cancelAnimationFrame(raf);

    active  = e.currentTarget;
    didDrag = false;
    velX    = 0;
    velY    = 0;

    active.style.zIndex = 9999;
    active.classList.add('is-dragging');

    active.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
    active.style.transform  = `scale(1.8) rotate(0deg)`;

    playPickup();

    const { x, y } = getXY(e);
    startMx   = x;
    startMy   = y;
    lastX     = x;
    lastY     = y;
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
    if (!didDrag) return;

    const rawVX = x - lastX;
    const rawVY = y - lastY;
    velX = velX * 0.72 + rawVX * 0.28;
    velY = velY * 0.72 + rawVY * 0.28;

    lastX = x;
    lastY = y;

    active.style.transition = '';
    active.style.left       = (startLeft + dx) + 'px';
    active.style.top        = (startTop  + dy) + 'px';
    active.style.transform  = `scale(1.8) rotate(0deg)`;
  }

  function onUp() {
    if (!active) return;

    active.classList.remove('is-dragging');

    const released = active;
    const finalVX  = velX;
    const finalVY  = velY;
    const hadDrag  = didDrag;

    released.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
    released.style.transform  = `rotate(${released._rot}deg)`;
    released.style.zIndex     = ++topZ;

    setTimeout(() => { released.style.transition = ''; }, 550);

    playDrop();

    active  = null;
    didDrag = false;
    velX    = 0;
    velY    = 0;

    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup',   onUp);
    window.removeEventListener('touchmove', onMove);
    window.removeEventListener('touchend',  onUp);

    /* ── 8. Throw physics ── */
    if (hadDrag && (Math.abs(finalVX) > 2 || Math.abs(finalVY) > 2)) {
      throwBlock(released, finalVX * 1.6, finalVY * 1.6);
    }
  }

  /* ── 8. Throw physics ── */
  function throwBlock(block, vx, vy) {
    const FRICTION = 0.88;
    const MIN_V    = 0.4;

    function step() {
      vx *= FRICTION;
      vy *= FRICTION;

      let nx = parseFloat(block.style.left) + vx;
      let ny = parseFloat(block.style.top)  + vy;

      const margin = 8;
      const maxX   = window.innerWidth  - block.offsetWidth  - margin;
      const maxY   = window.innerHeight - block.offsetHeight - margin;
      if (nx < margin) { nx = margin; vx *= -0.3; }
      if (ny < headerH + margin) { ny = headerH + margin; vy *= -0.3; }
      if (nx > maxX) { nx = maxX; vx *= -0.3; }
      if (ny > maxY) { ny = maxY; vy *= -0.3; }

      block.style.left = nx + 'px';
      block.style.top  = ny + 'px';

      if (Math.abs(vx) > MIN_V || Math.abs(vy) > MIN_V) {
        throwRAFs.set(block, requestAnimationFrame(step));
      } else {
        throwRAFs.delete(block);
      }
    }
    throwRAFs.set(block, requestAnimationFrame(step));
  }

  /* ── 14. Scatter all button ── */
  const scatterBtn = document.getElementById('scatterBtn');
  if (scatterBtn) {
    scatterBtn.addEventListener('click', () => {
      blocks.forEach((block, i) => {
        const bw  = block.offsetWidth;
        const bh  = block.offsetHeight;
        const vw  = window.innerWidth;
        const vh  = window.innerHeight;
        const margin = 24;

        const x   = margin + Math.random() * Math.max(0, vw - bw - margin * 2);
        const y   = headerH + margin + Math.random() * Math.max(0, vh - headerH - bh - margin * 2);
        const rot = (Math.random() - 0.5) * 24;

        block._rot = rot;

        const delay = i * 40;
        setTimeout(() => {
          block.style.transition = `left 0.6s ${delay}ms cubic-bezier(0.25, 1, 0.5, 1),
                                    top  0.6s ${delay}ms cubic-bezier(0.25, 1, 0.5, 1),
                                    transform 0.6s ${delay}ms cubic-bezier(0.25, 1, 0.5, 1)`;
          block.style.left      = x + 'px';
          block.style.top       = y + 'px';
          block.style.transform = `rotate(${rot}deg)`;

          setTimeout(() => { block.style.transition = ''; }, 660 + delay);
        }, 0);
      });
    });
  }
})();
