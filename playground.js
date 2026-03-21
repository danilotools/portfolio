(function () {
  const blocks = Array.from(document.querySelectorAll('.pg-block'));

  /* ── 1. Audio ── */
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

  /* ── Initial layout ── */
  const headerH  = (document.querySelector('.header') || {}).offsetHeight || 80;
  const isMobile = window.innerWidth <= 768;
  const SCALE    = isMobile ? 0.69 : 1;

  blocks.forEach((block, i) => {
    if (isMobile) {
      const origW = parseInt(block.style.width,  10) || block.offsetWidth;
      const origH = parseInt(block.style.height, 10) || block.offsetHeight;
      block.style.width  = Math.round(origW * SCALE) + 'px';
      block.style.height = Math.round(origH * SCALE) + 'px';
    }

    const bw = block.offsetWidth;
    const bh = block.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 24;

    const x   = margin + Math.random() * Math.max(0, vw - bw - margin * 2);
    const y   = headerH + margin + Math.random() * Math.max(0, vh - headerH - bh - margin * 2);
    const rot = (Math.random() - 0.5) * 24;

    block.style.left  = x + 'px';
    block.style.top   = y + 'px';
    block._rot        = rot;
    block.style.opacity   = '0';
    block.style.transform = `scale(0.72) rotate(${rot}deg)`;

    const delay = isMobile ? i * 40 : 60 + i * 90;
    setTimeout(() => {
      block.style.transition = `opacity 0.55s ${delay}ms cubic-bezier(0.16, 1, 0.3, 1),
                                transform 0.55s ${delay}ms cubic-bezier(0.16, 1, 0.3, 1)`;
      block.style.opacity   = '1';
      block.style.transform = `rotate(${rot}deg)`;
      setTimeout(() => { block.style.transition = ''; }, 560 + delay + 50);
    }, 16);
  });

  /* ── Drag state ── */
  let active     = null;
  let startMx    = 0, startMy   = 0;
  let startLeft  = 0, startTop  = 0;
  let lastX      = 0, lastY     = 0;
  let velX       = 0, velY      = 0;
  let didDrag    = false;
  let topZ       = 10;
  let chaosActive = false;
  const DRAG_SCALE = isMobile ? 1.35 : 1.8;
  const throwRAFs  = new WeakMap();

  blocks.forEach(block => {
    block.addEventListener('mousedown', onDown);
    block.addEventListener('touchstart', onDown, { passive: false });
  });

  function getXY(e) {
    return e.touches
      ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
      : { x: e.clientX,            y: e.clientY };
  }

  function onDown(e) {
    if (chaosActive) return;
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
    active.style.transform  = `scale(${DRAG_SCALE}) rotate(0deg)`;
    playPickup();

    const { x, y } = getXY(e);
    startMx   = x;  startMy   = y;
    lastX     = x;  lastY     = y;
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

    velX = velX * 0.72 + (x - lastX) * 0.28;
    velY = velY * 0.72 + (y - lastY) * 0.28;
    lastX = x;  lastY = y;

    active.style.transition = '';
    active.style.left       = (startLeft + dx) + 'px';
    active.style.top        = (startTop  + dy) + 'px';
    active.style.transform  = `scale(${DRAG_SCALE}) rotate(0deg)`;
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
    active = null; didDrag = false; velX = 0; velY = 0;

    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup',   onUp);
    window.removeEventListener('touchmove', onMove);
    window.removeEventListener('touchend',  onUp);

    if (!isMobile && hadDrag && (Math.abs(finalVX) > 2 || Math.abs(finalVY) > 2)) {
      throwBlock(released, finalVX * 1.6, finalVY * 1.6);
    }
  }

  /* ── Throw physics (shared by drag + chaos ball hit) ── */
  function throwBlock(block, vx, vy) {
    const FRICTION    = 0.88;
    const MIN_V       = 0.4;
    const POCKET_SIZE = 72;

    function step() {
      vx *= FRICTION;
      vy *= FRICTION;

      let nx = parseFloat(block.style.left) + vx;
      let ny = parseFloat(block.style.top)  + vy;

      /* Pocket check — only in chaos mode */
      if (chaosActive && block.style.display !== 'none') {
        const bx = nx + block.offsetWidth  / 2;
        const by = ny + block.offsetHeight / 2;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        for (const [cx, cy] of [[0,0],[vw,0],[0,vh],[vw,vh]]) {
          const ddx = bx - cx;
          const ddy = by - cy;
          if (Math.sqrt(ddx*ddx + ddy*ddy) < POCKET_SIZE) {
            pocketBlock(block, cx, cy);
            return;
          }
        }
      }

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

  /* ── CHAOS MODE ── */
  const BALL_R       = 18;
  const chaosBorderEl = document.getElementById('chaosBorder');
  const chaosBtn      = document.getElementById('scatterBtn');
  let ball       = { x: 0, y: 0, vx: 0, vy: 0, el: null, moving: false, raf: null };
  let aimCanvas  = null, aimCtx = null;
  let chaosTip   = null;
  let aimActive  = false, aimStartX = 0, aimStartY = 0;
  let aliveBlocks = new Set();

  if (chaosBtn) {
    chaosBtn.addEventListener('click', () => {
      chaosActive = !chaosActive;
      chaosBtn.textContent = chaosActive ? 'Stop Chaos' : 'Start Chaos';
      chaosActive ? startChaos() : stopChaos();
    });
  }

  function startChaos() {
    /* Border glow */
    if (chaosBorderEl) chaosBorderEl.classList.add('active');
    /* Pockets */
    document.querySelectorAll('.pocket').forEach(p => p.classList.add('active'));
    /* Init alive set */
    aliveBlocks = new Set(blocks.filter(b => b.style.display !== 'none'));
    /* Rack all images to center */
    arrangeRack();
    /* Spawn ball + hint after rack settles */
    setTimeout(() => {
      spawnBall();
      showTip();
    }, 420);
  }

  function stopChaos() {
    /* Border off */
    if (chaosBorderEl) chaosBorderEl.classList.remove('active');
    /* Pockets off */
    document.querySelectorAll('.pocket').forEach(p => p.classList.remove('active'));
    /* Restore pocketed blocks */
    blocks.forEach(block => {
      if (block.style.display === 'none') {
        const bw = block.offsetWidth  || 300;
        const bh = block.offsetHeight || 200;
        const x  = 24 + Math.random() * Math.max(0, window.innerWidth  - bw - 48);
        const y  = headerH + 24 + Math.random() * Math.max(0, window.innerHeight - headerH - bh - 48);
        block.style.display   = '';
        block.style.opacity   = '0';
        block.style.left      = x + 'px';
        block.style.top       = y + 'px';
        block.style.transform = `rotate(${block._rot}deg)`;
        block.style.transition = 'opacity 0.5s ease';
        requestAnimationFrame(() => {
          block.style.opacity = '1';
          setTimeout(() => { block.style.transition = ''; }, 520);
        });
      }
    });
    /* Remove ball */
    removeBall();
    /* Remove hint */
    if (chaosTip) { chaosTip.remove(); chaosTip = null; }
  }

  function arrangeRack() {
    const cx   = window.innerWidth  / 2;
    const cy   = window.innerHeight / 2;
    const zoneX = isMobile ? 120 : 240;
    const zoneY = isMobile ? 100 : 180;

    Array.from(aliveBlocks).forEach((block, i) => {
      const tx  = cx - block.offsetWidth  / 2 + (Math.random() - 0.5) * zoneX * 2;
      const ty  = cy - block.offsetHeight / 2 + (Math.random() - 0.5) * zoneY * 2;
      const rot = (Math.random() - 0.5) * 10;
      const del = i * 18;

      block._rot = rot;
      block.style.transition = `left 0.65s ${del}ms cubic-bezier(0.16,1,0.3,1),
                                top  0.65s ${del}ms cubic-bezier(0.16,1,0.3,1),
                                transform 0.65s ${del}ms cubic-bezier(0.16,1,0.3,1)`;
      block.style.left      = tx + 'px';
      block.style.top       = ty + 'px';
      block.style.transform = `rotate(${rot}deg)`;
      setTimeout(() => { block.style.transition = ''; }, 700 + del);
    });
  }

  function spawnBall() {
    if (!chaosActive) return;
    ball.el = document.createElement('div');
    ball.el.className = 'chaos-ball';
    ball.x = window.innerWidth  / 2;
    ball.y = window.innerHeight - 80;
    updateBallPos();
    document.body.appendChild(ball.el);

    aimCanvas = document.createElement('canvas');
    aimCanvas.id     = 'aimCanvas';
    aimCanvas.width  = window.innerWidth;
    aimCanvas.height = window.innerHeight;
    aimCtx = aimCanvas.getContext('2d');
    document.body.appendChild(aimCanvas);

    ball.el.addEventListener('mousedown',  onBallDown);
    ball.el.addEventListener('touchstart', onBallDown, { passive: false });
    ball.el.addEventListener('click',      e => e.stopPropagation());
  }

  function removeBall() {
    if (ball.raf) { cancelAnimationFrame(ball.raf); ball.raf = null; }
    ball.moving = false;
    if (ball.el)    { ball.el.remove();    ball.el    = null; }
    if (aimCanvas)  { aimCanvas.remove();  aimCanvas  = null; aimCtx = null; }
    aimActive = false;
    window.removeEventListener('mousemove', onAimMove);
    window.removeEventListener('mouseup',   onAimRelease);
    window.removeEventListener('touchmove', onAimMove);
    window.removeEventListener('touchend',  onAimRelease);
  }

  function updateBallPos() {
    if (!ball.el) return;
    ball.el.style.left = (ball.x - BALL_R) + 'px';
    ball.el.style.top  = (ball.y - BALL_R) + 'px';
  }

  function onBallDown(e) {
    if (ball.moving) return;
    e.preventDefault();
    e.stopPropagation();
    const { x, y } = getXY(e);
    aimActive = true;
    aimStartX = x;
    aimStartY = y;
    ball.el.classList.add('grabbing');
    window.addEventListener('mousemove', onAimMove);
    window.addEventListener('mouseup',   onAimRelease);
    window.addEventListener('touchmove', onAimMove, { passive: false });
    window.addEventListener('touchend',  onAimRelease);
  }

  function onAimMove(e) {
    if (!aimActive || !aimCtx) return;
    e.preventDefault();
    const { x, y } = getXY(e);
    const dx  = aimStartX - x;
    const dy  = aimStartY - y;
    const len = Math.sqrt(dx * dx + dy * dy);
    aimCtx.clearRect(0, 0, aimCanvas.width, aimCanvas.height);
    if (len < 8) return;
    const lineLen = Math.min(len * 3, 320);
    aimCtx.save();
    aimCtx.setLineDash([6, 10]);
    aimCtx.strokeStyle = 'rgba(255,255,255,0.45)';
    aimCtx.lineWidth   = 1.5;
    aimCtx.beginPath();
    aimCtx.moveTo(ball.x, ball.y);
    aimCtx.lineTo(ball.x + (dx / len) * lineLen, ball.y + (dy / len) * lineLen);
    aimCtx.stroke();
    aimCtx.restore();
  }

  function onAimRelease(e) {
    if (!aimActive) return;
    aimActive = false;
    const { x, y } = getXY(e);
    const dx  = aimStartX - x;
    const dy  = aimStartY - y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (aimCtx) aimCtx.clearRect(0, 0, aimCanvas.width, aimCanvas.height);
    if (ball.el) ball.el.classList.remove('grabbing');
    window.removeEventListener('mousemove', onAimMove);
    window.removeEventListener('mouseup',   onAimRelease);
    window.removeEventListener('touchmove', onAimMove);
    window.removeEventListener('touchend',  onAimRelease);
    if (len < 10) return;
    ball.vx = (dx / len) * Math.min(len * 0.2, 24);
    ball.vy = (dy / len) * Math.min(len * 0.2, 24);
    ball.moving = true;
    playTone(500, 280, 0.12, 0.22);
    ballPhysicsLoop();
  }

  function ballPhysicsLoop() {
    if (!chaosActive || !ball.moving) return;
    ball.vx *= 0.985;
    ball.vy *= 0.985;
    ball.x  += ball.vx;
    ball.y  += ball.vy;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (ball.x - BALL_R < 0)   { ball.x = BALL_R;      ball.vx =  Math.abs(ball.vx) * 0.75; }
    if (ball.x + BALL_R > vw)  { ball.x = vw - BALL_R; ball.vx = -Math.abs(ball.vx) * 0.75; }
    if (ball.y - BALL_R < 0)   { ball.y = BALL_R;      ball.vy =  Math.abs(ball.vy) * 0.75; }
    if (ball.y + BALL_R > vh)  { ball.y = vh - BALL_R; ball.vy = -Math.abs(ball.vy) * 0.75; }
    updateBallPos();

    /* Ball vs block collision */
    aliveBlocks.forEach(block => {
      if (block.style.display === 'none') return;
      const bl   = parseFloat(block.style.left) || 0;
      const bt   = parseFloat(block.style.top)  || 0;
      const bw   = block.offsetWidth;
      const bh   = block.offsetHeight;
      const cx   = Math.max(bl, Math.min(ball.x, bl + bw));
      const cy   = Math.max(bt, Math.min(ball.y, bt + bh));
      const dx   = ball.x - cx;
      const dy   = ball.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < BALL_R && dist > 0) {
        const nx  = dx / dist;
        const ny  = dy / dist;
        const spd = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);

        block.style.transition = '';
        throwBlock(block, -nx * spd * 3.5, -ny * spd * 3.5);

        const dot = ball.vx * nx + ball.vy * ny;
        if (dot < 0) { ball.vx -= 1.6 * dot * nx; ball.vy -= 1.6 * dot * ny; }
        ball.x += nx * (BALL_R - dist + 1);
        ball.y += ny * (BALL_R - dist + 1);
        updateBallPos();
        playTone(380, 200, 0.1, 0.2);
      }
    });

    const spd = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    if (spd > 0.35) {
      ball.raf = requestAnimationFrame(ballPhysicsLoop);
    } else {
      ball.moving = false;
      ball.raf    = null;
    }
  }

  function pocketBlock(block, cornerX, cornerY) {
    throwRAFs.delete(block);
    aliveBlocks.delete(block);
    const tx = cornerX < window.innerWidth  / 2 ? -block.offsetWidth  - 10 : window.innerWidth  + 10;
    const ty = cornerY < window.innerHeight / 2 ? -block.offsetHeight - 10 : window.innerHeight + 10;
    block.style.transition = 'left 0.22s ease-in, top 0.22s ease-in, transform 0.22s ease-in, opacity 0.25s ease-in';
    block.style.left      = tx + 'px';
    block.style.top       = ty + 'px';
    block.style.transform = 'scale(0.15) rotate(45deg)';
    block.style.opacity   = '0';
    playTone(110, 55, 0.3, 0.32);
    setTimeout(() => { block.style.display = 'none'; }, 260);
  }

  function showTip() {
    if (chaosTip) chaosTip.remove();
    chaosTip = document.createElement('div');
    chaosTip.className   = 'chaos-hint';
    chaosTip.innerHTML   = 'Drag the ball to aim &middot; Release to shoot<span>Images fall into the corners &middot; Click to dismiss</span>';
    document.body.appendChild(chaosTip);
    setTimeout(() => { document.addEventListener('click', dismissTip, { once: true }); }, 500);
  }

  function dismissTip() {
    if (!chaosTip) return;
    chaosTip.style.opacity = '0';
    setTimeout(() => { if (chaosTip) { chaosTip.remove(); chaosTip = null; } }, 850);
  }

})();
