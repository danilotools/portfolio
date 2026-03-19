(function () {
  /* ── Track list ────────────────────────────────────────────────
     SoundHelix samples are free/public — swap in your own files
     whenever you're ready.
  ─────────────────────────────────────────────────────────────── */
  const tracks = [
    {
      title:  'Midnight Drive',
      artist: 'SoundHelix',
      src:    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
    },
    {
      title:  'City Lights',
      artist: 'SoundHelix',
      src:    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3'
    },
    {
      title:  'Morning Fog',
      artist: 'SoundHelix',
      src:    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-17.mp3'
    }
  ];

  /* ── DOM refs ── */
  const elTitle   = document.getElementById('mpTitle');
  const elArtist  = document.getElementById('mpArtist');
  const elPlay    = document.getElementById('mpPlay');
  const elPrev    = document.getElementById('mpPrev');
  const elNext    = document.getElementById('mpNext');
  const elFill    = document.getElementById('mpFill');
  const elBar     = document.getElementById('mpBar');
  const elCur     = document.getElementById('mpCurrent');
  const elDur     = document.getElementById('mpDuration');

  if (!elPlay) return; // player not present on this page

  /* ── SVG icons ── */
  const PLAY_SVG  = `<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2.5l9 5.5-9 5.5z"/></svg>`;
  const PAUSE_SVG = `<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><rect x="3" y="2" width="4" height="12" rx="1.5"/><rect x="9" y="2" width="4" height="12" rx="1.5"/></svg>`;

  /* ── State ── */
  let idx     = 0;
  let playing = false;
  const audio = new Audio();
  audio.preload = 'metadata';

  /* ── Helpers ── */
  function fmt(s) {
    if (!isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  function setPlayIcon(isPlaying) {
    elPlay.innerHTML = isPlaying ? PAUSE_SVG : PLAY_SVG;
    elPlay.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
  }

  function loadTrack(i, autoplay) {
    idx = ((i % tracks.length) + tracks.length) % tracks.length;
    const t = tracks[idx];
    audio.src = t.src;
    audio.load();
    elTitle.textContent  = t.title;
    elArtist.textContent = t.artist;
    elFill.style.width   = '0%';
    elCur.textContent    = '0:00';
    elDur.textContent    = '0:00';
    if (autoplay) {
      audio.play()
        .then(() => { playing = true; setPlayIcon(true); })
        .catch(() => {});
    }
  }

  /* ── Controls ── */
  elPlay.addEventListener('click', () => {
    if (playing) {
      audio.pause();
      playing = false;
      setPlayIcon(false);
    } else {
      audio.play()
        .then(() => { playing = true; setPlayIcon(true); })
        .catch(() => {});
    }
  });

  elPrev.addEventListener('click', () => loadTrack(idx - 1, playing));
  elNext.addEventListener('click', () => loadTrack(idx + 1, playing));

  /* ── Progress ── */
  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    elFill.style.width = (audio.currentTime / audio.duration * 100) + '%';
    elCur.textContent  = fmt(audio.currentTime);
  });

  audio.addEventListener('loadedmetadata', () => {
    elDur.textContent = fmt(audio.duration);
  });

  audio.addEventListener('ended', () => loadTrack(idx + 1, true));

  /* Seek on bar click */
  elBar.addEventListener('click', (e) => {
    if (!audio.duration) return;
    const rect = elBar.getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
  });

  /* ── Load first track (don't autoplay — browser policy) ── */
  loadTrack(0, false);
})();
