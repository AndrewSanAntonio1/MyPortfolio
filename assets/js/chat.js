/* ============================================================================
   chat.js — the "Ask about me" assistant on the right.
   ----------------------------------------------------------------------------
   It answers from the knowledge base in data.js: no server, no API key, works
   offline and on GitHub Pages. Matching is keyword scoring with a little typo
   tolerance, so visitors get sensible answers to messy questions.

   Want a real LLM behind it later? Set REMOTE_ENDPOINT below to your own
   serverless function (never put an API key in this file — it is public).
   The local knowledge base stays as the fallback if the request fails.
   ========================================================================= */

import { knowledge, chatStarters, profile } from './data.js';
import { md, esc, tidy } from './ui.js';

const REMOTE_ENDPOINT = ''; // e.g. '/api/chat' — leave empty for offline mode.

const $ = (s) => document.querySelector(s);

/* Which section, if any, an answer can offer to jump to. */
const JUMP = {
  skills:    ['skills',   'Jump to Skills'],
  projects:  ['projects', 'See the projects'],
  dashboard: ['projects', 'See the projects'],
  contact:   ['contact',  'Open Contact'],
  hire:      ['contact',  'Open Contact'],
  education: ['about',    'Read About me'],
  math:      ['about',    'Read About me'],
  identity:  ['about',    'Read About me'],
  tools:     ['skills',   'Jump to Skills'],
  learning:  ['works',    'See my Works'],
  site:      ['gallery',  'Open Gallery'],
};

/* ── Matching ──────────────────────────────────────────────────────────── */

/** Levenshtein distance, capped — enough to forgive one typo. */
function editDistance(a, b, cap = 2) {
  if (Math.abs(a.length - b.length) > cap) return cap + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(
        prev[j] + 1,
        row[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      best = Math.min(best, row[j]);
    }
    if (best > cap) return cap + 1; // early exit: it can only get worse
    prev = row;
  }
  return prev[b.length];
}

const STOP = new Set(['the','a','an','is','are','do','does','you','your','me','my',
  'i','what','whats','who','how','can','tell','about','of','and','to','in','for',
  'please','some','any','have','has','been','with','on','it','this','that','so']);

