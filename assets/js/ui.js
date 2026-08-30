/* ============================================================================
   ui.js — turns data.js into DOM, then wires up every interaction.
   ----------------------------------------------------------------------------
   Nothing here invents content. If a section looks wrong, edit data.js.
   ========================================================================= */

import { profile, about, skills, projects, works, gallery }
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

/* data.js wraps prose to keep the file readable, so a single bullet can span
   several source lines. Rejoin the continuations, then hand back the items —
   or null when the text was never a list to begin with. */
function bulletize(raw) {
  const lines = String(raw).split('\n').map((l) => l.trim()).filter(Boolean);
  if (!lines.some((l) => /^[-*•]\s/.test(l))) return null;

  const items = [];
  lines.forEach((l) => {
    if (/^[-*•]\s/.test(l)) items.push(l.replace(/^[-*•]\s*/, ''));
    else if (items.length) items[items.length - 1] += ` ${l}`;
    else items.push(l);
  });
  return items;
}

/** Full body copy for the detail dialog: a real list when the source uses
 *  "- ", otherwise one paragraph per blank-line-separated block. */
const richText = (raw) => {
  const items = bulletize(raw);
  return items
    ? `<ul class="rt-list">${items.map((i) => `<li>${md(i)}</li>`).join('')}</ul>`
    : String(raw).split(/\n{2,}/).map((p) => `<p>${md(p)}</p>`).join('');
};

