/* ============================================================================
   ui.js — turns data.js into DOM, then wires up every interaction.
   ----------------------------------------------------------------------------
   Nothing here invents content. If a section looks wrong, edit data.js.
   ========================================================================= */

import { profile, about, skills, projects, works, gallery, testimonials }
  from './data.js';

/* ── Shared helpers (chat.js imports these too) ────────────────────────── */

/** Collapse the pretty indentation used by data.js template literals. */
export const tidy = (s) => String(s).replace(/\s+/g, ' ').trim();

/** Escape anything that could be user input before it touches innerHTML. */
export const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** Tiny markdown: **bold**, *italic*, `code`, bare emails. Escapes first. */
export const md = (s) => esc(tidy(s))
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/(^|\s)\*(?!\s)(.+?)\*/g, '$1<em>$2</em>')
  .replace(/`(.+?)`/g, '<code>$1</code>')
  .replace(/([\w.+-]+@[\w-]+\.[\w.]+)/g, '<a href="mailto:$1">$1</a>');

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const ACCENTS = {
  mint:   { c: '#64ffda', line: 'rgba(100,255,218,.28)', bg: 'rgba(100,255,218,.07)', glow: 'rgba(100,255,218,.14)' },
  violet: { c: '#a78bfa', line: 'rgba(167,139,250,.32)', bg: 'rgba(167,139,250,.08)', glow: 'rgba(167,139,250,.16)' },
  amber:  { c: '#ffcc70', line: 'rgba(255,204,112,.32)', bg: 'rgba(255,204,112,.08)', glow: 'rgba(255,204,112,.14)' },
  rose:   { c: '#ff7b92', line: 'rgba(255,123,146,.32)', bg: 'rgba(255,123,146,.08)', glow: 'rgba(255,123,146,.14)' },
};

const FB_KEY = 'portfolio.feedback.v1';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ══════════════════════════════════════════════════════════════════════════
   REVEAL — one observer, re-scanned after each render pass.
   ══════════════════════════════════════════════════════════════════════ */
