/* Scrollable project lightbox, shared by any page with data-gallery-image links. */
(function () {
  const cards = [...document.querySelectorAll('[data-gallery-image]')];
  if (!cards.length) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'project-lightbox';
  dialog.setAttribute('aria-labelledby', 'lightboxTitle');
  dialog.setAttribute('data-lenis-prevent', '');
  dialog.innerHTML = `
    <header class="lightbox-header">
      <div><h2 class="lightbox-title" id="lightboxTitle">Laurel Wealth Planning</h2>
      <p class="lightbox-count" aria-live="polite" aria-atomic="true"></p></div>
      <button class="lightbox-control lightbox-close" type="button" aria-label="Close image gallery" autofocus>Close <span aria-hidden="true">&nbsp;×</span></button>
    </header>
    <div class="lightbox-scroll" tabindex="0" aria-label="Project images — scroll to explore"></div>
    <footer class="lightbox-footer">
      <button class="lightbox-control lightbox-prev" type="button" aria-label="Previous image">←</button>
      <nav class="lightbox-thumbs" aria-label="Image thumbnails"></nav>
      <button class="lightbox-control lightbox-next" type="button" aria-label="Next image">→</button>
    </footer>`;
  const scroller = dialog.querySelector('.lightbox-scroll');
  const thumbBar = dialog.querySelector('.lightbox-thumbs');
  const previous = dialog.querySelector('.lightbox-prev');
  const next = dialog.querySelector('.lightbox-next');
  const count = dialog.querySelector('.lightbox-count');
  const figures = [], thumbs = [];
  let active = 0, opener, oldOverflow;
  cards.forEach((card, i) => {
    const source = card.querySelector('img');
    const figure = document.createElement('figure');
    figure.className = 'lightbox-figure';
    const img = source.cloneNode();
    img.loading = 'lazy';
    const caption = document.createElement('figcaption');
    caption.textContent = `${i + 1} / ${cards.length} — Laurel Wealth Planning`;
    figure.append(img, caption); scroller.append(figure); figures.push(figure);
    const thumb = document.createElement('button');
    thumb.type = 'button'; thumb.className = 'lightbox-thumb';
    thumb.setAttribute('aria-label', `View image ${i + 1}`);
    const thumbnail = source.cloneNode(); thumbnail.alt = ''; thumbnail.loading = 'lazy';
    thumb.append(thumbnail); thumbBar.append(thumb); thumbs.push(thumb);
    thumb.addEventListener('click', () => goTo(i));
    card.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch') return;
      const rect = card.getBoundingClientRect();
      const pill = card.querySelector('.gallery-cursor');
      pill.style.left = `${Math.round(e.clientX - rect.left)}px`;
      pill.style.top = `${Math.round(e.clientY - rect.top)}px`;
    });
    card.addEventListener('click', e => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault(); opener = card;
      oldOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      window.__lenis?.stop();
      dialog.showModal(); goTo(i, 'instant');
    });
  });
  function setActive(i) {
    active = i;
    count.textContent = `${i + 1} of ${cards.length} · Scroll to explore`;
    thumbs.forEach((thumb, n) => thumb.setAttribute('aria-current', String(n === i)));
    previous.disabled = i === 0; next.disabled = i === cards.length - 1;
    const thumb = thumbs[i];
    thumbBar.scrollTo({left: thumb.offsetLeft - thumbBar.offsetLeft - thumbBar.clientWidth / 2 + thumb.clientWidth / 2, behavior: 'instant'});
  }
  function goTo(i, behavior) {
    i = Math.max(0, Math.min(cards.length - 1, i));
    setActive(i);
    const top = figures[i].getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 24;
    scroller.scrollTo({top, behavior: behavior || (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth')});
  }
  let scrollFrame;
  scroller.addEventListener('scroll', () => {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(() => {
      const target = scroller.getBoundingClientRect().top + Math.min(160, scroller.clientHeight / 3);
      let nearest = 0;
      figures.forEach((figure, i) => { if (figure.getBoundingClientRect().top <= target) nearest = i; });
      if (nearest !== active) setActive(nearest);
    });
  }, {passive: true});
  previous.addEventListener('click', () => goTo(active - 1));
  next.addEventListener('click', () => goTo(active + 1));
  dialog.querySelector('.lightbox-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault(); goTo(active + (e.key === 'ArrowRight' ? 1 : -1));
    }
  });
  dialog.addEventListener('close', () => {
    cancelAnimationFrame(scrollFrame);
    document.body.style.overflow = oldOverflow;
    window.__lenis?.start();
    opener?.focus({preventScroll: true});
  });
  document.body.append(dialog);
})();