/** One-line teaser for a hover state. Cuts on a word boundary, never mid-word. */
const snippet = (raw, max = 132) => {
  const items = bulletize(raw);
  const s = tidy(items ? items[0] : raw);
  return s.length <= max ? s : `${s.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
};

const ACCENTS = {
  mint:   { c: '#64ffda', line: 'rgba(100,255,218,.28)', bg: 'rgba(100,255,218,.07)', glow: 'rgba(100,255,218,.14)' },
  violet: { c: '#a78bfa', line: 'rgba(167,139,250,.32)', bg: 'rgba(167,139,250,.08)', glow: 'rgba(167,139,250,.16)' },
  amber:  { c: '#ffcc70', line: 'rgba(255,204,112,.32)', bg: 'rgba(255,204,112,.08)', glow: 'rgba(255,204,112,.14)' },
  rose:   { c: '#ff7b92', line: 'rgba(255,123,146,.32)', bg: 'rgba(255,123,146,.08)', glow: 'rgba(255,123,146,.14)' },
  blue:   { c: '#7ee8ff', line: 'rgba(126,232,255,.32)', bg: 'rgba(126,232,255,.08)', glow: 'rgba(126,232,255,.15)' },
};

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ══════════════════════════════════════════════════════════════════════════
   REVEAL — one observer, re-scanned after each render pass.
   ══════════════════════════════════════════════════════════════════════ */
const revealed = new WeakSet();
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.classList.add('in');
    revealObserver.unobserve(en.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

function observeReveals() {
  $$('.reveal').forEach((el) => {
    if (revealed.has(el)) return;
    revealed.add(el);
    if (el.dataset.delay) el.style.setProperty('--d', el.dataset.delay);
    if (reduced) el.classList.add('in');
    else revealObserver.observe(el);
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   DETAIL DIALOG — the shared "click for the details" viewer.
   Skills, Projects, Works and Gallery all hand it the same shape, so the focus
   trap, the Escape path and the styling exist exactly once.
     { eyebrow, title, sub, body, tags, links, media, accent, step }
   `body` and `media` are HTML the renderers built; everything sourced from
   data.js has already been through esc() or md() by then.
   ══════════════════════════════════════════════════════════════════════ */
const FOCUSABLE = 'a[href], button:not([disabled]):not([hidden])';

let lastFocus = null;
let stepper = null;   // { prev, next } while a browsable set is open

function openDetail({
  eyebrow = '', title = '', sub = '', body = '',
  tags = [], links = [], media = '', accent = 'mint', step = null,
} = {}) {
  const dlg = $('#detail');
  const a = ACCENTS[accent] || ACCENTS.mint;
  dlg.style.setProperty('--acc', a.c);
  dlg.style.setProperty('--acc-line', a.line);
  dlg.style.setProperty('--acc-bg', a.bg);
  dlg.classList.toggle('detail--media', Boolean(media));

  const fill = (sel, html) => {
    const el = $(sel);
    el.innerHTML = html;
    el.hidden = !html;
  };

  fill('#detailEyebrow', eyebrow ? esc(eyebrow) : '');
  $('#detailTitle').textContent = title;
  fill('#detailSub', sub ? esc(sub) : '');
  fill('#detailText', body);
  fill('#detailTags', tags.map((t) => `<span class="chip">${esc(t)}</span>`).join(''));
  fill('#detailLinks', links.map((l) => (l.href
    ? `<a class="btn ${l.primary ? 'btn--primary' : 'btn--ghost'} btn--sm" href="${esc(l.href)}"
         target="_blank" rel="noopener">${esc(l.label)} <svg><use href="#i-${esc(l.icon || 'external')}"/></svg></a>`
    : `<span class="detail__soon">${esc(l.label)}</span>`)).join(''));

  fill('#detailMedia', media);

  // Stepping is only offered when the caller hands over a set to walk.
  stepper = step;
  $('#detailSteps').hidden = !step;

  // Remember where the visitor was so Escape can put them back.
  const wasOpen = dlg.classList.contains('open');
  if (!wasOpen) lastFocus = document.activeElement;
  dlg.classList.add('open');
  dlg.setAttribute('aria-hidden', 'false');
  document.documentElement.classList.add('dialog-open');

  // New content, so start it from the top either way.
  $('.detail__panel', dlg).scrollTop = 0;
  // Take focus only on a fresh open. Stepping must leave the visitor on the
  // Next button they just pressed, or Enter would close instead of advance.
  if (!wasOpen) $('#detailClose').focus();
}

function closeDetail() {
  const dlg = $('#detail');
  if (!dlg.classList.contains('open')) return;
  dlg.classList.remove('open');
  dlg.setAttribute('aria-hidden', 'true');
  document.documentElement.classList.remove('dialog-open');
  stepper = null;
  lastFocus?.focus();
}

/** Keep Tab inside the dialog while it is open. */
function trapFocus(e) {
  const dlg = $('#detail');
  if (e.key !== 'Tab' || !dlg.classList.contains('open')) return;
  const items = $$(FOCUSABLE, dlg).filter((el) => el.offsetParent !== null);
  if (!items.length) return;

  const first = items[0];
  const last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

function wireDetail() {
  const dlg = $('#detail');
  $('#detailClose').addEventListener('click', closeDetail);
  $('.detail__scrim', dlg).addEventListener('click', closeDetail);
  $('#detailPrev').addEventListener('click', () => stepper?.prev());
  $('#detailNext').addEventListener('click', () => stepper?.next());

  addEventListener('keydown', (e) => {
    if (!dlg.classList.contains('open')) return;
    if (e.key === 'Escape')     { closeDetail(); return; }
    if (e.key === 'ArrowLeft')  { stepper?.prev(); return; }
    if (e.key === 'ArrowRight') { stepper?.next(); return; }
    trapFocus(e);
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

/* Skill groups cycle the palette, so each family reads as its own colour. */
const SKILL_ACCENTS = ['mint', 'violet', 'amber', 'rose'];

const skillAccent = (groupName) => {
  const i = skills.findIndex((g) => g.group === groupName);
  return SKILL_ACCENTS[(i < 0 ? 0 : i) % SKILL_ACCENTS.length];
};

function renderSkills() {
  // One flat marquee of every skill. Levels stay out of it — the name and the
  // family it belongs to are the whole story here.
  const flat = skills.flatMap((group) => group.items.map((item) => ({
    name:  item.name,
    group: group.group,
  })));

  // Tripled so the loop can hand off seamlessly. Copies 2 and 3 are decoration:
  // they are hidden from assistive tech and skipped by Tab, so the visitor
  // tabs through each skill exactly once.
  const chip = (s, clone) => {
    const a = ACCENTS[skillAccent(s.group)];
    return `
      <button class="skill-chip" type="button"
        ${clone ? 'tabindex="-1" aria-hidden="true"' : `aria-label="${esc(s.name)} — open the ${esc(s.group)} family"`}
        data-group="${esc(s.group)}"
        style="--acc:${a.c};--acc-bg:${a.bg};--glow:${a.glow}">
        <span class="skill-chip__name">${esc(s.name)}</span>
        <span class="skill-chip__group">${esc(s.group)}</span>
        <span class="skill-chip__cue" aria-hidden="true">See the family</span>
      </button>`;
  };

  $('#skillsGrid').innerHTML = `
    <div class="skills-scroll-container">
      <div class="skills-track" id="skillsTrack">
        ${flat.map((s) => chip(s, false)).join('')}
        ${flat.map((s) => chip(s, true)).join('')}
        ${flat.map((s) => chip(s, true)).join('')}
      </div>
    </div>`;

  // Any chip — original or clone — opens its whole family.
  $$('.skill-chip').forEach((el) => {
    el.addEventListener('click', () => openSkillGroup(el.dataset.group));
  });
}

/** The full family behind one chip: every sibling skill, no scores attached. */
function openSkillGroup(groupName) {
  const group = skills.find((g) => g.group === groupName);
  if (!group) return;

  const order = skills.map((g) => g.group);
  const at = order.indexOf(groupName);

  openDetail({
    accent: skillAccent(groupName),
    eyebrow: 'Skills',
    title: groupName,
    sub: `${group.items.length} in this family`,
    body: `<ul class="fam">${group.items.map((it) => `<li>${esc(it.name)}</li>`).join('')}</ul>`,
    step: order.length > 1 ? {
      prev: () => openSkillGroup(order[(at - 1 + order.length) % order.length]),
      next: () => openSkillGroup(order[(at + 1) % order.length]),
    } : null,
  });
}

/* ── Gallery cards (Projects + Works) ─────────────────────────────────────
   Both sections share one tile: a resting face you can scan, a summary that
   rises on hover or focus, and a full-bleed button that opens the dialog.
   The heading stays a real <h3>, which is why the hit area is a sibling
   overlay rather than a <button> wrapping everything. */
function gcard({ variant, accent, eyebrow, meta, title, sub, snip, tags, ghost, i, label }) {
  const a = ACCENTS[accent] || ACCENTS.mint;
  return `
  <li class="gcard gcard--${variant} glass reveal" data-delay="${i}" data-i="${i}"
    style="--acc:${a.c};--acc-line:${a.line};--acc-bg:${a.bg};--glow:${a.glow}">
    <div class="gcard__top">
      <span class="gcard__eyebrow">${esc(eyebrow)}</span>
      ${meta ? `<span class="gcard__meta">${esc(meta)}</span>` : ''}
    </div>
    <h3 class="gcard__title">${esc(title)}</h3>
    ${sub ? `<p class="gcard__sub">${esc(sub)}</p>` : ''}
    <span class="gcard__ghost" aria-hidden="true">${esc(ghost)}</span>
    <div class="gcard__peek">
      <p class="gcard__snip">${esc(snip)}</p>
      <div class="chips">${tags.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>
      <span class="gcard__cue">Full details <svg><use href="#i-arrow"/></svg></span>
    </div>
    <button class="gcard__hit" type="button" aria-label="${esc(label)}"></button>
  </li>`;
}

/** Restrained tilt + a glow that follows the pointer. Skipped for reduced motion. */
function wireCardMotion(root) {
  if (reduced) return;
  $$('.gcard', root).forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', `${px * 100}%`);
      card.style.setProperty('--my', `${py * 100}%`);
      card.style.transform =
        `perspective(900px) rotateY(${(px - .5) * 5}deg) rotateX(${(.5 - py) * 4}deg) translateY(-4px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
}

function renderProjects() {
  const grid = $('#projectsGrid');

  grid.innerHTML = projects.map((p, i) => gcard({
    variant: 'project',
    accent: p.accent,
    eyebrow: p.kind,
    meta: p.year,
    title: p.title,
    sub: '',
    snip: snippet(p.blurb),
    tags: p.tech.slice(0, 4),
    ghost: `0${i + 1}`.slice(-2),
    i,
    label: `Open details for ${p.title}`,
  })).join('');

  $$('.gcard__hit', grid).forEach((hit, i) => {
    hit.addEventListener('click', () => openProject(i));
  });
  wireCardMotion(grid);
}

function openProject(i) {
  const p = projects[i];
  openDetail({
    accent: p.accent,
    eyebrow: `${p.kind} · ${p.year}`,
    title: p.title,
    sub: '',
    body: richText(p.blurb),
    tags: p.tech,
    links: [
      p.link ? { label: 'Live demo', href: p.link, icon: 'external', primary: true }
             : { label: 'Demo coming soon' },
      p.repo ? { label: 'Source', href: p.repo, icon: 'github' } : null,
    ].filter(Boolean),
    step: projects.length > 1 ? {
      prev: () => openProject((i - 1 + projects.length) % projects.length),
      next: () => openProject((i + 1) % projects.length),
    } : null,
  });
}

/* Newest first — the most recent role is the one worth reading. */
const workOrder = [...works].reverse();
const WORK_ACCENTS = ['mint', 'violet', 'amber', 'rose'];

/** The year label the user asked to keep: the first year in the period. */
const startYear = (period) => (String(period).match(/\d{4}/) || ['—'])[0];

function renderWorks() {
  const grid = $('#worksGrid');

  grid.innerHTML = workOrder.map((w, i) => gcard({
    variant: 'work',
    accent: WORK_ACCENTS[i % WORK_ACCENTS.length],
    eyebrow: w.period,
    meta: /present/i.test(w.period) ? 'Current' : '',
    title: w.title,
    sub: w.org,
    snip: snippet(w.detail),
    tags: w.tags.slice(0, 4),
    ghost: startYear(w.period),
    i,
    label: `Open details for ${w.title} at ${w.org}`,
  })).join('');

  $$('.gcard__hit', grid).forEach((hit, i) => {
    hit.addEventListener('click', () => openWork(i));
  });
  wireCardMotion(grid);
}

function openWork(i) {
  const w = workOrder[i];
  openDetail({
    accent: WORK_ACCENTS[i % WORK_ACCENTS.length],
    eyebrow: w.period,
    title: w.title,
    sub: w.org,
    body: richText(w.detail),
    tags: w.tags,
    step: workOrder.length > 1 ? {
      prev: () => openWork((i - 1 + workOrder.length) % workOrder.length),
      next: () => openWork((i + 1) % workOrder.length),
    } : null,
  });
}

function renderGallery() {
  const grid = $('#galleryGrid');
  // Spans, not divs: a <button>'s content model is phrasing content only.
  grid.innerHTML = gallery.map((g, i) => `
    <button class="tile reveal${g.span ? ' ' + esc(g.span) : ''}"
            data-delay="${i}" type="button" aria-label="Open ${esc(g.title)} — ${esc(g.caption)}">
      ${g.src
        ? `<img src="${esc(g.src)}" alt="${esc(g.title)}" loading="lazy" decoding="async">`
        : `<span class="tile__ph"><span>${esc(g.title.charAt(0))}</span></span>`}
      <span class="tile__cue" aria-hidden="true"><svg><use href="#i-external"/></svg></span>
      <span class="tile__cap"><b>${esc(g.title)}</b><small>${esc(g.caption)}</small></span>
    </button>`).join('');

  $$('.tile', grid).forEach((tile, i) => {
    tile.addEventListener('click', () => openShot(i));
  });
}

function openShot(i) {
  const g = gallery[i];
  openDetail({
    accent: 'violet',
    eyebrow: `Gallery · ${i + 1} of ${gallery.length}`,
    title: g.title,
    sub: g.caption,
    media: g.src
      ? `<img src="${esc(g.src)}" alt="${esc(g.title)}">`
      : `<span class="tile__ph"><span>${esc(g.title.charAt(0))}</span></span>`,
    step: gallery.length > 1 ? {
      prev: () => openShot((i - 1 + gallery.length) % gallery.length),
      next: () => openShot((i + 1) % gallery.length),
    } : null,
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
  renderContact();
  observeReveals();

  typewriter();
  wireNav(onSection);
  wireCursorGlow();
  wireDetail();

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