function bestMatch(raw) {
  const q = raw.toLowerCase().replace(/[^\w\s'-]/g, ' ').replace(/\s+/g, ' ').trim();
  const tokens = q.split(' ').filter((t) => t && !STOP.has(t));

  let best = null, bestScore = 0;

  for (const entry of knowledge) {
    let score = 0;
    for (const kw of entry.keywords) {
      const k = kw.toLowerCase();

      if (q.includes(k)) score += k.includes(' ') ? 9 : (k.length > 4 ? 6 : 4);

      for (const t of tokens) {
        if (t === k) score += 5;
        else if (t.length > 3 && k.includes(t)) score += 2;
        else if (k.length > 3 && t.includes(k)) score += 2;
        else if (t.length > 4 && k.length > 4 && editDistance(t, k) <= 1) score += 2;
      }
    }
    if (score > bestScore) { bestScore = score; best = entry; }
  }

  return bestScore >= 4 ? best : null;
}

/* Conversational odds and ends the knowledge base shouldn't have to carry. */
function smallTalk(raw) {
  const q = raw.toLowerCase().trim();
  if (/^(hi|hey|hello|yo|sup|good (morning|afternoon|evening))\b/.test(q))
    return {
      answer: `Hey — good to see you. I'm ${profile.shortName}'s assistant. Ask me about
               his skills, his projects, or how to get in touch.`,
      chips: chatStarters.slice(0, 3),
    };
  if (/(thank|thanks|thx|appreciate|salamat)/.test(q))
    return { answer: `Anytime. Anything else you'd like to know?`, chips: chatStarters.slice(1, 4) };
  if (/^(bye|goodbye|see ya|later|cya)\b/.test(q))
    return { answer: `Take care — and if you'd like to reach ${profile.shortName} directly,
                      his email is **${profile.email}**.`, chips: ['How can I contact you?'] };
  if (/(who (made|built|created) (you|this)|are you (a )?(real|human|ai|bot))/.test(q))
    return {
      answer: `I'm a small assistant ${profile.shortName} wrote by hand — plain JavaScript
               matching your question against a knowledge base in \`data.js\`. No API key,
               no server, works offline. Honest about what it is.`,
      chips: ['How was this site built?', 'What are your skills?'],
    };
  return null;
}

/* ── Panel ─────────────────────────────────────────────────────────────── */
export function initChat() {
  const panel = $('#chatPanel');
  const fab   = $('#chatFab');
  const log   = $('#chatLog');
  const chips = $('#chatChips');
  const form  = $('#chatForm');
  const input = $('#chatInput');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let greeted = false;
  let busy = false;

  const scrollLog = () => { log.scrollTop = log.scrollHeight; };

  function bubble(html, who = 'bot', jump) {
    const el = document.createElement('div');
    el.className = `msg msg--${who}`;
    el.innerHTML = html;

    if (jump) {
      const [id, label] = jump;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'msg__jump';
      btn.innerHTML = `${esc(label)} <svg><use href="#i-arrow"/></svg>`;
      btn.addEventListener('click', () => {
        document.getElementById(id)?.scrollIntoView({
          behavior: reduced ? 'auto' : 'smooth', block: 'start',
        });
        if (innerWidth <= 720) close();
      });
      el.appendChild(btn);
    }

    log.appendChild(el);
    scrollLog();
    return el;
  }

  function setChips(list = []) {
    chips.innerHTML = '';
    list.slice(0, 3).forEach((text) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = text;
      b.addEventListener('click', () => send(text));
      chips.appendChild(b);
    });
  }

  function typing() {
    const el = document.createElement('div');
    el.className = 'msg msg--bot';
    el.innerHTML = `<span class="typing"><i></i><i></i><i></i></span>`;
    log.appendChild(el);
    scrollLog();
    return el;
  }

  /** Optional real-LLM path. Falls back to local matching on any failure. */
  async function askRemote(text) {
    if (!REMOTE_ENDPOINT) return null;
    try {
      const res = await fetch(REMOTE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.reply ? { answer: data.reply, chips: data.chips || [] } : null;
    } catch { return null; }
  }

  async function send(text) {
    const clean = tidy(text);
    if (!clean || busy) return;
    busy = true;

    bubble(esc(clean), 'me');
    input.value = '';
    setChips([]);

    const ghost = typing();

    const local = smallTalk(clean) || (() => {
      const hit = bestMatch(clean);
      if (hit) return { answer: hit.answer, chips: hit.chips || [], jump: JUMP[hit.id] };
      return {
        answer: `I don't have a good answer for that one yet. I'm best on
                 **skills**, **projects**, **education**, **availability** and
                 **contact** — or email ${profile.shortName} directly at
                 **${profile.email}**.`,
        chips: chatStarters.slice(0, 3),
      };
    })();

    const remote = await askRemote(clean);
    const reply = remote || local;

    // A short pause that scales with answer length reads as thinking, not lag.
    const wait = reduced ? 120 : Math.min(1100, 320 + tidy(reply.answer).length * 4);
    await new Promise((r) => setTimeout(r, wait));

    ghost.remove();
    bubble(md(reply.answer), 'bot', reply.jump);
    setChips(reply.chips?.length ? reply.chips : chatStarters);
    busy = false;
  }

  function greet() {
    if (greeted) return;
    greeted = true;
    bubble(md(`Hi — I'm **${profile.shortName}'s assistant**. Ask me anything about his
               skills, projects, studies or availability. I answer from his own notes,
               so nothing here is made up.`), 'bot');
    setChips(chatStarters);
  }

  function open() {
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    fab.classList.add('hide');
    fab.setAttribute('aria-expanded', 'true');
    if (innerWidth <= 720) document.body.classList.add('chat-open');
    greet();
    setTimeout(() => input.focus({ preventScroll: true }), 340);
  }

  function close() {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    fab.classList.remove('hide');
    fab.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('chat-open');
    fab.focus({ preventScroll: true });
  }

  fab.addEventListener('click', open);
  $('#chatClose').addEventListener('click', close);
  form.addEventListener('submit', (e) => { e.preventDefault(); send(input.value); });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('open')) close();
  });

  return { open, close };
}
