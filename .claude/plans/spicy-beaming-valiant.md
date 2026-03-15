# Test Setup Plan (Pre-Phase 1)

## Context

The project has zero tests. Before refactoring for multiplayer (Phase 1), we need a safety net to verify nothing breaks. Using Vitest with ES modules. Tests cover core game logic (entity classes, collision math, scoring, input) and integration (game loop flow).

**Key challenge:** Every entity class takes a canvas `context` and calls `draw()` inside `update()`. We'll create a shared mock context so we can test the logic (position changes, velocity, clamping) without a real canvas.

---

## Step 1: Project Setup

**Create `package.json`** at project root:
- `"type": "module"` (matches existing ES module code)
- devDependency: `vitest`
- script: `"test": "vitest run"`, `"test:watch": "vitest"`

**Create `vitest.config.js`** at project root:
- Minimal config, set environment to `jsdom` (needed for InputHandler's `window.addEventListener`)

**Files:** `package.json` (new), `vitest.config.js` (new)

---

## Step 2: Test Helper — Mock Canvas Context

**Create `tests/helpers/mockContext.js`:**

A factory that returns a fake `CanvasRenderingContext2D` with no-op methods for everything entity classes call:
- `beginPath`, `arc`, `fill`, `save`, `restore` — no-ops
- `fillStyle`, `globalAlpha`, `font`, `textAlign`, `textBaseline` — writable properties
- `fillRect`, `fillText` — no-ops

This lets us `new Player(mockContext(), ...)` and test position logic without canvas errors.

**Files:** `tests/helpers/mockContext.js` (new)

---

## Step 3: Unit Tests

### `tests/Player.test.js`
Test `src/Player.js` (lines 38-47):
- Moves right when given `{ directionX: 1, directionY: 0 }` — positionX increases by speed (3)
- Moves diagonally with normalized input — position changes correctly
- Stays still when direction is `{ 0, 0 }`
- **Clamping**: doesn't go past left edge (positionX >= radius)
- **Clamping**: doesn't go past right edge (positionX <= canvasWidth - radius)
- **Clamping**: same for top and bottom edges
- Clamping works in corners (both axes clamped simultaneously)

### `tests/Enemy.test.js`
Test `src/Enemy.js` (lines 27-31):
- Moves according to velocity each update — position changes by `velocity.horizontal` / `velocity.vertical`
- Negative velocity moves left/up
- Multiple updates accumulate position correctly

### `tests/Projectile.test.js`
Test `src/Projectile.js` (lines 26-30):
- Moves according to velocity each update
- Multiple updates accumulate correctly
- Diagonal velocity works as expected

### `tests/Particle.test.js`
Test `src/Particle.js` (lines 52-65):
- Alpha decreases by 0.01 each update
- Velocity decreases by friction (0.98x) each update
- Position changes by current velocity each update
- After 100 updates, alpha reaches ~0 (particle should be removed)
- Friction actually slows particles: velocity after N frames = initial * 0.98^N

### `tests/InputHandler.test.js`
Test `src/InputHandler.js` (lines 45-71) — needs jsdom for window events:
- No keys pressed → `{ directionX: 0, directionY: 0 }`
- W key → `{ 0, -1 }` (up)
- S key → `{ 0, 1 }` (down)
- A key → `{ -1, 0 }` (left)
- D key → `{ 1, 0 }` (right)
- W + D → normalized diagonal `{ ~0.707, ~-0.707 }`
- Arrow keys work same as WASD
- Q key → normalized up-left diagonal
- E key → normalized up-right diagonal
- Z key → normalized down-left diagonal
- C key → normalized down-right diagonal
- `destroy()` removes event listeners (key events no longer tracked)

### `tests/ScoreManager.test.js`
Test `src/ScoreManager.js` (lines 20-32):
- Starts at score 0, level 1
- `addShrinkPoints()` adds 10
- `addKillPoints()` adds 100
- Multiple score additions accumulate
- `setLevel()` updates level
- `draw()` doesn't throw (just verify it runs with mock context)

---

## Step 4: Integration Tests

### `tests/collision.test.js`
Test the collision detection formula used in `game.js:224-228` and `game.js:247-253`:
- Two circles overlapping → collision detected (`distance - r1 - r2 < 1`)
- Two circles just touching → collision detected
- Two circles far apart → no collision
- Two circles barely separated (distance - r1 - r2 = 1.5) → no collision
- Edge case: zero-radius circle at same position → collision
- Different sized circles (large enemy + small projectile)

Write a `circlesCollide(a, b)` helper function in the test file that mirrors the game.js formula. This same function gets extracted to `CollisionHelper.js` in Phase 1.

### `tests/game-integration.test.js`
Test the game loop flow by simulating what `game.js` does, using real entity instances with mock context:

1. **Projectile hits large enemy → enemy shrinks**
   - Create enemy at (100, 100) radius 25, projectile at (100, 100) radius 5
   - Verify collision detected
   - Verify enemy.radius - 10 > 5 (shrink path)

2. **Projectile hits small enemy → enemy destroyed**
   - Create enemy at (100, 100) radius 8, projectile at (100, 100) radius 5
   - Verify collision detected
   - Verify enemy.radius - 10 <= 5 (destroy path)

3. **Projectile misses enemy → no collision**
   - Create enemy at (100, 100), projectile at (500, 500)
   - Verify no collision

4. **Enemy reaches player → game over condition**
   - Create player at (400, 300) radius 10, enemy at (405, 300) radius 10
   - Verify collision detected (distance < r1 + r2 + 1)

5. **Projectile leaves screen → should be removed**
   - Create projectile moving right, update until positionX > canvasWidth + radius
   - Verify off-screen check passes

6. **Difficulty scaling formulas**
   - Level 1: spawn delay = 1000ms, speed = 1.0
   - Level 5: spawn delay = 700ms, speed = 1.8
   - Level 11: spawn delay = 250ms, speed = 3.0
   - Level 15+: spawn delay = 200ms (minimum), speed = 3.8

7. **Score accumulation across multiple hits**
   - 3 shrink hits + 1 kill = 10*3 + 100 = 130

---

## File Structure After Setup

```
space-shooting-game/
  package.json              (new)
  vitest.config.js          (new)
  tests/
    helpers/
      mockContext.js         (new)
    Player.test.js           (new)
    Enemy.test.js            (new)
    Projectile.test.js       (new)
    Particle.test.js         (new)
    InputHandler.test.js     (new)
    ScoreManager.test.js     (new)
    collision.test.js        (new)
    game-integration.test.js (new)
```

---

## Verification

1. `npm install` — installs vitest
2. `npm test` — all tests pass
3. `npm run test:watch` — watch mode works for development
4. Existing game still works in browser (no source files changed)