const revealed = new WeakSet();
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.classList.add('in');
    // Skill bars fill only once they are actually on screen.
    $$('.bar i', en.target).forEach((bar) => { bar.style.width = bar.dataset.w + '%'; });
    revealObserver.unobserve(en.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

function observeReveals() {
  $$('.reveal').forEach((el) => {
    if (revealed.has(el)) return;
    revealed.add(el);
    if (el.dataset.delay) el.style.setProperty('--d', el.dataset.delay);
    if (reduced) {
      el.classList.add('in');
      $$('.bar i', el).forEach((b) => { b.style.width = b.dataset.w + '%'; });
    } else {
      revealObserver.observe(el);
    }
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   RENDERERS
   ══════════════════════════════════════════════════════════════════════ */

function renderHero() {
  $('#heroTagline').textContent = tidy(profile.tagline);

  $('#heroStats').innerHTML = about.stats.map((s, i) => `
    <div class="reveal" data-delay="${6 + i}">
      <dt>${esc(s.value)}</dt>
      <dd>${esc(s.label)}</dd>
    </div>`).join('');

  // Social rail + brand
  $('#railGithub').href   = profile.github  || '#';
  $('#railLinkedin').href = profile.linkedin || '#';
  $('#railMail').href     = `mailto:${profile.email}`;
  $('#year').textContent  = new Date().getFullYear();
  document.title = `${profile.name} — ${profile.roles[0]} & ${profile.roles[1]}`;
}

/* Typewriter through profile.roles. */
function typewriter() {
  const el = $('#typewriter');
  const words = profile.roles;
  if (reduced) { el.textContent = words[0]; return; }

  let w = 0, i = 0, deleting = false;

  (function tick() {
    const word = words[w];
    i += deleting ? -1 : 1;
    el.textContent = word.slice(0, i);

    let wait = deleting ? 45 : 78;
    if (!deleting && i === word.length) { wait = 1700; deleting = true; }
    else if (deleting && i === 0)       { deleting = false; w = (w + 1) % words.length; wait = 320; }

    setTimeout(tick, wait);
  })();
}

function renderAbout() {
  $('#aboutBody').innerHTML = about.paragraphs
    .map((p, i) => `<p class="reveal" data-delay="${i}">${md(p)}</p>`).join('');

  const facts = [
    ['Name',     profile.name],
    ['Focus',    'Back-End Development'],
    ['School',   profile.school],
    ['Based in', profile.location],
    ['Email',    profile.email],
  ];
  $('#aboutFacts').innerHTML = facts
    .map(([k, v]) => `<li><span>${esc(k)}</span><b>${esc(v)}</b></li>`).join('');

  // Swap the card CTA for a real résumé download if one exists.
  if (profile.resume) {
    const a = $('#aboutResume');
    a.href = profile.resume;
    a.setAttribute('download', '');
    a.innerHTML = 'Download CV <svg><use href="#i-download"/></svg>';
  }
}

/* Skill groups cycle the palette, so each card reads as its own family. */
const SKILL_ACCENTS = ['mint', 'violet', 'amber', 'rose'];

function renderSkills() {
  $('#skillsGrid').innerHTML = skills.map((group, g) => {
    const a = ACCENTS[SKILL_ACCENTS[g % SKILL_ACCENTS.length]];
    const items = group.items || [];
    const levels = items.map((s) => Math.max(0, Math.min(100, Number(s.level) || 0)));
    const avg = levels.length
      ? Math.round(levels.reduce((sum, n) => sum + n, 0) / levels.length)
      : 0;

    return `
    <article class="skill-card glass reveal" data-delay="${g}"
      style="--acc:${a.c};--acc-line:${a.line};--acc-bg:${a.bg};--glow:${a.glow};--avg:${avg}">
      <div class="skill-card__head">
        <div class="skill-card__id">
          <h3>${esc(group.group)}</h3>
          <p class="skill-card__meta">${items.length} skill${items.length === 1 ? '' : 's'}</p>
        </div>
        <span class="skill-card__avg" title="Group average">
          <b>${avg}<i aria-hidden="true">%</i></b>
        </span>
      </div>
      <div class="skill-rows">
        ${items.map((s, i) => `
        <div class="skill-row">
          <div class="skill-row__top"><span>${esc(s.name)}</span><i>${levels[i]}%</i></div>
          <div class="bar"><i data-w="${levels[i]}" style="--i:${i}"></i></div>
        </div>`).join('')}
      </div>
    </article>`;
  }).join('');
}

function renderProjects() {
  $('#projectsGrid').innerHTML = projects.map((p, i) => {
    const a = ACCENTS[p.accent] || ACCENTS.mint;
    return `
    <article class="project glass reveal" data-delay="${i}"
      style="--acc:${a.c};--acc-line:${a.line};--acc-bg:${a.bg};--glow:${a.glow}">
      <div class="project__top">
        <span class="project__kind">${esc(p.kind)}</span>
        <span class="project__year">${esc(p.year)}</span>
      </div>
      <h3>${esc(p.title)}</h3>
      <p>${md(p.blurb)}</p>
      <div class="chips">${p.tech.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>
      <div class="project__links">
        ${p.link
          ? `<a href="${esc(p.link)}" target="_blank" rel="noopener">Live demo <svg><use href="#i-external"/></svg></a>`
          : `<span>Demo coming soon</span>`}
        ${p.repo
          ? `<a href="${esc(p.repo)}" target="_blank" rel="noopener">Source <svg><use href="#i-github"/></svg></a>`
          : ''}
      </div>
      <span class="project__idx" aria-hidden="true">0${i + 1}</span>
    </article>`;
  }).join('');

  if (reduced) return;

  // Pointer-following glow + a restrained 3D tilt.
  $$('.project').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', `${px * 100}%`);
      card.style.setProperty('--my', `${py * 100}%`);
      card.style.transform =
        `perspective(900px) rotateY(${(px - .5) * 6}deg) rotateX(${(.5 - py) * 5}deg) translateY(-4px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
}

function renderWorks() {
  $('#timeline').innerHTML = works.map((w, i) => `
    <li class="work reveal" data-delay="${i}">
      <p class="work__period">${esc(w.period)}</p>
      <h3>${esc(w.title)}</h3>
      <p class="work__org">${esc(w.org)}</p>
      <p>${md(w.detail)}</p>
      <div class="chips">${w.tags.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>
    </li>`).join('');
}

function renderGallery() {
  const grid = $('#galleryGrid');
  // Spans, not divs: a <button>'s content model is phrasing content only.
  grid.innerHTML = gallery.map((g, i) => `
    <button class="tile reveal${g.span ? ' ' + esc(g.span) : ''}"
            data-delay="${i}" type="button" aria-label="View ${esc(g.title)}">
      ${g.src
        ? `<img src="${esc(g.src)}" alt="${esc(g.title)}" loading="lazy" decoding="async">`
        : `<span class="tile__ph"><span>${esc(g.title.charAt(0))}</span></span>`}
      <span class="tile__cap"><b>${esc(g.title)}</b><small>${esc(g.caption)}</small></span>
    </button>`).join('');

  $$('.tile', grid).forEach((tile, i) => {
    tile.addEventListener('click', () => openLightbox(i));
  });
}

/* ── Lightbox ─────────────────────────────────────────────────────────── */
let lastFocus = null;

function openLightbox(i) {
  const g = gallery[i];
  lastFocus = document.activeElement;
  $('#lightboxMedia').innerHTML = g.src
    ? `<img src="${esc(g.src)}" alt="${esc(g.title)}">`
    : `<span class="tile__ph"><span>${esc(g.title.charAt(0))}</span></span>`;
  $('#lightboxCap').innerHTML = `<b>${esc(g.title)}</b> — ${esc(g.caption)}`;
  const lb = $('#lightbox');
  lb.classList.add('open');
  lb.setAttribute('aria-hidden', 'false');
  $('#lightboxClose').focus();
}

function closeLightbox() {
  const lb = $('#lightbox');
  lb.classList.remove('open');
  lb.setAttribute('aria-hidden', 'true');
  lastFocus?.focus();
}

/* ── Feedback ─────────────────────────────────────────────────────────── */
const loadLocal = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(FB_KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
};
const saveLocal = (list) => {
  try { localStorage.setItem(FB_KEY, JSON.stringify(list)); } catch { /* private mode */ }
};

function renderFeedback() {
  const local = loadLocal();
  const all = [...local, ...testimonials];
  const list = $('#feedbackList');

  if (!all.length) {
    list.innerHTML = `<div class="empty reveal">
      No feedback yet — yours would be the first. Nothing on this page is invented,
      so this stays empty until someone writes something real.</div>`;
    observeReveals();
    return;
  }

  list.innerHTML = all.map((t, i) => {
    const isLocal = i < local.length;
    const rate = Math.max(0, Math.min(5, Number(t.rating) || 0));
    return `
    <blockquote class="quote glass reveal" data-delay="${i}">
      ${rate ? `<div class="quote__rate" aria-label="${rate} out of 5">
        ${'<svg><use href="#i-star"/></svg>'.repeat(rate)}</div>` : ''}
      <p>${esc(t.quote).replace(/\n+/g, '<br>')}</p>
      <footer>
        <span class="quote__av" aria-hidden="true">${esc((t.name || '?').charAt(0).toUpperCase())}</span>
        <span class="quote__who">
          <b>${esc(t.name || 'Anonymous')}</b>
          ${t.role ? `<small>${esc(t.role)}</small>` : ''}
        </span>
      </footer>
      ${isLocal ? `<button class="quote__del" data-del="${i}" type="button"
        aria-label="Delete this note"><svg><use href="#i-close"/></svg></button>` : ''}
    </blockquote>`;
  }).join('');

  $$('#feedbackList [data-del]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = loadLocal();
      next.splice(Number(btn.dataset.del), 1);
      saveLocal(next);
      renderFeedback();
    });
  });

  observeReveals();
}

function wireFeedbackForm() {
  let rating = 0;
  const stars = $$('#fbStars button');

  const paint = (v) => stars.forEach((s, i) => s.classList.toggle('on', i < v));
  stars.forEach((s) => {
    s.addEventListener('click', () => { rating = Number(s.dataset.v); paint(rating); });
    s.addEventListener('pointerenter', () => paint(Number(s.dataset.v)));
  });
  $('#fbStars').addEventListener('pointerleave', () => paint(rating));

  $('#feedbackForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#fbName').value.trim();
    const role = $('#fbRole').value.trim();
    const quote = $('#fbMsg').value.trim();
    const note = $('#fbNote');

    $('#fbName').closest('.field').classList.toggle('err', !name);
    $('#fbMsg').closest('.field').classList.toggle('err', !quote);

    if (!name || !quote) {
      note.textContent = 'Please add your name and a short message.';
      note.className = 'form-note bad';
      return;
    }

    const list = loadLocal();
    list.unshift({ name, role, quote, rating, at: Date.now() });
    saveLocal(list);

    e.target.reset();
    rating = 0; paint(0);
    note.textContent = 'Thanks — posted. It lives in this browser only.';
    note.className = 'form-note ok';
    renderFeedback();
  });
}

/* ── Contact ──────────────────────────────────────────────────────────── */
function renderContact() {
  const gh = profile.github || '';
  const li = profile.linkedin || '';
  const rows = [
    ['mail',     'Email',    profile.email,                        `mailto:${profile.email}`],
    ['github',   'GitHub',   gh.replace(/^https?:\/\//, '') || 'Not set yet', gh],
    ['linkedin', 'LinkedIn', 'Connect with me',                    li],
    ['pin',      'Location', profile.location,                     ''],
  ];

  $('#contactLinks').innerHTML = rows.map(([icon, label, value, href]) => {
    const inner = `<svg><use href="#i-${icon}"/></svg><b>${esc(value)}</b><small>${esc(label)}</small>`;
    // The location row is information, not a destination — render it as a span.
    return href
      ? `<li><a href="${esc(href)}"${href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${inner}</a></li>`
      : `<li><span class="static">${inner}</span></li>`;
  }).join('');

  // No backend on GitHub Pages, so compose a mail draft instead of pretending.
  $('#contactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#ctName').value.trim();
    const mail = $('#ctEmail').value.trim();
    const subj = $('#ctSubject').value.trim();
    const body = $('#ctMsg').value.trim();
    const note = $('#ctNote');

    const badMail = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail);
    $('#ctName').closest('.field').classList.toggle('err', !name);
    $('#ctEmail').closest('.field').classList.toggle('err', badMail);
    $('#ctMsg').closest('.field').classList.toggle('err', !body);

    if (!name || badMail || !body) {
      note.textContent = 'Please check your name, a valid email, and the message.';
      note.className = 'form-note bad';
      return;
    }

    const subject = subj || `Portfolio enquiry from ${name}`;
    const text = `${body}\n\n— ${name}\n${mail}`;
    location.href =
      `mailto:${profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;

    note.textContent = 'Your mail app should be opening — if not, email me directly.';
    note.className = 'form-note ok';
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   NAVIGATION, SCROLL, POINTER
   ══════════════════════════════════════════════════════════════════════ */
function wireNav(onSection) {
  const nav = $('#nav');
  const links = $$('#navLinks a');
  const ink = $('#navInk');
  const burger = $('#burger');
  const menu = $('#navLinks');

  const closeMenu = () => {
    menu.classList.remove('open');
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  };

  burger.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
  });
  links.forEach((a) => a.addEventListener('click', closeMenu));

  const moveInk = (a) => {
    if (innerWidth <= 860) { ink.classList.remove('on'); return; }
    ink.style.width = `${a.offsetWidth}px`;
    ink.style.transform = `translate(${a.offsetLeft}px, -50%)`;
    ink.classList.add('on');
  };

  const setActive = (id) => {
    const a = links.find((l) => l.getAttribute('href') === `#${id}`);
    if (!a || a.classList.contains('active')) return;
    links.forEach((l) => l.classList.remove('active'));
    a.classList.add('active');
    moveInk(a);
    onSection?.(id);
  };

  // Whichever section straddles the middle of the viewport is "current".
  const sections = $$('main section[data-scene]');
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) setActive(en.target.id); });
  }, { rootMargin: '-45% 0px -55% 0px' });
  sections.forEach((s) => sectionObserver.observe(s));

  addEventListener('resize', () => {
    const a = links.find((l) => l.classList.contains('active'));
    if (a) moveInk(a);
    if (innerWidth > 860) closeMenu();
  });

  // Header state + scroll progress in one rAF-throttled handler.
  const bar = $('#scrollBar');
  let ticking = false;
  const onScrollTick = () => {
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, y / max) : 0;
    bar.style.width = `${p * 100}%`;
    nav.classList.toggle('stuck', y > 24);
    scrollHandlers.forEach((fn) => fn(p));
    ticking = false;
  };
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(onScrollTick);
  }, { passive: true });
  onScrollTick();

  setActive('home');
}

