# Andrew Jr. F. San Antonio — 3D Portfolio

A hand-built portfolio: Three.js WebGL scene, vanilla ES modules, no bundler,
no framework, no build step. Deploys to GitHub Pages as-is.

## Editing content

**You only ever need to edit one file: [`assets/js/data.js`](assets/js/data.js).**

Everything on the page — hero, about, skills, projects, works, gallery and the
AI chat's answers — is read from there. Keep the quotes, commas and brackets
intact and it is safe to edit from your phone.

| Want to change… | Edit this export in `data.js` |
|---|---|
| Name, roles, tagline, email, links | `profile` |
| About paragraphs and the stat row | `about` |
| Skill groups and their skills | `skills` |
| Project cards | `projects` |
| Works entries | `works` |
| Gallery tiles | `gallery` |
| What the AI chat knows | `knowledge` |
| Chat's starter buttons | `chatStarters` |

### Adding a real gallery photo
1. Drop the file into `assets/img/` — e.g. `assets/img/setup.jpg`
2. In `data.js`, set `src: 'assets/img/setup.jpg'`

Leaving `src: ''` renders a generated gradient tile, so the gallery never looks
broken while you collect photos.

### Adding your CV
Drop a PDF in `assets/`, then set `resume: 'assets/your-cv.pdf'` in `profile`.
The About card's button turns into a download link automatically.

## Running it locally

The site uses ES modules, which browsers **block over `file://`**. Double-clicking
`index.html` will show a hint explaining this. Serve it instead:

```bash
npx serve          # then open the URL it prints
# or
python -m http.server 8000
```

On GitHub Pages no server setup is needed — it works directly.

## Structure

```
index.html                 markup, icon sprite, import map
assets/css/style.css       design system, layout, animation
assets/js/data.js          ← all content lives here
assets/js/scene.js         Three.js scene (blocky avatar, studded brick, starfield)
assets/js/ui.js            renders data → DOM, nav, reveals, forms
assets/js/chat.js          the AI assistant
assets/js/main.js          boot order
```

## The AI chat

Runs entirely in the browser: it scores your question against the `knowledge`
keywords in `data.js`, with light typo tolerance. No server, no API key, works
offline. More entries in `knowledge` = a smarter assistant.

To put a real LLM behind it later, set `REMOTE_ENDPOINT` at the top of
`chat.js` to your own serverless function. The local knowledge base stays as the
fallback if the request fails. **Never put an API key in these files** — they are
public. The key belongs in the serverless function's environment.

## Browsing Skills, Projects, Works and Gallery

All four sections share one interaction: **hover** (or focus, or tap on touch) to
reveal the summary on the card, then **click** to open the full details in a
single dialog. Skills chips open their whole family; Projects, Works and Gallery
shots step through with the Previous/Next buttons or the ← → arrow keys. Escape
or the ✕ closes.

## Notes on behaviour

- **The 3D character** — a blocky, Roblox-*styled* avatar built from boxes in
  `scene.js`. Each section sets its pose, outfit colour, facing and camera in the
  `MOODS` and `POSES` tables at the top of that file — those two tables are the
  whole choreography. The look is a homage: Roblox is someone else's trademark,
  so keep their logo and branding out of it.
- **Reduced motion** — visitors with `prefers-reduced-motion` get one static
  frame, no typewriter and no reveal animation.
- **Performance** — device pixel ratio capped at 1.75, particle count halved on
  small screens, shadows desktop-only, rendering paused while the tab is hidden.
- **No WebGL / CDN blocked** — the scene is skipped and the CSS gradient
  background carries the design. The site stays fully usable.
