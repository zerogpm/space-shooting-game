# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Browser-based 2D space shooting game built with vanilla JavaScript and HTML5 Canvas. No build step, no package manager, no framework. GSAP 3.5.1 is the only dependency (vendored as `gsap.js`).

## Running the Game

```bash
# Docker (serves via Nginx on port 80)
docker compose up

# Or any static file server, e.g.:
python -m http.server 8000
```

No build, test, or lint commands exist.

## Architecture

All game logic lives in `index.js`. The game uses three classes:

- **Player** — Static circle at canvas center. Drawn each frame, never moves.
- **Projectile** — Fired from center toward mouse click. Velocity derived from `atan2` angle × speed factor 5.
- **Enemy** — Spawns at random canvas edges every 1 second, moves toward center via `atan2`-calculated velocity. Random radius (4–30px), random HSL color.

**Game loop (`animate()`):** Uses `requestAnimationFrame`. Each frame draws a semi-transparent black rect for trail effect, updates all entities, and checks collisions via `Math.hypot` distance formula. Projectile-enemy hits shrink the enemy radius by 10px (animated with GSAP `gsap.to`); enemies below a threshold are removed. Enemy-player collision ends the game by cancelling the animation frame.

**State:** Two flat arrays (`projectiles[]`, `enemies[]`) hold all active entities. Array splicing during iteration uses `setTimeout(..., 0)` to defer mutation.

**Canvas:** Sized to `window.innerWidth` × `window.innerHeight` at init (no resize handler yet).
