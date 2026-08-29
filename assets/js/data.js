/* ============================================================================
   data.js — ALL YOUR PORTFOLIO CONTENT LIVES HERE.
   ----------------------------------------------------------------------------
   This is the only file you need to edit to update your site.
   Everything else (layout, 3D, animation) reads from here.

   Safe to edit from your phone or GitHub Desktop — just keep the quotes,
   commas and brackets intact.
   ========================================================================= */

export const profile = {
  name: 'Andrew Jr. F. San Antonio',
  shortName: 'Andrew',
  // Shown one-after-another in the animated hero typewriter.
  roles: [
    'Java Developer',
    'Back-End Specialist',
    'Web Developer',
    'Mathematics',
    'Cybersecurity',
    'Frontend Developer'
  ],
  tagline: 'I build clean, logical back-ends and the interfaces that make them feel effortless.',
  location: 'Philippines',
  school: 'Jose Rizal University',
  email: 'drewsanantonio06@gmail.com',
  // TODO: paste your real LinkedIn + GitHub URLs here.
  linkedin: 'https://www.linkedin.com/andrew-jr-f-san-antonio-1329b7379/',
  github: 'https://github.com/AndrewSanAntonio1',
  // Optional: drop a PDF at assets/Andrew-San-Antonio-CV.pdf and it will link up.
  resume: '',
};

export const about = {
  paragraphs: [
    `I'm a Java developer and BSIT student at Jose Rizal University with a
     growing specialisation in web development. My foundation is logical reasoning and
     critical thinking, and I lean on both to break complex programming problems into
     pieces small enough to solve cleanly.`,
    `Mathematics is where I'm strongest — it trained me to think in systems, spot the
     efficient path, and care about correctness before cleverness. I bring that same
     discipline to code: readable structure, predictable behaviour, no wasted moves.`,
    `Right now I'm focused on deepening my back-end craft while learning to design
     front-ends that respect the engineering underneath. I'm looking for real-world
     projects where creativity and technical precision have to meet.`,
  ],
  stats: [
    { value: '5+',  label: 'Languages written' },
    { value: '5',   label: 'Shipped projects' },
    { value: 'JRU', label: 'BSIT' },
    { value: '∞',   label: 'Still learning' },
  ],
};

/* --- SKILLS -----------------------------------------------------------------
   level: 0-100. Be honest — it reads better than inflated bars.
--------------------------------------------------------------------------- */
export const skills = [
  {
    group: 'Languages',
    icon: 'code',
    items: [
      { name: 'Java',       level: 100 },
      { name: 'JavaScript (ES6+)', level: 78 },
      { name: 'Python',      level: 60 },
      { name: 'Gdscript',       level: 57 },
      { name: 'C',          level: 70 },
    ],
  },
  {
    group: 'Frameworks & Libraries',
    icon: 'layers',
    items: [
      { name: 'React',        level: 70 },
      { name: 'Next.js',      level: 62 },
      { name: 'Tailwind CSS', level: 75 },
      { name: 'Node.js',      level: 68 },
      { name: 'Express.js',      level: 68 },
      { name: 'Spring Boot',      level: 68 },
    ],
  },
  {
    group: 'Tools & Platforms',
    icon: 'tool',
    items: [
      { name: 'Git & GitHub', level: 85 },
      { name: 'VS Code',      level: 90 },
      { name: 'Postman',      level: 89 },
      { name: 'Figma',        level: 60 },
      { name: 'Webpack',      level: 55 },
      { name: 'Claude',      level: 78 },
      { name: 'OpenAI',      level: 50 },
      { name: 'AgenticAI',      level: 45 },
      { name: 'Jira',      level: 75 },
      { name: 'Maven',      level: 100 },
      { name: 'Gradle',      level: 100 },
    ],
  },
  {
    group: 'Game Dev',
    icon: 'game',
    items: [
      { name: 'Roblox Studio', level: 85 },
      { name: 'Blender', level: 85 },
      { name: 'Godot', level: 75 },
    ],
  },
  {
    group: 'Foundations',
    icon: 'brain',
    items: [
      { name: 'Mathematics',       level: 92 },
      { name: 'Logical reasoning', level: 90 },
      { name: 'Data structures',   level: 54 },
      { name: 'Problem solving',   level: 88 },
    ],
  },
];

/* --- PROJECTS ---------------------------------------------------------------
   link: leave '' to render the button as disabled ("Coming soon").
--------------------------------------------------------------------------- */
export const projects = [
  {
    title: 'Personal Portfolio Website',
    year: '2025',
    kind: 'Front-End',
    blurb: `A responsive portfolio built with HTML, CSS and JavaScript to present my
            skills, projects and experience. Fully responsive across desktop and mobile,
            with a workflow driven by GitHub for version control — commits from GitHub
            Desktop on my laptop, plus quick fixes straight from my phone.`,
    tech: ['HTML5', 'CSS3', 'JavaScript', 'Git', 'GitHub Pages'],
    link: '',
    repo: 'https://github.com/AndrewSanAntonio1',
    accent: 'mint',
  },
  {
    title: 'Interactive Data Dashboard',
    year: '2025',
    kind: 'Data Visualisation',
    blurb: `An interactive dashboard built with JavaScript and Chart.js delivering
            real-time data visualisation. Dynamic charts and graphs let users read
            trends quickly, with a layout that stays legible as datasets grow.`,
    tech: ['JavaScript', 'Chart.js', 'REST APIs', 'CSS Grid'],
    link: '',
    repo: '',
    accent: 'violet',
  },
];

