/* ─────────────────────────────────────────────
   Project data
───────────────────────────────────────────── */
const PROJECTS = [
  {
    name: 'Hooker Furniture',
    desc: 'Elevating home living through timeless, bold design',
    image: 'https://picsum.photos/seed/hooker101/1200/674',
    iconType: 'frame',
    iconSrc: 'https://www.figma.com/api/mcp/asset/4b7d0ec7-4a7d-45bc-a7de-c03e9b9649d6',
    link: 'project-hooker.html',
  },
  {
    name: 'Laurel Wealth Planning',
    desc: 'Redesigning the whole website from the ground up',
    image: 'https://picsum.photos/seed/laurel202/1200/674',
    iconType: 'laurel',
    iconSrc: 'https://www.figma.com/api/mcp/asset/6e5bbd7c-7f70-4e46-ab62-8fdab9bc2001',
  },
  {
    name: 'Supercluster Studio',
    desc: 'Building tools for the future of creative work',
    image: 'https://picsum.photos/seed/supercluster303/1200/674',
    iconType: 'sc',
    iconSrc: 'https://www.figma.com/api/mcp/asset/8ce9105c-1697-456e-a8ab-79893b0df028',
  },
];

/* ─────────────────────────────────────────────
   DOM refs
───────────────────────────────────────────── */
const card       = document.getElementById('projectCard');
const cardBgImg  = document.getElementById('cardBgImg');
const cardIcon   = document.getElementById('cardIcon');
const cardTitle  = document.getElementById('cardTitle');
const cardDesc   = document.getElementById('cardDesc');
const sliderCount = document.getElementById('sliderCount');
const cursor     = document.getElementById('projectCursor');
const avatarBtns = document.querySelectorAll('.avatar-btn');

let activeIndex = 0;

/* ─────────────────────────────────────────────
   Icon HTML builders (matching Figma specs)
───────────────────────────────────────────── */
function buildCardIcon(project) {
  if (project.iconType === 'frame') {
    return `<img src="${project.iconSrc}" alt="${project.name}" />`;
  }
  if (project.iconType === 'laurel') {
    return `<div class="card-icon-inner-laurel"><img src="${project.iconSrc}" alt="${project.name}" /></div>`;
  }
  if (project.iconType === 'sc') {
    return `<div class="card-icon-inner-sc"><img src="${project.iconSrc}" alt="${project.name}" /></div>`;
  }
  return '';
}

/* ─────────────────────────────────────────────
   Render the active project into the card
───────────────────────────────────────────── */
function renderProject(index) {
  const p = PROJECTS[index];

  cardBgImg.src   = p.image;
  cardTitle.textContent = p.name;
  cardDesc.textContent  = p.desc;
  sliderCount.textContent = `${index + 1} of ${PROJECTS.length}`;

  // icon — class + inner HTML
  cardIcon.className = 'project-icon icon--' + p.iconType;
  cardIcon.innerHTML = buildCardIcon(p);
}

/* ─────────────────────────────────────────────
   Switch project with fade transition
───────────────────────────────────────────── */
function switchProject(index) {
  if (index === activeIndex) return;
  activeIndex = index;

  // fade out
  card.classList.add('is-switching');

  setTimeout(() => {
    renderProject(index);
    card.classList.remove('is-switching');
  }, 250);

  // update active avatar
  avatarBtns.forEach((btn, i) => {
    btn.classList.toggle('active', i === index);
  });
}

/* ─────────────────────────────────────────────
   Avatar click handlers
───────────────────────────────────────────── */
avatarBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    switchProject(Number(btn.dataset.index));
  });
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') switchProject(Number(btn.dataset.index));
  });
});

/* ─────────────────────────────────────────────
   Card click — navigate to project page
───────────────────────────────────────────── */
card.addEventListener('click', () => {
  const link = PROJECTS[activeIndex].link;
  if (link) window.location.href = link;
});

/* ─────────────────────────────────────────────
   Custom cursor — follows mouse inside card
───────────────────────────────────────────── */
card.addEventListener('mousemove', (e) => {
  const rect = card.getBoundingClientRect();
  // Round to nearest integer — prevents subpixel blurring on the pill text
  const x = Math.round(e.clientX - rect.left);
  const y = Math.round(e.clientY - rect.top);
  cursor.style.left = x + 'px';
  cursor.style.top  = y + 'px';
});

/* ─────────────────────────────────────────────
   Init — render first project immediately
───────────────────────────────────────────── */
renderProject(0);

/* ─────────────────────────────────────────────
   Scroll-based entrance — about section
───────────────────────────────────────────── */
const aboutText   = document.querySelector('.about-text');
const metricWraps = document.querySelectorAll('.metric-wrap');

// Fires once when each element crosses into the viewport
const onceVisible = (el, callback) => {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback(el);
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.15 });
  obs.observe(el);
};

// About text — fade up
onceVisible(aboutText, (el) => el.classList.add('in-view'));

// CTA section — fade up
const ctaSection = document.querySelector('.cta-section');
if (ctaSection) onceVisible(ctaSection, (el) => el.classList.add('in-view'));

// Metric cards — staggered entrance
metricWraps.forEach((wrap, i) => {
  onceVisible(wrap, (el) => {
    // propagate delay to the inner .metric via CSS custom property
    el.querySelector('.metric').style.animationDelay = `${i * 0.12}s`;
    el.classList.add('in-view');
  });
});

/* ─────────────────────────────────────────────
   GIF cursor follower
   Replace the data-gif URLs in index.html with
   your actual GIF file paths when ready.
───────────────────────────────────────────── */
const gifFollower = document.getElementById('gifFollower');
const gifImg      = document.getElementById('gifImg');

// Move follower with the mouse globally
document.addEventListener('mousemove', (e) => {
  gifFollower.style.left = e.clientX + 'px';
  gifFollower.style.top  = e.clientY + 'px';
});

document.querySelectorAll('.gif-trigger').forEach((el) => {
  el.addEventListener('mouseenter', () => {
    gifImg.src = el.dataset.gif;
    gifFollower.classList.add('visible');
  });
  el.addEventListener('mouseleave', () => {
    gifFollower.classList.remove('visible');
  });
});
