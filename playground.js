(function () {
  const blocks = Array.from(document.querySelectorAll('.pg-block'));

  /* ── Audio ── */
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
      osc.connect(gain); gain.connect(ctx.destination);
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
    block._origWidth  = block.style.width;
    block._origHeight = block.style.height;

    const bw = block.offsetWidth, bh = block.offsetHeight;
    const vw = window.innerWidth,  vh = window.innerHeight;
    const margin = 24;
    const x   = margin + Math.random() * Math.max(0, vw - bw - margin * 2);
    const y   = headerH + margin + Math.random() * Math.max(0, vh - headerH - bh - margin * 2);
    const rot = (Math.random() - 0.5) * 24;
    block.style.left      = x + 'px';
    block.style.top       = y + 'px';
    block._rot            = rot;
    block.style.opacity   = '0';
    block.style.transform = `scale(0.72) rotate(${rot}deg)`;

    const delay = isMobile ? i * 40 : 60 + i * 90;
    setTimeout(() => {
      block.style.transition = `opacity 0.55s ${delay}ms cubic-bezier(0.16,1,0.3,1),
                                transform 0.55s ${delay}ms cubic-bezier(0.16,1,0.3,1)`;
      block.style.opacity   = '1';
      block.style.transform = `rotate(${rot}deg)`;
      setTimeout(() => { block.style.transition = ''; }, 560 + delay + 50);
    }, 16);
  });

  /* ── Drag state ── */
  let active = null, startMx = 0, startMy = 0, startLeft = 0, startTop = 0;
  let lastX  = 0, lastY = 0, velX = 0, velY = 0, didDrag = false;
  let topZ   = 10;
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
      : { x: e.clientX, y: e.clientY };
  }

  function onDown(e) {
    if (chaosActive) return;
    if (e.button && e.button !== 0) return;
    e.preventDefault();

    const raf = throwRAFs.get(e.currentTarget);
    if (raf) cancelAnimationFrame(raf);

    active = e.currentTarget; didDrag = false; velX = 0; velY = 0;
    active.style.zIndex = 9999;
    active.classList.add('is-dragging');
    active.style.transition = 'transform 0.3s cubic-bezier(0.16,1,0.3,1)';
    active.style.transform  = `scale(${DRAG_SCALE}) rotate(0deg)`;
    playPickup();

    const { x, y } = getXY(e);
    startMx = x; startMy = y; lastX = x; lastY = y;
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
    const dx = x - startMx, dy = y - startMy;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) didDrag = true;
    if (!didDrag) return;
    velX = velX * 0.72 + (x - lastX) * 0.28;
    velY = velY * 0.72 + (y - lastY) * 0.28;
    lastX = x; lastY = y;
    active.style.transition = '';
    active.style.left       = (startLeft + dx) + 'px';
    active.style.top        = (startTop  + dy) + 'px';
    active.style.transform  = `scale(${DRAG_SCALE}) rotate(0deg)`;
  }

  function onUp() {
    if (!active) return;
    active.classList.remove('is-dragging');
    const released = active, finalVX = velX, finalVY = velY, hadDrag = didDrag;
    released.style.transition = 'transform 0.5s cubic-bezier(0.25,1,0.5,1)';
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

  /* ── Throw physics (shared: normal drag + pool hit) ── */
  function throwBlock(block, vx, vy) {
    const FRICTION    = 0.88;
    const MIN_V       = 0.4;
    const POCKET_SIZE = 68;

    function step() {
      vx *= FRICTION; vy *= FRICTION;
      let nx = parseFloat(block.style.left) + vx;
      let ny = parseFloat(block.style.top)  + vy;

      /* Pocket check — chaos mode only */
      if (chaosActive && block.style.display !== 'none') {
        const bw = block.offsetWidth, bh = block.offsetHeight;
        const bx = nx + bw / 2, by = ny + bh / 2;
        const vw = window.innerWidth,  vh = window.innerHeight;
        for (const [px, py] of getPockets(vw, vh)) {
          const ddx = bx - px, ddy = by - py;
          if (Math.sqrt(ddx*ddx + ddy*ddy) < POCKET_SIZE) {
            pocketBlock(block, px, py); return;
          }
        }
      }

      const margin = 8;
      const maxX = window.innerWidth  - block.offsetWidth  - margin;
      const maxY = window.innerHeight - block.offsetHeight - margin;
      if (nx < margin)           { nx = margin;  vx *= -0.3; }
      if (ny < headerH + margin) { ny = headerH + margin; vy *= -0.3; }
      if (nx > maxX)             { nx = maxX;    vx *= -0.3; }
      if (ny > maxY)             { ny = maxY;    vy *= -0.3; }

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

  /* ── POOL MODE ── */
  const POOL_BALLS   = 15;                          // standard rack
  const BALL_D       = isMobile ? 48 : 68;          // pool ball diameter
  const BALL_R_POOL  = BALL_D / 2;
  const BALL_R_CUE   = isMobile ? 18 : 22;          // cue ball radius
  const chaosBorderEl = document.getElementById('chaosBorder');
  const chaosBtn      = document.getElementById('scatterBtn');

  let cueBall    = { x: 0, y: 0, vx: 0, vy: 0, el: null, moving: false, raf: null };
  let aimCanvas  = null, aimCtx = null, chaosTip = null;
  let aimActive  = false, aimStartX = 0, aimStartY = 0;
  let aliveBlocks = new Set();

  function getPockets(vw, vh) {
    return [
      [0, 0], [vw, 0], [0, vh], [vw, vh],   // 4 corners
      [0, vh / 2], [vw, vh / 2],              // 2 mid-sides
    ];
  }

  if (chaosBtn) {
    chaosBtn.addEventListener('click', () => {
      chaosActive = !chaosActive;
      chaosBtn.textContent = chaosActive ? 'Stop the game' : "Let's Shoot Some Pool";
      chaosActive ? startPool() : stopPool();
    });
  }

  function startPool() {
    if (chaosBorderEl) chaosBorderEl.classList.add('active');
    document.querySelectorAll('.pocket').forEach(p => p.classList.add('active'));

    /* Transform first 15 blocks to pool balls, hide rest */
    const poolBlocks = blocks.slice(0, POOL_BALLS);
    blocks.slice(POOL_BALLS).forEach(b => {
      b.style.transition = 'opacity 0.25s ease';
      b.style.opacity    = '0';
      setTimeout(() => { b.style.display = 'none'; b.style.transition = ''; }, 280);
    });

    poolBlocks.forEach(block => {
      block._origWidth  = block._origWidth  || block.style.width;
      block._origHeight = block._origHeight || block.style.height;
      block.style.transition = `width 0.45s cubic-bezier(0.16,1,0.3,1),
                                height 0.45s cubic-bezier(0.16,1,0.3,1),
                                border-radius 0.45s cubic-bezier(0.16,1,0.3,1)`;
      block.style.width  = BALL_D + 'px';
      block.style.height = BALL_D + 'px';
      block.classList.add('pool-ball');
      setTimeout(() => { block.style.transition = ''; }, 480);
    });

    aliveBlocks = new Set(poolBlocks);

    /* Rack after morph settles */
    setTimeout(arrangeRack, 520);
    /* Spawn cue ball and hint slightly after rack */
    setTimeout(() => { spawnCueBall(); showTip(); }, 700);
  }

  function stopPool() {
    if (chaosBorderEl) chaosBorderEl.classList.remove('active');
    document.querySelectorAll('.pocket').forEach(p => p.classList.remove('active'));

    /* Restore pool balls to original size */
    blocks.slice(0, POOL_BALLS).forEach(block => {
      block.style.transition = `width 0.4s cubic-bezier(0.16,1,0.3,1),
                                height 0.4s cubic-bezier(0.16,1,0.3,1),
                                border-radius 0.4s cubic-bezier(0.16,1,0.3,1)`;
      block.style.width  = block._origWidth  || '';
      block.style.height = block._origHeight || '';
      block.classList.remove('pool-ball');
      block.style.transform = `rotate(${block._rot}deg)`;
      setTimeout(() => { block.style.transition = ''; }, 440);
    });

    /* Restore hidden blocks */
    blocks.slice(POOL_BALLS).forEach(block => {
      if (block.style.display === 'none') {
        const bw = parseInt(block._origWidth) || 300;
        const bh = parseInt(block._origHeight) || 200;
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

    /* Also restore any pocketed blocks from first 15 */
    blocks.slice(0, POOL_BALLS).forEach(block => {
      if (block.style.display === 'none') {
        const x = 24 + Math.random() * Math.max(0, window.innerWidth  - BALL_D - 48);
        const y = headerH + 24 + Math.random() * Math.max(0, window.innerHeight - headerH - BALL_D - 48);
        block.style.display = '';
        block.style.left    = x + 'px';
        block.style.top     = y + 'px';
        block.style.opacity = '1';
      }
    });

    removeCueBall();
    if (chaosTip) { chaosTip.remove(); chaosTip = null; }
  }

  /* Triangle rack — apex at top, 5 rows (1-2-3-4-5 = 15 balls) */
  function arrangeRack() {
    const D    = BALL_D;
    const rowH = D * Math.sin(Math.PI / 3);   /* ≈ D × 0.866 */
    const vw   = window.innerWidth;
    const vh   = window.innerHeight;

    /* Apex center: upper-centre of playing area */
    const apexX = vw / 2;
    const apexY = headerH + (vh - headerH) * 0.22;

    let idx = 0;
    for (let row = 0; row < 5; row++) {
      const count    = row + 1;
      const rowY     = apexY + row * rowH;
      const rowStartX = apexX - (row * D) / 2;  /* center each row */

      for (let col = 0; col < count; col++) {
        const block = blocks[idx++];
        if (!block) continue;
        const tx  = rowStartX + col * D - D / 2;
        const ty  = rowY - D / 2;
        const del = idx * 14;

        block.style.transition = `left 0.6s ${del}ms cubic-bezier(0.16,1,0.3,1),
                                  top  0.6s ${del}ms cubic-bezier(0.16,1,0.3,1),
                                  transform 0.6s ${del}ms cubic-bezier(0.16,1,0.3,1)`;
        block.style.left      = tx + 'px';
        block.style.top       = ty + 'px';
        block.style.transform = 'rotate(0deg)';
        setTimeout(() => { block.style.transition = ''; }, 650 + del);
      }
    }
  }

  function spawnCueBall() {
    if (!chaosActive) return;
    const D   = BALL_R_CUE * 2;
    cueBall.el = document.createElement('div');
    cueBall.el.className = 'chaos-ball';
    cueBall.el.style.width  = D + 'px';
    cueBall.el.style.height = D + 'px';

    /* Position cue ball well above bottom bar */
    cueBall.x = window.innerWidth  / 2;
    cueBall.y = window.innerHeight * 0.78;
    updateCueBallPos();
    document.body.appendChild(cueBall.el);

    aimCanvas = document.createElement('canvas');
    aimCanvas.id     = 'aimCanvas';
    aimCanvas.width  = window.innerWidth;
    aimCanvas.height = window.innerHeight;
    aimCtx = aimCanvas.getContext('2d');
    document.body.appendChild(aimCanvas);

    cueBall.el.addEventListener('mousedown',  onBallDown);
    cueBall.el.addEventListener('touchstart', onBallDown, { passive: false });
    cueBall.el.addEventListener('click', e => e.stopPropagation());
  }

  function removeCueBall() {
    if (cueBall.raf) { cancelAnimationFrame(cueBall.raf); cueBall.raf = null; }
    cueBall.moving = false;
    if (cueBall.el)  { cueBall.el.remove();  cueBall.el  = null; }
    if (aimCanvas)   { aimCanvas.remove();    aimCanvas   = null; aimCtx = null; }
    aimActive = false;
    window.removeEventListener('mousemove', onAimMove);
    window.removeEventListener('mouseup',   onAimRelease);
    window.removeEventListener('touchmove', onAimMove);
    window.removeEventListener('touchend',  onAimRelease);
  }

  function updateCueBallPos() {
    if (!cueBall.el) return;
    cueBall.el.style.left = (cueBall.x - BALL_R_CUE) + 'px';
    cueBall.el.style.top  = (cueBall.y - BALL_R_CUE) + 'px';
  }

  function onBallDown(e) {
    if (cueBall.moving) return;
    e.preventDefault(); e.stopPropagation();
    const { x, y } = getXY(e);
    aimActive = true; aimStartX = x; aimStartY = y;
    cueBall.el.classList.add('grabbing');
    window.addEventListener('mousemove', onAimMove);
    window.addEventListener('mouseup',   onAimRelease);
    window.addEventListener('touchmove', onAimMove, { passive: false });
    window.addEventListener('touchend',  onAimRelease);
  }

  function onAimMove(e) {
    if (!aimActive || !aimCtx) return;
    e.preventDefault();
    const { x, y } = getXY(e);
    const dx = aimStartX - x, dy = aimStartY - y;
    const len = Math.sqrt(dx*dx + dy*dy);
    aimCtx.clearRect(0, 0, aimCanvas.width, aimCanvas.height);
    if (len < 8) return;
    const lineLen = Math.min(len * 3, 340);
    aimCtx.save();
    aimCtx.setLineDash([6, 10]);
    aimCtx.strokeStyle = 'rgba(255,255,255,0.42)';
    aimCtx.lineWidth   = 1.5;
    aimCtx.beginPath();
    aimCtx.moveTo(cueBall.x, cueBall.y);
    aimCtx.lineTo(cueBall.x + (dx / len) * lineLen, cueBall.y + (dy / len) * lineLen);
    aimCtx.stroke();
    aimCtx.restore();
  }

  function onAimRelease(e) {
    if (!aimActive) return;
    aimActive = false;
    const { x, y } = getXY(e);
    const dx = aimStartX - x, dy = aimStartY - y;
    const len = Math.sqrt(dx*dx + dy*dy);
    if (aimCtx) aimCtx.clearRect(0, 0, aimCanvas.width, aimCanvas.height);
    if (cueBall.el) cueBall.el.classList.remove('grabbing');
    window.removeEventListener('mousemove', onAimMove);
    window.removeEventListener('mouseup',   onAimRelease);
    window.removeEventListener('touchmove', onAimMove);
    window.removeEventListener('touchend',  onAimRelease);
    if (len < 10) return;
    const power = Math.min(len * 0.2, 26);
    cueBall.vx = (dx / len) * power;
    cueBall.vy = (dy / len) * power;
    cueBall.moving = true;
    playTone(520, 290, 0.12, 0.22);
    ballPhysicsLoop();
  }

  function ballPhysicsLoop() {
    if (!chaosActive || !cueBall.moving) return;
    cueBall.vx *= 0.986; cueBall.vy *= 0.986;
    cueBall.x  += cueBall.vx; cueBall.y  += cueBall.vy;

    const vw = window.innerWidth, vh = window.innerHeight;
    if (cueBall.x - BALL_R_CUE < 0)   { cueBall.x = BALL_R_CUE;      cueBall.vx =  Math.abs(cueBall.vx) * 0.75; }
    if (cueBall.x + BALL_R_CUE > vw)  { cueBall.x = vw - BALL_R_CUE; cueBall.vx = -Math.abs(cueBall.vx) * 0.75; }
    if (cueBall.y - BALL_R_CUE < 0)   { cueBall.y = BALL_R_CUE;      cueBall.vy =  Math.abs(cueBall.vy) * 0.75; }
    if (cueBall.y + BALL_R_CUE > vh)  { cueBall.y = vh - BALL_R_CUE; cueBall.vy = -Math.abs(cueBall.vy) * 0.75; }
    updateCueBallPos();

    /* Circle–circle collision with pool balls */
    aliveBlocks.forEach(block => {
      if (block.style.display === 'none') return;
      const bl = parseFloat(block.style.left) || 0;
      const bt = parseFloat(block.style.top)  || 0;
      const blockCX = bl + BALL_R_POOL;
      const blockCY = bt + BALL_R_POOL;
      const dx   = cueBall.x - blockCX;
      const dy   = cueBall.y - blockCY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const minD = BALL_R_CUE + BALL_R_POOL;

      if (dist < minD && dist > 0) {
        const nx  = dx / dist, ny = dy / dist;
        const spd = Math.sqrt(cueBall.vx*cueBall.vx + cueBall.vy*cueBall.vy);

        block.style.transition = '';
        throwBlock(block, -nx * spd * 3.2, -ny * spd * 3.2);

        const dot = cueBall.vx*nx + cueBall.vy*ny;
        if (dot < 0) { cueBall.vx -= 1.6*dot*nx; cueBall.vy -= 1.6*dot*ny; }
        cueBall.x += nx * (minD - dist + 1);
        cueBall.y += ny * (minD - dist + 1);
        updateCueBallPos();
        playTone(400, 210, 0.1, 0.2);
      }
    });

    const spd = Math.sqrt(cueBall.vx*cueBall.vx + cueBall.vy*cueBall.vy);
    if (spd > 0.3) {
      cueBall.raf = requestAnimationFrame(ballPhysicsLoop);
    } else {
      cueBall.moving = false; cueBall.raf = null;
    }
  }

  function pocketBlock(block, px, py) {
    throwRAFs.delete(block);
    aliveBlocks.delete(block);
    const vw = window.innerWidth, vh = window.innerHeight;
    /* Fly toward nearest edge */
    const tx = px < vw / 2 ? -BALL_D - 10 : vw + 10;
    const ty = py < vh / 2 ? -BALL_D - 10 : py === vh / 2
      ? parseFloat(block.style.top)        /* mid-side: slide straight off */
      : vh + 10;
    block.style.transition = 'left 0.2s ease-in, top 0.2s ease-in, transform 0.2s ease-in, opacity 0.22s ease-in';
    block.style.left      = (px < vw / 2 ? -BALL_D - 10 : vw + 10) + 'px';
    block.style.top       = (py < vh / 2 ? -BALL_D - 10 : py > vh / 2 ? vh + 10 : parseFloat(block.style.top)) + 'px';
    block.style.transform = 'scale(0.1) rotate(60deg)';
    block.style.opacity   = '0';
    playTone(100, 50, 0.28, 0.3);
    setTimeout(() => { block.style.display = 'none'; }, 240);
  }

  function showTip() {
    if (chaosTip) chaosTip.remove();
    chaosTip = document.createElement('div');
    chaosTip.className = 'chaos-hint';
    chaosTip.innerHTML = 'Drag the cue ball to aim &middot; Release to shoot<span>Sink the balls into the corners &middot; Click to dismiss</span>';
    document.body.appendChild(chaosTip);
    setTimeout(() => { document.addEventListener('click', dismissTip, { once: true }); }, 500);
  }

  function dismissTip() {
    if (!chaosTip) return;
    chaosTip.style.opacity = '0';
    setTimeout(() => { if (chaosTip) { chaosTip.remove(); chaosTip = null; } }, 850);
  }

})();
