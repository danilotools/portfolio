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
  let poolActive   = false;
  let puzzleActive = false;
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
    if (poolActive || puzzleActive) return;
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
      poolActive = !poolActive;
      chaosBtn.textContent = poolActive ? 'Stop the game' : "🎱 Let's Shoot Some Pool";
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
     PUZZLE MODE — image-by-image progression
  ═══════════════════════════════════════════ */
  const PUZZLE_COLS  = 3;
  const PUZZLE_ROWS  = 3;
  const PUZZLE_N     = 9;
  const PUZZLE_TOTAL = 6;
  const SNAP_DIST    = 52;
  const SESSION_KEY  = 'pgPuzzleProgress';
  const PUZZLE_IMAGES = [
    'images/playground/01-tap-hero.webp',
    'images/playground/02-tap-bento.webp',
    'images/playground/03-humnet.webp',
    'images/playground/04-LWP-6.webp',
    'images/playground/05-upliasection.webp',
    'images/playground/06-ASF-section.webp',
  ];

  let puzzleSolved  = 0;
  let puzzleImgIdx  = 0;
  let puzzleGhostEl = null;
  let PIECE_W = 0, PIECE_H = 0, pGridX = 0, pGridY = 0;
  let pzPiece = null, pzMx0 = 0, pzMy0 = 0, pzLeft0 = 0, pzTop0 = 0;

  const puzzleBtn = document.getElementById('puzzleBtn');
  if (puzzleBtn) {
    puzzleBtn.addEventListener('click', () => {
      if (poolActive) { poolActive = false; chaosBtn.textContent = "🎱 Let's Shoot Some Pool"; stopPool(); }
      puzzleActive = !puzzleActive;
      puzzleBtn.textContent = puzzleActive ? 'Stop Puzzle' : '🧩 Put It Together';
      puzzleActive ? startPuzzle() : stopPuzzle(true);
    });
  }

  function getPuzzleProgress() {
    try { return Math.min(parseInt(sessionStorage.getItem(SESSION_KEY) || '0', 10), PUZZLE_TOTAL); }
    catch(e) { return 0; }
  }
  function setPuzzleProgress(n) {
    try { sessionStorage.setItem(SESSION_KEY, String(n)); } catch(e) {}
  }

  function calcPuzzleGrid() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const availW = Math.min(vw * 0.68, 540);
    PIECE_W = Math.floor(availW / PUZZLE_COLS);
    PIECE_H = Math.floor(PIECE_W * 0.66);
    const gW = PUZZLE_COLS * PIECE_W, gH = PUZZLE_ROWS * PIECE_H;
    pGridX = Math.floor((vw - gW) / 2);
    pGridY = Math.floor(headerH + (vh - headerH - 80 - gH) / 2);
  }

  function startPuzzle() {
    let saved = getPuzzleProgress();
    if (saved >= PUZZLE_TOTAL) { saved = 0; setPuzzleProgress(0); }
    puzzleImgIdx = saved;
    createProgressBar();
    loadPuzzleImage(puzzleImgIdx);
  }

  function loadPuzzleImage(idx) {
    calcPuzzleGrid();
    puzzleSolved = 0;
    const imgSrc = PUZZLE_IMAGES[idx];

    if (puzzleGhostEl) { puzzleGhostEl.remove(); puzzleGhostEl = null; }
    puzzleGhostEl = document.createElement('div');
    puzzleGhostEl.className = 'puzzle-ghost';
    for (let i = 0; i < PUZZLE_N; i++) {
      const c = i % PUZZLE_COLS, r = Math.floor(i / PUZZLE_COLS);
      const cell = document.createElement('div');
      cell.className = 'puzzle-ghost-cell';
      cell.id = 'pgc-' + i;
      cell.style.cssText = `left:${pGridX + c * PIECE_W}px;top:${pGridY + r * PIECE_H}px;width:${PIECE_W}px;height:${PIECE_H}px;`;
      puzzleGhostEl.appendChild(cell);
    }
    document.body.appendChild(puzzleGhostEl);
    requestAnimationFrame(() => puzzleGhostEl.classList.add('active'));

    document.getElementById('puzzleThumb')?.remove();
    const thumb = document.createElement('img');
    thumb.src = imgSrc;
    thumb.className = 'puzzle-thumb';
    thumb.id = 'puzzleThumb';
    document.body.appendChild(thumb);

    blocks.slice(PUZZLE_N).forEach(b => {
      b.style.transition = 'opacity .2s';
      b.style.opacity = '0';
      b.style.pointerEvents = 'none';
    });

    const vw = window.innerWidth, vh = window.innerHeight;
    blocks.slice(0, PUZZLE_N).forEach((bl, i) => {
      bl.removeEventListener('mousedown',  onPieceDown);
      bl.removeEventListener('touchstart', onPieceDown);
      bl.classList.remove('pz-solved');

      const col = i % PUZZLE_COLS, row = Math.floor(i / PUZZLE_COLS);
      bl.classList.add('puzzle-piece');
      bl.style.width  = PIECE_W + 'px';
      bl.style.height = PIECE_H + 'px';
      bl.style.backgroundImage    = `url('${imgSrc}')`;
      bl.style.backgroundSize     = `${PUZZLE_COLS * PIECE_W}px ${PUZZLE_ROWS * PIECE_H}px`;
      bl.style.backgroundPosition = `-${col * PIECE_W}px -${row * PIECE_H}px`;
      bl._puzzleIdx    = i;
      bl._puzzleSolved = false;

      let sx, sy, tries = 0;
      do {
        const m = 20;
        sx = m + Math.random() * Math.max(0, vw - PIECE_W - m * 2);
        sy = headerH + m + Math.random() * Math.max(0, vh - headerH - PIECE_H - 80);
        tries++;
      } while (
        tries < 25 &&
        sx + PIECE_W > pGridX - 20 && sx < pGridX + PUZZLE_COLS * PIECE_W + 20 &&
        sy + PIECE_H > pGridY - 20 && sy < pGridY + PUZZLE_ROWS * PIECE_H + 20
      );

      const delay = i * 55;
      bl.style.opacity   = '1';
      bl.style.zIndex    = String(10 + i);
      bl.style.transition = `left .45s ${delay}ms cubic-bezier(.16,1,.3,1),top .45s ${delay}ms cubic-bezier(.16,1,.3,1),transform .45s ${delay}ms cubic-bezier(.16,1,.3,1)`;
      bl.style.left      = sx + 'px';
      bl.style.top       = sy + 'px';
      bl.style.transform = `rotate(${(Math.random() - 0.5) * 16}deg)`;
      setTimeout(() => { bl.style.transition = ''; }, 460 + delay);

      bl.addEventListener('mousedown',  onPieceDown);
      bl.addEventListener('touchstart', onPieceDown, { passive: false });
    });

    updateProgressBar();
    showPuzzleTip();
  }

  function createProgressBar() {
    document.getElementById('puzzleBar')?.remove();
    const bar = document.createElement('div');
    bar.id = 'puzzleBar';
    bar.className = 'puzzle-progress-bar';
    bar.innerHTML = '<div class="pzb-track"><div class="pzb-fill" id="pzbFill"></div></div><span class="pzb-label" id="pzbLabel"></span>';
    document.body.appendChild(bar);
    updateProgressBar();
  }

  function updateProgressBar() {
    const fill  = document.getElementById('pzbFill');
    const label = document.getElementById('pzbLabel');
    if (!fill || !label) return;
    const done = getPuzzleProgress();
    fill.style.width  = (done / PUZZLE_TOTAL * 100) + '%';
    label.textContent = done + ' / ' + PUZZLE_TOTAL;
  }

  function stopPuzzle(doScatter) {
    puzzleActive = false;
    if (puzzleGhostEl) { puzzleGhostEl.remove(); puzzleGhostEl = null; }
    document.getElementById('puzzleThumb')?.remove();
    document.getElementById('puzzleBar')?.remove();

    blocks.slice(0, PUZZLE_N).forEach(bl => {
      bl.classList.remove('puzzle-piece', 'pz-solved');
      bl.removeEventListener('mousedown',  onPieceDown);
      bl.removeEventListener('touchstart', onPieceDown);
      bl.style.backgroundImage    = '';
      bl.style.backgroundSize     = '';
      bl.style.backgroundPosition = '';
      bl._puzzleSolved = false;
      const img = bl.querySelector('img');
      if (img) img.style.opacity = '';
    });
    blocks.slice(PUZZLE_N).forEach(b => { b.style.opacity = '1'; b.style.pointerEvents = ''; });

    if (doScatter) {
      const vw = window.innerWidth, vh = window.innerHeight;
      blocks.forEach(bl => {
        bl.style.width  = bl._origWidth  || '';
        bl.style.height = bl._origHeight || '';
        const bw = bl.offsetWidth, bh = bl.offsetHeight;
        const m = 24, rot = (Math.random() - 0.5) * 24;
        bl._rot = rot;
        const x = m + Math.random() * Math.max(0, vw - bw - m * 2);
        const y = headerH + m + Math.random() * Math.max(0, vh - headerH - bh - m * 2);
        bl.style.transition = 'left .55s cubic-bezier(.16,1,.3,1),top .55s cubic-bezier(.16,1,.3,1),transform .55s cubic-bezier(.16,1,.3,1)';
        bl.style.left      = x + 'px';
        bl.style.top       = y + 'px';
        bl.style.transform = `rotate(${rot}deg)`;
        setTimeout(() => { bl.style.transition = ''; }, 620);
      });
    }
  }

  function onPieceDown(e) {
    if (!puzzleActive) return;
    const bl = e.currentTarget;
    if (bl._puzzleSolved) return;
    e.preventDefault(); e.stopPropagation();
    const { x, y } = getXY(e);
    pzPiece = bl; pzMx0 = x; pzMy0 = y;
    pzLeft0 = parseFloat(bl.style.left) || 0;
    pzTop0  = parseFloat(bl.style.top)  || 0;
    bl.style.zIndex    = String(++topZ);
    bl.style.transform = 'scale(1.06) rotate(0deg)';
    playPickup();
    window.addEventListener('mousemove', onPieceMove);
    window.addEventListener('mouseup',   onPieceUp);
    window.addEventListener('touchmove', onPieceMove, { passive: false });
    window.addEventListener('touchend',  onPieceUp);
  }

  function onPieceMove(e) {
    if (!pzPiece) return;
    e.preventDefault();
    const { x, y } = getXY(e);
    pzPiece.style.left = (pzLeft0 + x - pzMx0) + 'px';
    pzPiece.style.top  = (pzTop0  + y - pzMy0) + 'px';
  }

  function onPieceUp() {
    if (!pzPiece) return;
    const bl = pzPiece;
    pzPiece = null;
    window.removeEventListener('mousemove', onPieceMove);
    window.removeEventListener('mouseup',   onPieceUp);
    window.removeEventListener('touchmove', onPieceMove);
    window.removeEventListener('touchend',  onPieceUp);

    const idx  = bl._puzzleIdx;
    const col  = idx % PUZZLE_COLS, row = Math.floor(idx / PUZZLE_COLS);
    const tx   = pGridX + col * PIECE_W, ty = pGridY + row * PIECE_H;
    const cx   = parseFloat(bl.style.left) + PIECE_W / 2;
    const cy   = parseFloat(bl.style.top)  + PIECE_H / 2;
    const dist = Math.hypot(cx - (tx + PIECE_W / 2), cy - (ty + PIECE_H / 2));

    if (dist < SNAP_DIST) {
      bl.style.transition = 'left .16s ease-out,top .16s ease-out,transform .16s ease-out';
      bl.style.left      = tx + 'px';
      bl.style.top       = ty + 'px';
      bl.style.transform = 'none';
      bl.style.zIndex    = '6';
      bl._puzzleSolved   = true;
      bl.classList.add('pz-solved');
      setTimeout(() => { bl.style.transition = ''; }, 180);
      const cell = document.getElementById('pgc-' + idx);
      if (cell) cell.classList.add('filled');
      playDrop();
      if (++puzzleSolved === PUZZLE_N) onImageComplete();
    } else {
      bl.style.transform = `rotate(${(Math.random() - 0.5) * 10}deg)`;
    }
  }

  function onImageComplete() {
    [330, 440, 550, 660, 880].forEach((f, i) =>
      setTimeout(() => playTone(f, f * 1.05, 0.22, 0.18), i * 100)
    );
    const newDone = puzzleImgIdx + 1;
    setPuzzleProgress(newDone);
    updateProgressBar();

    if (newDone >= PUZZLE_TOTAL) {
      const msg = document.createElement('div');
      msg.className = 'chaos-hint';
      msg.textContent = 'All done! 🏆';
      document.body.appendChild(msg);
      setTimeout(() => {
        msg.style.opacity = '0';
        setTimeout(() => msg.remove(), 700);
        puzzleBtn.textContent = '🧩 Put It Together';
        stopPuzzle(true);
      }, 2800);
    } else {
      const msg = document.createElement('div');
      msg.className = 'chaos-hint';
      msg.textContent = newDone + ' / ' + PUZZLE_TOTAL + ' ✓';
      document.body.appendChild(msg);
      setTimeout(() => { msg.style.opacity = '0'; setTimeout(() => msg.remove(), 600); }, 1300);

      setTimeout(() => {
        puzzleImgIdx = newDone;
        blocks.slice(0, PUZZLE_N).forEach((bl, i) => {
          bl.removeEventListener('mousedown',  onPieceDown);
          bl.removeEventListener('touchstart', onPieceDown);
          const d = i * 35;
          bl.style.transition = `transform .3s ${d}ms ease-in, opacity .28s ${d}ms ease-in`;
          bl.style.transform = 'scale(0) rotate(200deg)';
          bl.style.opacity   = '0';
          setTimeout(() => { bl.style.transition = ''; }, 340 + d);
        });
        setTimeout(() => loadPuzzleImage(puzzleImgIdx), 520);
      }, 1700);
    }
  }

  function showPuzzleTip() {
    if (chaosTip) chaosTip.remove();
    chaosTip = document.createElement('div');
    chaosTip.className = 'chaos-hint';
    chaosTip.innerHTML = `Image ${puzzleImgIdx + 1} of ${PUZZLE_TOTAL} — drag pieces to rebuild<span>Drop near the correct spot to snap &middot; Click to dismiss</span>`;
    document.body.appendChild(chaosTip);
    setTimeout(() => { document.addEventListener('click', dismissTip, { once: true }); }, 500);
  }

  function dismissTip() {
    if (!chaosTip) return;
    chaosTip.style.opacity = '0';
    setTimeout(() => { if (chaosTip) { chaosTip.remove(); chaosTip = null; } }, 850);
  }

})();