const scrollHandlers = new Set();
export const onScrollProgress = (fn) => scrollHandlers.add(fn);

function wireCursorGlow() {
  if (reduced || matchMedia('(pointer: coarse)').matches) return;
  const glow = $('#cursorGlow');
  document.body.classList.add('has-pointer');
  let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y, raf = 0;

  addEventListener('pointermove', (e) => {
    tx = e.clientX; ty = e.clientY;
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true });

  function loop() {
    x += (tx - x) * 0.12;
    y += (ty - y) * 0.12;
    glow.style.transform = `translate(${x}px, ${y}px)`;
    raf = (Math.abs(tx - x) > 0.4 || Math.abs(ty - y) > 0.4)
      ? requestAnimationFrame(loop) : 0;
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   BOOT
   ══════════════════════════════════════════════════════════════════════ */
export function initUI({ onSection, openChat } = {}) {
  renderHero();
  renderAbout();
  renderSkills();
  renderProjects();
  renderWorks();
  renderGallery();
  renderFeedback();
  renderContact();
  wireFeedbackForm();
  observeReveals();

  typewriter();
  wireNav(onSection);
  wireCursorGlow();

  // Lightbox close paths
  $('#lightboxClose').addEventListener('click', closeLightbox);
  $('#lightbox').addEventListener('click', (e) => {
    if (e.target.id === 'lightbox') closeLightbox();
  });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && $('#lightbox').classList.contains('open')) closeLightbox();
  });

  // "Ask my AI" in the hero opens the chat panel.
  $('#heroAsk').addEventListener('click', () => openChat?.());

  // Smooth-scroll for in-page links, honouring reduced motion.
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      const el = id && document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', `#${id}`);
    });
  });
}
