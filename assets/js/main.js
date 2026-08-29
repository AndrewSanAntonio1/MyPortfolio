/* ============================================================================
   main.js — boot order and the wiring between the page and the 3D scene.
   ----------------------------------------------------------------------------
   1. render the content (instant, no network)
   2. start the AI chat
   3. load Three.js and build the scene — if that fails, the site still works
   4. fade the loader out
   ========================================================================= */

import { initUI, onScrollProgress } from './ui.js';
import { initChat } from './chat.js';

const bar = document.getElementById('loaderBar');
const pct = document.getElementById('loaderPct');
const loader = document.getElementById('loader');

let shown = 0;
function progress(to) {
  shown = Math.max(shown, to);
  bar.style.width = `${shown}%`;
  pct.textContent = `${Math.round(shown)}%`;
}

function finish() {
  progress(100);
  setTimeout(() => {
    loader.classList.add('done');
    document.body.classList.remove('is-loading');
    document.body.classList.add('scene-ready');
  }, 260);
}

async function boot() {
  progress(18);

  const chat = initChat();
  progress(34);

  // Declared before initUI: wireNav fires onSection synchronously during render,
  // so this binding has to already exist (optional chaining covers the null).
  let sceneApi = null;

  // Content first: the page is fully readable before any 3D work starts.
  initUI({
    onSection: (id) => sceneApi?.setSection(id),
    openChat: () => chat.open(),
  });
  progress(58);

  try {
    const { initScene } = await import('./scene.js');
    progress(82);
    sceneApi = initScene(document.getElementById('bg'), { onReady: finish });
    onScrollProgress((p) => sceneApi.setScroll(p));

    // Sync the scene to whatever section we actually landed on (deep links).
    const hash = location.hash.slice(1);
    if (hash) sceneApi.setSection(hash);
  } catch (err) {
    // CDN blocked, offline, or no WebGL — the CSS background carries the design.
    console.warn('3D scene unavailable, continuing without it:', err);
    document.body.classList.add('no-webgl');
    finish();
  }

  // Safety net: never let a stalled asset trap the visitor behind the loader.
  setTimeout(finish, 6000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
