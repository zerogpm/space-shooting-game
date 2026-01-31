# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Browser-based 2D space shooting game built with vanilla JavaScript (ES modules) and HTML5 Canvas. No build step, no package manager, no framework. GSAP 3.5.1 is the only dependency (vendored as `gsap.js`).

## Running the Game

```bash
# Docker (serves via Nginx on port 80)
docker compose up
```

Open http://localhost in a browser. No build, test, or lint commands exist.

## Tech Stack

- Vanilla JavaScript with native ES modules (`type="module"`)
- HTML5 Canvas for rendering
- GSAP 3.5.1 (loaded as a classic `<script>`, accessed as a global)
- Docker + Nginx for serving

## File Structure

```
index.html              Entry point — loads GSAP + ES module
game.css                Styling (body margin reset + game over overlay)
gsap.js                 Vendored GSAP 3.5.1 animation library
docker-compose.yml      Nginx container config (port 80)
src/
  main.js               Canvas setup, calls startGame()
  game.js               Game loop, enemy spawning, collisions, difficulty, firing
  Player.js             Player class — keyboard-driven movement, clamped to bounds
  Enemy.js              Enemy class — spawns at edges, moves toward player
  Projectile.js         Projectile class — flies from player toward target
  Particle.js           Particle class — explosion debris with fade and friction
  InputHandler.js       Keyboard state tracking (Set-based), normalized direction
  ScoreManager.js       Score + level HUD, drawn on canvas
```

## Architecture

### Classes

- **Player** — Circle controlled by keyboard. Moves at 3px/frame, clamped to canvas bounds. Receives a normalized direction vector from InputHandler each frame.
- **Projectile** — Fired from player's position toward mouse click or cursor (spacebar). Speed factor 5.
- **Enemy** — Spawns at random canvas edges, aims at player's position at spawn time (straight-line, not homing). Random radius (4-30px), random HSL color. Speed scales with level.
- **Particle** — Tiny circle spawned on enemy hits. Flies outward with random velocity, decelerates via friction (0.98x/frame), fades via decreasing alpha. Removed when alpha reaches 0.
- **InputHandler** — Tracks pressed keys via a `Set` using `e.code`. Supports WASD, arrow keys, and Q/E/Z/C for diagonals. Returns a normalized direction vector so diagonal speed equals cardinal speed.
- **ScoreManager** — Tracks score (+10 shrink, +100 kill) and level. Draws both as canvas text in the top-left corner.

### Game Loop (`animate()` in game.js)

Uses `requestAnimationFrame` (~60fps). Each frame:
1. Clear canvas to solid black
2. Update player position from keyboard input
3. Update projectiles, remove off-screen ones
4. Update particles, remove faded ones
5. Update enemies, check player-enemy collision (game over) and projectile-enemy collision (shrink/destroy + spawn particles)
6. Draw score and level HUD

### Difficulty System

Level increases every 10 seconds. Each level:
- **Spawn rate**: starts at 1000ms, decreases by 75ms/level, minimum 200ms. Uses recursive `setTimeout` (not `setInterval`) so the delay adjusts dynamically.
- **Enemy speed**: starts at 1x, increases by 0.2x/level.

### Firing

Two methods: left-click on canvas or spacebar (fires toward current mouse position). Mouse position is tracked via `mousemove` listener.

### Collision Detection

Circle-circle collision using `Math.hypot` distance formula. If `distance - radius1 - radius2 < 1`, circles are overlapping.

### Array Iteration

All entity arrays use reverse `for` loops for safe in-place splicing. Forward iteration + splice causes index skipping.

### Context Handling

Canvas 2D context is passed to each class constructor and stored as `this.context`. No global variables.

### Game Over and Restart

Enemy touching player triggers game over: all timers and event listeners are cleaned up, an HTML overlay shows the final score with a "Try Again" button. Restart calls `startGame()` again with a fresh state.

## Code Style

- **Meaningful variable names** — no single-letter variables. Use `positionX` not `x`, `enemyIndex` not `i`, `velocity.horizontal` not `velocity.x`.
- **Educational comments** — explain *why*, not *what*. Focus on non-obvious math, game design reasoning, and patterns that might confuse a beginner.