/* --- WORKS / TIMELINE ------------------------------------------------------
   "Works" = the road so far: study, milestones, practice, experience.
--------------------------------------------------------------------------- */
export const works = [
  {
    period: 'Present',
    title: 'Computer Science Student',
    org: 'Jose Rizal University',
    detail: `Studying software development with an emphasis on Java, data structures and
             the mathematics behind them. Consistently drawn to the problems that need a
             proof before they need a patch.`,
    tags: ['Java', 'Data Structures', 'Mathematics'],
  },
  {
    period: '2025',
    title: 'Back-End Practice — Java',
    org: 'Self-directed',
    detail: `Building small services and console applications in Java to internalise OOP,
             collections and clean layering. Focus on writing code that a future me can
             still read.`,
    tags: ['Java', 'OOP', 'Algorithms'],
  },
  {
    period: '2025',
    title: 'Front-End Foundations',
    org: 'Self-directed',
    detail: `Moved from static pages to component thinking — semantic HTML, modern CSS
             layout, and JavaScript that stays out of its own way. This site is part of
             that work.`,
    tags: ['JavaScript', 'CSS', 'Responsive Design'],
  },
  {
    period: '2024',
    title: 'Version Control Workflow',
    org: 'GitHub',
    detail: `Adopted Git properly: branches, meaningful commits, and a deploy pipeline
             through GitHub Pages that I can drive from a laptop or a phone.`,
    tags: ['Git', 'GitHub', 'CI/CD'],
  },
];

/* --- GALLERY ---------------------------------------------------------------
   HOW TO ADD A REAL IMAGE:
     1. Drop the file into assets/img/  (e.g. assets/img/setup.jpg)
     2. Set  src: 'assets/img/setup.jpg'
   Leave src as '' and a clean generated gradient tile is shown instead —
   so the gallery never looks broken while you gather photos.
--------------------------------------------------------------------------- */
export const gallery = [
  { src: '', title: 'Workspace',        caption: 'Where the compiling happens',      span: 'wide' },
  { src: '', title: 'Whiteboard Math',  caption: 'Proof before code',                span: 'tall' },
  { src: '', title: 'Dashboard Build',  caption: 'Chart.js in progress',             span: '' },
  { src: '', title: 'Campus',           caption: 'Jose Rizal University',            span: '' },
  { src: '', title: 'Late Commits',     caption: 'Shipping from the phone',          span: '' },
  { src: '', title: 'First Deploy',     caption: 'GitHub Pages going live',          span: 'wide' },
];

/* --- FEEDBACK -------------------------------------------------------------
   Starts empty on purpose — nothing here is invented.
   Real messages left through the form appear automatically.
   To feature a quote permanently, add it here:
     { name: 'Ada Lovelace', role: 'Professor, JRU', quote: '…', rating: 5 }
--------------------------------------------------------------------------- */
export const testimonials = [];

