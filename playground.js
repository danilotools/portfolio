(function () {
  const blocks = Array.from(document.querySelectorAll('.pg-block'));

  /* ── Audio ── */
  let audioCtx = null;
  function getCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  }
  function playTone(f1, f2, dur, vol) {
    try {
      const ctx = getCtx(), osc = ctx.createOscillator(), g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f1, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(f2, ctx.currentTime + dur);
      g.gain.setValueAtTime(vol, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + dur + 0.01);
    } catch (_) {}
  }
  function playPickup() { playTone(180, 90,  0.12, 0.22); }
  function playDrop()   { playTone(320, 200, 0.08, 0.16); }
  function playClack()  { playTone(680, 320, 0.08, 0.28); }
  function playPocket() { playTone(110, 55,  0.28, 0.30); }

  /* ── Layout constants ── */
  const headerH  = (document.querySelector('.header') || {}).offsetHeight || 80;
  const isMobile = window.innerWidth <= 768;
  const SCALE    = isMobile ? 0.69 : 1;

  /* ── Initial scatter ── */
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
    const vw = window.innerWidth, vh = window.innerHeight;
    const m  = 24;
    const x   = m + Math.random() * Math.max(0, vw - bw - m * 2);
    const y   = headerH + m + Math.random() * Math.max(0, vh - headerH - bh - m * 2);
    const rot = (Math.random() - 0.5) * 24;
    block.style.left = x + 'px'; block.style.top = y + 'px';
    block._rot = rot; block.style.opacity = '0';
    block.style.transform = `scale(0.72) rotate(${rot}deg)`;

    const d = isMobile ? i * 40 : 60 + i * 90;
    setTimeout(() => {
      block.style.transition = `opacity .55s ${d}ms cubic-bezier(.16,1,.3,1),
                                transform .55s ${d}ms cubic-bezier(.16,1,.3,1)`;
      block.style.opacity   = '1';
      block.style.transform = `rotate(${rot}deg)`;
      setTimeout(() => { block.style.transition = ''; }, 560 + d + 50);
    }, 16);
  });

  /* ── Drag (normal mode) ── */
  let active = null, startMx = 0, startMy = 0, startLeft = 0, startTop = 0;
  let lastX = 0, lastY = 0, velX = 0, velY = 0, didDrag = false, topZ = 10;
  let poolActive       = false;
  let quizActive       = false;
  let hotPotatoActive  = false;
  const DRAG_SCALE = isMobile ? 1.35 : 1.8;
  const throwRAFs  = new WeakMap();

  blocks.forEach(b => {
    b.addEventListener('mousedown', onDown);
    b.addEventListener('touchstart', onDown, { passive: false });
  });

  function getXY(e) {
    const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
    return t ? { x: t.clientX, y: t.clientY } : { x: e.clientX, y: e.clientY };
  }

  function onDown(e) {
    if (poolActive || quizActive || hotPotatoActive) return;
    if (e.button && e.button !== 0) return;
    e.preventDefault();
    const raf = throwRAFs.get(e.currentTarget);
    if (raf) cancelAnimationFrame(raf);
    active = e.currentTarget; didDrag = false; velX = 0; velY = 0;
    active.style.zIndex = 9999; active.classList.add('is-dragging');
    active.style.transition = 'transform .3s cubic-bezier(.16,1,.3,1)';
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
    if (!active) return; e.preventDefault();
    const { x, y } = getXY(e);
    const dx = x - startMx, dy = y - startMy;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) didDrag = true;
    if (!didDrag) return;
    velX = velX * 0.72 + (x - lastX) * 0.28;
    velY = velY * 0.72 + (y - lastY) * 0.28;
    lastX = x; lastY = y;
    active.style.transition = '';
    active.style.left = (startLeft + dx) + 'px';
    active.style.top  = (startTop  + dy) + 'px';
    active.style.transform = `scale(${DRAG_SCALE}) rotate(0deg)`;
  }

  function onUp() {
    if (!active) return;
    active.classList.remove('is-dragging');
    const rel = active, fvx = velX, fvy = velY, hadDrag = didDrag;
    rel.style.transition = 'transform .5s cubic-bezier(.25,1,.5,1)';
    rel.style.transform  = `rotate(${rel._rot}deg)`;
    rel.style.zIndex     = ++topZ;
    setTimeout(() => { rel.style.transition = ''; }, 550);
    playDrop();
    active = null; didDrag = false; velX = 0; velY = 0;
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup',   onUp);
    window.removeEventListener('touchmove', onMove);
    window.removeEventListener('touchend',  onUp);
    if (!isMobile && hadDrag && (Math.abs(fvx) > 2 || Math.abs(fvy) > 2)) {
      simpleThrow(rel, fvx * 1.6, fvy * 1.6);
    }
  }

  /* Simple throw for normal drag mode (no ball-ball physics) */
  function simpleThrow(block, vx, vy) {
    const F = 0.88, MV = 0.4;
    function step() {
      vx *= F; vy *= F;
      let nx = parseFloat(block.style.left) + vx;
      let ny = parseFloat(block.style.top)  + vy;
      const mg = 8, mxX = window.innerWidth - block.offsetWidth - mg, mxY = window.innerHeight - block.offsetHeight - mg;
      if (nx < mg)        { nx = mg;  vx *= -0.3; }
      if (ny < headerH+mg){ ny = headerH+mg; vy *= -0.3; }
      if (nx > mxX)       { nx = mxX; vx *= -0.3; }
      if (ny > mxY)       { ny = mxY; vy *= -0.3; }
      block.style.left = nx + 'px'; block.style.top = ny + 'px';
      if (Math.abs(vx) > MV || Math.abs(vy) > MV) throwRAFs.set(block, requestAnimationFrame(step));
      else throwRAFs.delete(block);
    }
    throwRAFs.set(block, requestAnimationFrame(step));
  }

  /* ════════════════════════════════════════════
     POOL MODE — unified rigid-body physics
     ════════════════════════════════════════════ */
  const POOL_BALLS  = 15;
  const BALL_D      = isMobile ? 48 : 68;
  const BR_POOL     = BALL_D / 2;          /* pool ball radius */
  const BR_CUE      = isMobile ? 18 : 22;  /* cue ball radius  */
  const FRICTION    = 0.974;               /* per-frame rolling friction */
  const RESTITUTION = 0.92;               /* bounciness ball-ball */
  const WALL_DAMP   = 0.68;               /* energy kept on wall hit */
  const STOP_V      = 0.18;               /* velocity threshold → stop */
  const POCKET_R_CORNER = 68;
  const POCKET_R_SIDE   = 90;

  const chaosBorderEl = document.getElementById('chaosBorder');
  const chaosBtn      = document.getElementById('scatterBtn');

  function setBtnText(btn, text) {
    const s = btn && btn.querySelector('.btn-text');
    if (s) s.textContent = text; else if (btn) btn.textContent = text;
  }

  let physBalls   = [];                    /* array of physics objects */
  let physRunning = false, physRaf = null;
  let aliveBlocks = new Set();

  /* cue-ball DOM state (position mirrored into physBalls) */
  let cueDom = { el: null };
  let aimCanvas = null, aimCtx = null, chaosTip = null;
  let aimActive = false, aimStartX = 0, aimStartY = 0;
  let physInited = false;

  function pockets() {
    const vw = window.innerWidth, vh = window.innerHeight;
    return [
      { x: 0,  y: 0,      r: POCKET_R_CORNER },
      { x: vw, y: 0,      r: POCKET_R_CORNER },
      { x: 0,  y: vh,     r: POCKET_R_CORNER },
      { x: vw, y: vh,     r: POCKET_R_CORNER },
      { x: 0,  y: vh / 2, r: POCKET_R_SIDE   },
      { x: vw, y: vh / 2, r: POCKET_R_SIDE   },
    ];
  }

  /* ── Button ── */
  if (chaosBtn) {
    chaosBtn.addEventListener('click', () => {
      if (hotPotatoActive) stopHotPotato();
      poolActive = !poolActive;
      setBtnText(chaosBtn, poolActive ? 'Stop the game' : "Let's Shoot Some Pool");
      poolActive ? startPool() : stopPool();
    });
  }

  /* ── Start / Stop ── */
  function startPool() {
    if (chaosBorderEl) chaosBorderEl.classList.add('active');
    document.querySelectorAll('.pocket').forEach(p => p.classList.add('active'));

    /* Hide excess blocks */
    blocks.slice(POOL_BALLS).forEach(b => {
      b.style.transition = 'opacity .25s ease'; b.style.opacity = '0';
      setTimeout(() => { b.style.display = 'none'; b.style.transition = ''; }, 280);
    });

    /* Morph first 15 to pool balls */
    blocks.slice(0, POOL_BALLS).forEach(block => {
      block.style.transition = `width .45s cubic-bezier(.16,1,.3,1),
                                height .45s cubic-bezier(.16,1,.3,1),
                                border-radius .45s cubic-bezier(.16,1,.3,1)`;
      block.style.width  = BALL_D + 'px';
      block.style.height = BALL_D + 'px';
      block.classList.add('pool-ball');
      setTimeout(() => { block.style.transition = ''; }, 480);
    });

    aliveBlocks = new Set(blocks.slice(0, POOL_BALLS));
    physInited  = false;

    /* Rack → cue ball → hint */
    setTimeout(arrangeRack,  540);
    setTimeout(spawnCueBall, 720);
    setTimeout(showTip,      780);
  }

  function stopPool() {
    if (chaosBorderEl) chaosBorderEl.classList.remove('active');
    document.querySelectorAll('.pocket').forEach(p => p.classList.remove('active'));
    if (physRaf) { cancelAnimationFrame(physRaf); physRaf = null; }
    physRunning = false; physBalls = []; physInited = false;
    removeCueBall();
    if (chaosTip) { chaosTip.remove(); chaosTip = null; }

    /* Restore all blocks as image tiles and scatter them */
    const vw = window.innerWidth, vh = window.innerHeight;

    blocks.slice(0, POOL_BALLS).forEach((block, i) => {
      block.style.display = '';
      block.classList.remove('pool-ball');
      /* First: snap to circle size with no transition so we start from a clean state */
      block.style.transition = 'none';
      block.style.width  = block._origWidth  || '';
      block.style.height = block._origHeight || '';
      const bw = parseInt(block._origWidth)  || block.offsetWidth;
      const bh = parseInt(block._origHeight) || block.offsetHeight;
      const x  = 24 + Math.random() * Math.max(0, vw - bw - 48);
      const y  = headerH + 24 + Math.random() * Math.max(0, vh - headerH - bh - 48);
      const rot = (Math.random() - 0.5) * 28;
      block._rot = rot;
      block.style.transform = `scale(0.6) rotate(${rot}deg)`;
      block.style.opacity = '0';
      block.style.left = x + 'px';
      block.style.top  = y + 'px';
      /* Staggered fly-in */
      const delay = 40 + i * 55;
      setTimeout(() => {
        block.style.transition = `opacity .45s ${delay}ms cubic-bezier(.16,1,.3,1),
                                  transform .45s ${delay}ms cubic-bezier(.16,1,.3,1)`;
        block.style.opacity   = '1';
        block.style.transform = `rotate(${rot}deg)`;
        setTimeout(() => { block.style.transition = ''; }, 460 + delay);
      }, 16);
    });

    /* Restore hidden excess blocks */
    blocks.slice(POOL_BALLS).forEach((block, i) => {
      if (block.style.display === 'none') {
        const bw = parseInt(block._origWidth) || 300;
        const bh = parseInt(block._origHeight) || 200;
        const x = 24 + Math.random() * Math.max(0, vw - bw - 48);
        const y = headerH + 24 + Math.random() * Math.max(0, vh - headerH - bh - 48);
        const rot = (Math.random() - 0.5) * 28;
        block._rot = rot;
        block.style.display = ''; block.style.opacity = '0';
        block.style.left = x + 'px'; block.style.top = y + 'px';
        block.style.transform = `scale(0.6) rotate(${rot}deg)`;
        const delay = 40 + (POOL_BALLS + i) * 55;
        setTimeout(() => {
          block.style.transition = `opacity .45s ${delay}ms cubic-bezier(.16,1,.3,1),
                                    transform .45s ${delay}ms cubic-bezier(.16,1,.3,1)`;
          block.style.opacity   = '1';
          block.style.transform = `rotate(${rot}deg)`;
          setTimeout(() => { block.style.transition = ''; }, 460 + delay);
        }, 16);
      }
    });
  }

  /* ── Rack: standard triangle (apex top, 5 rows) ── */
  function arrangeRack() {
    const D    = BALL_D;
    const rowH = D * Math.sin(Math.PI / 3);  /* D × √3/2 */
    const vw   = window.innerWidth;
    const vh   = window.innerHeight;
    const apexX = vw / 2;
    const apexY = headerH + (vh - headerH) * 0.20;

    let idx = 0;
    for (let row = 0; row < 5; row++) {
      const count    = row + 1;
      const rowY     = apexY + row * rowH;
      const rowStartX = apexX - (row * D) / 2;
      for (let col = 0; col < count; col++) {
        const block = blocks[idx++];
        if (!block) continue;
        const tx = rowStartX + col * D - D / 2;
        const ty = rowY - D / 2;
        const dl = idx * 14;
        block.style.transition = `left .6s ${dl}ms cubic-bezier(.16,1,.3,1),
                                  top  .6s ${dl}ms cubic-bezier(.16,1,.3,1),
                                  transform .6s ${dl}ms cubic-bezier(.16,1,.3,1)`;
        block.style.left      = tx + 'px';
        block.style.top       = ty + 'px';
        block.style.transform = 'rotate(0deg)';
        setTimeout(() => { block.style.transition = ''; }, 660 + dl);
      }
    }
  }

  /* ── Physics init: build physBalls from current DOM positions ── */
  function initPhysics() {
    physBalls = [];

    /* Pool balls */
    Array.from(aliveBlocks).forEach(block => {
      /* Read current VISUAL position (mid-animation safe) */
      block.style.transition = '';
      const rect = block.getBoundingClientRect();
      block.style.left = rect.left + 'px';
      block.style.top  = rect.top  + 'px';

      const pb = {
        x: rect.left + BR_POOL,
        y: rect.top  + BR_POOL,
        vx: 0, vy: 0,
        r: BR_POOL,
        alive: true,
        isCue: false,
        block: block,
        sync() {
          if (!this.alive) return;
          block.style.left = (this.x - BR_POOL) + 'px';
          block.style.top  = (this.y - BR_POOL) + 'px';
        }
      };
      physBalls.push(pb);
    });

    /* Cue ball */
    const cuePB = {
      x: parseFloat(cueDom.el ? cueDom.el.style.left : window.innerWidth / 2) + BR_CUE,
      y: parseFloat(cueDom.el ? cueDom.el.style.top  : window.innerHeight * .78) + BR_CUE,
      vx: 0, vy: 0,
      r: BR_CUE,
      alive: true,
      isCue: true,
      block: null,
      sync() {
        if (!cueDom.el) return;
        cueDom.el.style.left = (this.x - BR_CUE) + 'px';
        cueDom.el.style.top  = (this.y - BR_CUE) + 'px';
      }
    };
    physBalls.push(cuePB);
    physInited = true;
  }

  /* ── Master physics step ── */
  function physicsStep() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const pts = pockets();
    let anyMoving = false;

    /* 1. Integrate velocity + wall bounce */
    physBalls.forEach(b => {
      if (!b.alive) return;
      b.vx *= FRICTION; b.vy *= FRICTION;
      b.x  += b.vx;     b.y  += b.vy;

      /* Walls */
      if (b.x - b.r < 0)        { b.x = b.r;       b.vx =  Math.abs(b.vx) * WALL_DAMP; }
      if (b.x + b.r > vw)       { b.x = vw - b.r;  b.vx = -Math.abs(b.vx) * WALL_DAMP; }
      if (b.y - b.r < headerH)  { b.y = headerH + b.r; b.vy = Math.abs(b.vy) * WALL_DAMP; }
      if (b.y + b.r > vh)       { b.y = vh - b.r;  b.vy = -Math.abs(b.vy) * WALL_DAMP; }

      /* Pocket check (not for cue ball) */
      if (!b.isCue) {
        for (const p of pts) {
          const ddx = b.x - p.x, ddy = b.y - p.y;
          if (Math.sqrt(ddx*ddx + ddy*ddy) < p.r) {
            pocketBall(b, p.x, p.y, vw, vh); return;
          }
        }
      }

      if (Math.sqrt(b.vx*b.vx + b.vy*b.vy) > STOP_V) anyMoving = true;
    });

    /* 2. Ball–ball elastic collisions (all pairs) */
    for (let i = 0; i < physBalls.length; i++) {
      if (!physBalls[i].alive) continue;
      for (let j = i + 1; j < physBalls.length; j++) {
        if (!physBalls[j].alive) continue;
        collide(physBalls[i], physBalls[j]);
      }
    }

    /* 3. Sync to DOM */
    physBalls.forEach(b => { if (b.alive) b.sync(); });

    if (anyMoving) {
      physRaf = requestAnimationFrame(physicsStep);
    } else {
      physRunning = false; physRaf = null;
    }
  }

  function startPhysics() {
    if (physRunning) return;
    physRunning = true;
    physRaf = requestAnimationFrame(physicsStep);
  }

  /* Elastic collision between two balls (equal-ish mass) */
  function collide(a, b) {
    const dx   = b.x - a.x, dy = b.y - a.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const minD = a.r + b.r;
    if (dist >= minD || dist === 0) return;

    const nx = dx / dist, ny = dy / dist;
    const dvx = a.vx - b.vx, dvy = a.vy - b.vy;
    const dvn = dvx * nx + dvy * ny;
    if (dvn <= 0) return;              /* already separating */

    /* Impulse (equal mass elastic + restitution) */
    const j = (1 + RESTITUTION) * dvn / 2;
    a.vx -= j * nx; a.vy -= j * ny;
    b.vx += j * nx; b.vy += j * ny;

    /* Separate so they don't stick */
    const overlap = (minD - dist) / 2;
    a.x -= nx * overlap; a.y -= ny * overlap;
    b.x += nx * overlap; b.y += ny * overlap;

    playClack();
  }

  /* Sink a ball into a pocket */
  function pocketBall(pb, px, py, vw, vh) {
    pb.alive = false;
    aliveBlocks.delete(pb.block);
    const bl = pb.block;
    const tx = px < vw / 2 ? -BALL_D - 8 : vw + 8;
    const ty = py < vh * 0.3 ? -BALL_D - 8
             : py > vh * 0.7 ? vh + 8
             : parseFloat(bl.style.top);
    bl.style.transition = 'left .2s ease-in, top .2s ease-in, transform .2s ease-in, opacity .22s ease-in';
    bl.style.left      = tx + 'px';
    bl.style.top       = ty + 'px';
    bl.style.transform = 'scale(0.08) rotate(60deg)';
    bl.style.opacity   = '0';
    playPocket();
    setTimeout(() => { bl.style.display = 'none'; }, 240);
  }

  /* ── Cue ball DOM ── */
  function spawnCueBall() {
    if (!poolActive) return;
    cueDom.el = document.createElement('div');
    cueDom.el.className = 'chaos-ball';
    const D = BR_CUE * 2;
    cueDom.el.style.width  = D + 'px';
    cueDom.el.style.height = D + 'px';
    cueDom.el.style.left   = (window.innerWidth / 2 - BR_CUE) + 'px';
    cueDom.el.style.top    = (window.innerHeight * 0.78 - BR_CUE) + 'px';
    document.body.appendChild(cueDom.el);

    aimCanvas = document.createElement('canvas');
    aimCanvas.id = 'aimCanvas';
    aimCanvas.width  = window.innerWidth;
    aimCanvas.height = window.innerHeight;
    aimCtx = aimCanvas.getContext('2d');
    document.body.appendChild(aimCanvas);

    cueDom.el.addEventListener('mousedown',  onBallDown);
    cueDom.el.addEventListener('touchstart', onBallDown, { passive: false });
    cueDom.el.addEventListener('click', e => e.stopPropagation());
  }

  function removeCueBall() {
    if (physRaf) { cancelAnimationFrame(physRaf); physRaf = null; }
    if (cueDom.el)  { cueDom.el.remove();  cueDom.el  = null; }
    if (aimCanvas)  { aimCanvas.remove();  aimCanvas  = null; aimCtx = null; }
    aimActive = false;
    window.removeEventListener('mousemove', onAimMove);
    window.removeEventListener('mouseup',   onAimRelease);
    window.removeEventListener('touchmove', onAimMove);
    window.removeEventListener('touchend',  onAimRelease);
  }

  /* ── Aiming ── */
  function onBallDown(e) {
    /* Init physics lazily on first grab */
    if (!physInited) initPhysics();
    if (physRunning) return;           /* wait until balls stop */
    e.preventDefault(); e.stopPropagation();
    const { x, y } = getXY(e);
    aimActive = true; aimStartX = x; aimStartY = y;
    cueDom.el.classList.add('grabbing');
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

    const cuePhysBall = physBalls.find(b => b.isCue);
    const cx = cuePhysBall ? cuePhysBall.x : window.innerWidth / 2;
    const cy = cuePhysBall ? cuePhysBall.y : window.innerHeight * 0.78;
    const lineLen = Math.min(len * 3, 360);

    aimCtx.save();
    aimCtx.setLineDash([6, 10]);
    aimCtx.strokeStyle = 'rgba(255,255,255,0.40)';
    aimCtx.lineWidth   = 1.5;
    aimCtx.beginPath();
    aimCtx.moveTo(cx, cy);
    aimCtx.lineTo(cx + (dx / len) * lineLen, cy + (dy / len) * lineLen);
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
    if (cueDom.el) cueDom.el.classList.remove('grabbing');
    window.removeEventListener('mousemove', onAimMove);
    window.removeEventListener('mouseup',   onAimRelease);
    window.removeEventListener('touchmove', onAimMove);
    window.removeEventListener('touchend',  onAimRelease);
    if (len < 10) return;

    /* Power scales linearly with pull distance, no hard cap */
    const power = Math.min(len * 0.24, 42);
    const cuePhysBall = physBalls.find(b => b.isCue);
    if (cuePhysBall) {
      cuePhysBall.vx = (dx / len) * power;
      cuePhysBall.vy = (dy / len) * power;
    }
    playTone(540, 300, 0.1, 0.22);
    startPhysics();
  }

  /* ── Hint ── */
  function showTip() {
    if (chaosTip) chaosTip.remove();
    chaosTip = document.createElement('div');
    chaosTip.className = 'chaos-hint';
    chaosTip.innerHTML = 'Drag the cue ball to aim &middot; Longer pull = harder shot<span>Sink the balls into the 6 pockets &middot; Click to dismiss</span>';
    document.body.appendChild(chaosTip);
    setTimeout(() => { document.addEventListener('click', dismissTip, { once: true }); }, 500);
  }

  function dismissTip() {
    if (!chaosTip) return;
    chaosTip.style.opacity = '0';
    setTimeout(() => { if (chaosTip) { chaosTip.remove(); chaosTip = null; } }, 850);
  }

  /* ═══════════════════════════════════════════
     QUIZ MODE
  ═══════════════════════════════════════════ */
  const QUIZ_QUESTIONS = [
    { q: "What's Danilo's primary design tool?",
      opts: ["Adobe XD", "Sketch", "Canva", "Figma"], a: 3 },
    { q: "How many years of UX/UI experience does Danilo have?",
      opts: ["4 years", "1 year", "8 years", "10 years"], a: 0 },
    { q: "Which studio does Danilo currently create amazing stuff at?",
      opts: ["Pentagram", "Supercluster Studio", "Fantasy Inc.", "IDEO"], a: 1 },
    { q: "Danilo redesigned the digital experience for which furniture brand?",
      opts: ["IKEA", "CB2", "Hooker Furniture", "Herman Miller"], a: 2 },
    { q: "According to Danilo, design is...",
      opts: ["A luxury", "A hobby", "A conformity", "A necessity"], a: 3 },
    { q: "Which financial planning website did Danilo design and build?",
      opts: ["Vanguard Planning", "Betterment Pro", "Laurel Wealth Planning", "Fidelity Direct"], a: 2 },
    { q: "What does Danilo obsess over in his work?",
      opts: ["Speed over quality", "Every detail", "Dark mode only", "Typography only"], a: 1 },
    { q: "What interactive game is hidden on Danilo's Playground page?",
      opts: ["Chess", "Tetris", "Snake", "Pool / Billiards"], a: 3 },
    { q: "What three pillars guide Danilo's design decisions?",
      opts: ["Speed, budget, trends", "Aesthetics, shadows, fonts", "Usability, business goals, visual clarity", "Color, motion, iconography"], a: 2 },
    { q: "On the Laurel Wealth Planning project, Danilo collaborated with...",
      opts: ["Marija Radulovic", "Jovana Culibrk", "He worked solo", "A full agency"], a: 1 },
  ];

  let quizIdx     = 0;
  let quizScore   = 0;
  let quizAnswers = [];
  let quizOverlay = null;

  const quizBtn = document.getElementById('quizBtn');
  if (quizBtn) {
    quizBtn.addEventListener('click', () => {
      if (poolActive)      { poolActive = false; setBtnText(chaosBtn, "Let's Shoot Some Pool"); stopPool(); }
      if (hotPotatoActive) stopHotPotato();
      quizActive = !quizActive;
      if (quizActive) startQuiz(); else closeQuiz();
    });
  }

  function startQuiz() {
    quizIdx = 0; quizScore = 0; quizAnswers = [];
    quizOverlay = document.createElement('div');
    quizOverlay.className = 'quiz-overlay';
    quizOverlay.id = 'quizOverlay';
    quizOverlay.innerHTML = `
      <div class="quiz-card">
        <button class="quiz-close-btn" id="quizCloseBtn">×</button>
        <div class="quiz-header">
          <span class="quiz-counter" id="qCounter">1 / ${QUIZ_QUESTIONS.length}</span>
          <div class="quiz-prog-wrap"><div class="quiz-prog-fill" id="qProg"></div></div>
          <span class="quiz-score-display" id="qScore">0 pts</span>
        </div>
        <p class="quiz-q" id="qText"></p>
        <div class="quiz-opts" id="qOpts"></div>
      </div>`;
    document.body.appendChild(quizOverlay);
    document.getElementById('quizCloseBtn').addEventListener('click', () => {
      quizActive = false; closeQuiz();
    });
    renderQuestion(0);
  }

  function closeQuiz() {
    quizActive = false;
    if (quizOverlay) { quizOverlay.remove(); quizOverlay = null; }
  }

  function renderQuestion(idx) {
    const q = QUIZ_QUESTIONS[idx];
    document.getElementById('qCounter').textContent  = `${idx + 1} / ${QUIZ_QUESTIONS.length}`;
    document.getElementById('qProg').style.width     = ((idx / QUIZ_QUESTIONS.length) * 100) + '%';
    document.getElementById('qScore').textContent    = quizScore + ' pts';
    document.getElementById('qText').textContent     = q.q;
    const optsEl = document.getElementById('qOpts');
    optsEl.innerHTML = '';
    q.opts.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className   = 'quiz-opt';
      btn.textContent = opt;
      btn.addEventListener('click', () => selectAnswer(i));
      optsEl.appendChild(btn);
    });
  }

  function selectAnswer(chosen) {
    const q    = QUIZ_QUESTIONS[quizIdx];
    const opts = document.querySelectorAll('.quiz-opt');
    opts.forEach(b => b.disabled = true);
    const correct = (chosen === q.a);
    opts[chosen].classList.add(correct ? 'is-correct' : 'is-wrong');
    if (!correct) opts[q.a].classList.add('is-correct');
    if (correct) quizScore++;
    quizAnswers.push({ q: q.q, opts: q.opts, chosen, correct: q.a });
    playTone(correct ? 660 : 180, correct ? 880 : 120, 0.15, 0.18);
    setTimeout(() => {
      quizIdx++;
      if (quizIdx < QUIZ_QUESTIONS.length) {
        renderQuestion(quizIdx);
      } else {
        showQuizResults();
      }
    }, 1200);
  }

  function getScoreLabel() {
    if (quizScore === 10) return "Perfect! You clearly did your research.";
    if (quizScore >= 8)   return "Impressive. You know your stuff.";
    if (quizScore >= 6)   return "Solid effort. Not bad at all.";
    if (quizScore >= 4)   return "Room to grow. Maybe read the portfolio again?";
    return "Time to do some research before that interview.";
  }

  function showQuizResults() {
    const card = quizOverlay.querySelector('.quiz-card');
    card.innerHTML = `
      <button class="quiz-close-btn" id="quizCloseBtn2">×</button>
      <div class="quiz-results">
        <div class="quiz-big-score">${quizScore}<span>/ 10</span></div>
        <span class="quiz-score-label">${getScoreLabel()}</span>
        <div class="quiz-actions">
          <button class="quiz-act-btn quiz-act-btn--green" id="qDownload">Download PDF</button>
          <button class="quiz-act-btn quiz-act-btn--dark" id="qEmail">Email Yourself</button>
          <button class="quiz-act-btn quiz-act-btn--dark" id="qRetry">Try Again</button>
        </div>
      </div>`;
    document.getElementById('quizCloseBtn2').addEventListener('click', () => { quizActive = false; closeQuiz(); });
    document.getElementById('qDownload').addEventListener('click', printQuizResults);
    document.getElementById('qEmail').addEventListener('click', emailQuizResults);
    document.getElementById('qRetry').addEventListener('click', () => { closeQuiz(); quizActive = true; startQuiz(); });
    playTone(440, 880, 0.4, 0.2);
  }

  function printQuizResults() {
    const el = document.createElement('div');
    el.id = 'quizPrint';
    const rows = quizAnswers.map((a, i) => {
      const ok = a.chosen === a.correct;
      return `<div style="margin-bottom:12px;padding:10px 14px;border-radius:8px;background:${ok ? '#f0f5e6' : '#fff0f0'};border-left:3px solid ${ok ? '#8ba444' : '#e05050'}">
        <div style="font-size:12px;font-weight:600;color:#333;margin-bottom:3px;">${i+1}. ${a.q}</div>
        <div style="font-size:11px;color:${ok ? '#6a8a32' : '#e05050'}">${ok ? '✓' : '✗'} ${a.opts[a.chosen]}</div>
      </div>`;
    }).join('');
    el.innerHTML = `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:40px 20px;color:#161518">
      <div style="text-align:center;margin-bottom:28px">
        <div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#999;margin-bottom:12px">Danilo Hinic · Portfolio Quiz</div>
        <div style="font-size:72px;font-weight:700;line-height:1;color:#161518">${quizScore}<span style="font-size:28px;color:#aaa">/10</span></div>
        <div style="font-size:13px;color:#666;margin-top:6px">${getScoreLabel()}</div>
        <div style="font-size:10px;color:#bbb;margin-top:4px">${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</div>
      </div>
      <div style="border-top:1px solid #eee;padding-top:20px">${rows}</div>
      <div style="text-align:center;margin-top:20px;font-size:9px;color:#ccc">danilotools.github.io/portfolio</div>
    </div>`;
    document.body.appendChild(el);
    window.print();
    setTimeout(() => el.remove(), 1200);
  }

  function emailQuizResults() {
    const subj = encodeURIComponent(`Danilo Hinic Quiz — I scored ${quizScore}/10`);
    const body = encodeURIComponent(`I scored ${quizScore}/10 on Danilo Hinic's portfolio quiz!\n\n${getScoreLabel()}\n\nCheck out his portfolio: https://danilotools.github.io/portfolio/`);
    window.open(`mailto:?subject=${subj}&body=${body}`);
  }

  /* ═══════════════════════════════════════════
     HOT POTATO MODE
  ═══════════════════════════════════════════ */
  let hotBlock    = null;
  let hotTimer    = null;
  let hotRaf      = null;
  let hotScore    = 0;
  let hotLives    = 3;
  let hotDuration = 2500;   // ms per round, shrinks on each hit
  let hotStart    = 0;
  let hotHUD      = null;

  const hotBtn = document.getElementById('hotPotatoBtn');
  if (hotBtn) {
    hotBtn.addEventListener('click', () => {
      if (poolActive)  { poolActive  = false; setBtnText(chaosBtn, "Let's Shoot Some Pool"); stopPool(); }
      if (quizActive)  { quizActive  = false; closeQuiz(); }
      hotPotatoActive = !hotPotatoActive;
      if (hotPotatoActive) startHotPotato(); else stopHotPotato();
    });
  }

  function startHotPotato() {
    setBtnText(hotBtn, 'Stop Game');
    hotScore = 0; hotLives = 3; hotDuration = 2500;
    buildHotHUD();
    pickNextHot(null);
    hotRaf = requestAnimationFrame(hotFrame);
  }

  function stopHotPotato() {
    setBtnText(hotBtn, 'Hot Potato');
    hotPotatoActive = false;
    if (hotTimer) { clearTimeout(hotTimer); hotTimer = null; }
    if (hotRaf)   { cancelAnimationFrame(hotRaf); hotRaf = null; }
    clearHotBlock();
    if (hotHUD) { hotHUD.remove(); hotHUD = null; }
  }

  function buildHotHUD() {
    if (hotHUD) hotHUD.remove();
    hotHUD = document.createElement('div');
    hotHUD.className = 'hot-hud';
    hotHUD.id = 'hotHUD';
    document.body.appendChild(hotHUD);
    refreshHUD();
  }

  function refreshHUD() {
    if (!hotHUD) return;
    const dots = '●'.repeat(hotLives) + '○'.repeat(3 - hotLives);
    hotHUD.innerHTML = `
      <span class="hot-score">${hotScore}</span>
      <div class="hot-timer-bar"><div class="hot-timer-fill" id="hotFill"></div></div>
      <span class="hot-lives">${dots}</span>`;
  }

  function clearHotBlock() {
    if (hotBlock) {
      hotBlock.classList.remove('hot-potato-active');
      hotBlock.removeEventListener('click',      onHotClick);
      hotBlock.removeEventListener('touchend',   onHotTouch);
      hotBlock = null;
    }
  }

  function pickNextHot(prev) {
    clearHotBlock();
    const pool = blocks.length > 1 ? blocks.filter(b => b !== prev) : blocks;
    hotBlock = pool[Math.floor(Math.random() * pool.length)];
    hotBlock.classList.add('hot-potato-active');
    hotBlock.addEventListener('click',    onHotClick,  { once: true });
    hotBlock.addEventListener('touchend', onHotTouch,  { once: true });
    hotStart = performance.now();
    if (hotTimer) clearTimeout(hotTimer);
    hotTimer = setTimeout(onHotMiss, hotDuration);
  }

  function onHotTouch(e) {
    e.preventDefault();
    onHotClick(e);
  }

  function onHotClick() {
    if (!hotPotatoActive) return;
    clearTimeout(hotTimer);
    hotScore++;
    hotDuration = Math.max(550, hotDuration - 75);
    playTone(520, 660, 0.07, 0.18);
    refreshHUD();
    pickNextHot(hotBlock);
  }

  function onHotMiss() {
    if (!hotPotatoActive) return;
    hotLives--;
    playTone(130, 65, 0.3, 0.22);
    if (hotLives <= 0) {
      hotPotatoActive = false;
      clearHotBlock();
      if (hotRaf) { cancelAnimationFrame(hotRaf); hotRaf = null; }
      if (hotHUD) { hotHUD.remove(); hotHUD = null; }
      setBtnText(hotBtn, 'Hot Potato');
      const msg = document.createElement('div');
      msg.className = 'chaos-hint';
      msg.innerHTML = `Game over &middot; ${hotScore} pts<span>click Hot Potato to play again</span>`;
      document.body.appendChild(msg);
      setTimeout(() => { msg.style.opacity = '0'; setTimeout(() => msg.remove(), 750); }, 2800);
      return;
    }
    refreshHUD();
    pickNextHot(hotBlock);
  }

  function hotFrame(now) {
    if (!hotPotatoActive) return;
    const fill = document.getElementById('hotFill');
    if (fill) {
      const pct = Math.max(0, 1 - (now - hotStart) / hotDuration);
      fill.style.width = (pct * 100) + '%';
      fill.style.background = pct > 0.4 ? '#c7d59f' : pct > 0.2 ? '#d4a84b' : '#e05050';
    }
    hotRaf = requestAnimationFrame(hotFrame);
  }

})();
