# Zain Khan — Universe

An immersive portfolio: a particle hero, a draggable 3D map of every project, a scroll-drawn timeline and the real commit rhythm.

## Commands

- `python3 -m http.server 8000` — serve locally, then open http://localhost:8000
- `open 'http://localhost:8000/?still=1'` — render the hero already assembled (used for screenshots)

## Structure

- `index.html` — page structure and sections
- `css/style.css` — design tokens, layout, animations
- `js/data.js` — all content: clusters, projects, featured cards, timeline, stack, contact
- `js/hero.js` — particle text hero
- `js/universe.js` — 3D project map
- `js/main.js` — reveals, counters, cards, timeline, chart
- `data/rhythm.json` — monthly commit counts (generated from git history)
- `assets/` — screenshots and favicon

## Conventions

- Add or change content only in `js/data.js`; every project must exist as a real repo and `live` is set only for a verified working URL.
- Keep it dependency-free: no npm, no CDN scripts. Logos are local files in `assets/logos` (Simple Icons CC0 SVGs plus brand PNGs from the owner's own folders).
- Honor `prefers-reduced-motion` in every new animation.
- Regenerate `data/rhythm.json` from git history; never hand-edit the numbers.
- Secrets never go in the repo. Variables are named in `.env.example` (if present); real values live in untracked env files or the host's settings.
- Keep docs in `docs/`. Update `CHANGELOG.md` for user-visible changes.
- Judge every request against [`SCOPE.md`](SCOPE.md); use the terms in [`GLOSSARY.md`](GLOSSARY.md).

## Do not change without asking

- CNAME or Pages settings on the user site repo

## Agent skills

### Issue tracker

GitHub Issues are the tracker. See [`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md).

### Triage labels

See [`docs/agents/triage-labels.md`](docs/agents/triage-labels.md).

### Domain docs

Single-context repo: read [`GLOSSARY.md`](GLOSSARY.md) and [`SCOPE.md`](SCOPE.md) first. See [`docs/agents/domain.md`](docs/agents/domain.md).