/* --- AI CHAT KNOWLEDGE BASE ----------------------------------------------
   Powers the "Ask about me" assistant with zero server and zero API key.
   Each entry: keywords the visitor might type -> the answer to give.
   Add your own entries freely; more entries = a smarter assistant.
--------------------------------------------------------------------------- */
export const knowledge = [
  {
    id: 'identity',
    keywords: ['who', 'who are you', 'about', 'yourself', 'introduce', 'name', 'andrew', 'bio'],
    answer: `I'm **Andrew Jr. F. San Antonio** — a Java developer and Computer Science
             student at Jose Rizal University. I specialise in back-end development and
             I'm building out my web development side. My real edge is mathematics and
             logical reasoning: I like problems that need to be *understood* before
             they're coded.`,
    chips: ['What are your skills?', 'Show me your projects', 'How can I contact you?'],
  },
  {
    id: 'skills',
    keywords: ['skill', 'skills', 'tech', 'stack', 'language', 'languages', 'know', 'good at', 'expertise', 'technolog'],
    answer: `**Languages:** Java (strongest), JavaScript ES6+, HTML5, CSS3, C.
             **Frameworks:** React, Next.js, Tailwind CSS, Node.js.
             **Tools:** Git & GitHub, VS Code, Postman, Figma, Webpack.
             Underneath all of it: mathematics, data structures and logical reasoning —
             which is honestly the part I'd want you to judge me on.`,
    chips: ['Which is your strongest language?', 'Show me your projects'],
  },
  {
    id: 'java',
    keywords: ['java', 'strongest', 'best language', 'backend', 'back-end', 'back end', 'server'],
    answer: `Java is my strongest language and where my back-end work lives — OOP,
             collections, clean layering, and services that behave predictably.
             Back-end is where I'm most comfortable: I'd rather get the data model and
             the logic right than decorate something fragile.`,
    chips: ['What projects have you built?', 'Are you available for work?'],
  },
  {
    id: 'projects',
    keywords: ['project', 'projects', 'built', 'build', 'portfolio', 'work on', 'made', 'created', 'dashboard'],
    answer: `Two shipped so far:
             **1. Personal Portfolio Website** — HTML, CSS and JavaScript, fully
             responsive, versioned through GitHub and deployed on GitHub Pages.
             **2. Interactive Data Dashboard** — JavaScript + Chart.js with real-time,
             dynamic charts for reading trends quickly.
             Scroll to the **Projects** section for the full breakdown.`,
    chips: ['Tell me about the dashboard', 'What tools do you use?'],
  },
  {
    id: 'dashboard',
    keywords: ['chart', 'chart.js', 'visualisation', 'visualization', 'data dash', 'graphs'],
    answer: `The dashboard is built with plain JavaScript and Chart.js. It renders
             real-time data as dynamic charts and graphs so trends are readable at a
             glance, and the layout holds up as the dataset grows. It was my way into
             thinking about data flow and state, not just presentation.`,
    chips: ['Show me your other project', 'What are your skills?'],
  },
  {
    id: 'education',
    keywords: ['school', 'study', 'studying', 'university', 'college', 'education', 'jru', 'rizal', 'student', 'degree'],
    answer: `I study Computer Science at **Jose Rizal University**. The coursework I care
             most about is the mathematical side — data structures, algorithms and the
             reasoning that makes them provable rather than lucky.`,
    chips: ['What are you learning now?', 'How can I contact you?'],
  },
  {
    id: 'math',
    keywords: ['math', 'maths', 'mathematics', 'logic', 'logical', 'reasoning', 'problem solving', 'analytical'],
    answer: `Mathematics is my strongest foundation. It taught me to think in systems,
             find the efficient path instead of the first path, and value correctness
             over cleverness. In practice that means I decompose a problem properly
             before writing a line — which makes the code shorter and the bugs rarer.`,
    chips: ['How does that show in your code?', 'Show me your projects'],
  },
  {
    id: 'learning',
    keywords: ['learning', 'learn', 'next', 'goal', 'goals', 'future', 'improving', 'currently'],
    answer: `I'm deepening my Java back-end craft — cleaner layering, better testing —
             while learning front-end architecture that respects the engineering
             underneath. This 3D portfolio is part of that: Three.js, animation
             performance, and accessible interaction.`,
    chips: ['Are you open to work?', 'What are your skills?'],
  },
  {
    id: 'hire',
    keywords: ['hire', 'hiring', 'available', 'availability', 'freelance', 'job', 'work together', 'internship', 'open to'],
    answer: `Yes — I'm open to internships, junior back-end roles and collaborative
             projects, especially anything Java or data-driven. The fastest route is
             email: **drewsanantonio06@gmail.com**, or use the Contact form below.`,
    chips: ['How can I contact you?', 'What are your skills?'],
  },
  {
    id: 'contact',
    keywords: ['contact', 'email', 'reach', 'linkedin', 'github', 'message', 'get in touch', 'hire me', 'connect'],
    answer: `Email me at **drewsanantonio06@gmail.com** — that's the surest way to reach
             me. You'll also find my LinkedIn and GitHub links in the **Contact**
             section, and the form there sends straight to my inbox.`,
    chips: ['Are you available for work?', 'Who are you?'],
  },
  {
    id: 'tools',
    keywords: ['tool', 'tools', 'editor', 'ide', 'git', 'workflow', 'vs code', 'postman', 'figma'],
    answer: `VS Code for writing, Git & GitHub for version control, Postman for testing
             APIs, Figma for design hand-off, Webpack when a build step is warranted.
             My workflow runs through GitHub Desktop on my laptop — and I'll push a fix
             from my phone if something needs it.`,
    chips: ['Show me your projects', 'What are your skills?'],
  },
  {
    id: 'site',
    keywords: ['this site', 'this website', 'three', 'threejs', 'three.js', '3d', 'built this', 'animation', 'webgl'],
    answer: `This site is hand-built: **Three.js** for the WebGL scene behind everything,
             vanilla JavaScript ES modules with no build step, and CSS for the layout and
             animation. The 3D core reacts to your scroll and cursor, and it respects
             *reduced-motion* settings. No framework, no bundler — just readable code.`,
    chips: ['What are your skills?', 'Who are you?'],
  },
  {
    id: 'location',
    keywords: ['where', 'located', 'location', 'live', 'based', 'country', 'philippines', 'timezone'],
    answer: `I'm based in the **Philippines** and happy to work remotely across
             time zones. Async-friendly by default.`,
    chips: ['Are you available for work?', 'How can I contact you?'],
  },
];

/* Shown as starter buttons when the chat opens. */
export const chatStarters = [
  'Who is Andrew?',
  'What are your skills?',
  'Show me your projects',
  'Are you open to work?',
];
