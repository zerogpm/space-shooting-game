# Phase 4: Polish

## Context
Phase 2+3 multiplayer is working. Three polish features to add:
1. Fire rate limiting (server-side anti-spam)
2. Enemy targeting balance (aim at nearest player instead of random)
3. Spectator mode when dead (watch remaining player)

## 1. Fire Rate Limiting

**Problem:** No throttle — players can spam-click to fire thousands of projectiles.

**Fix in `server/GameSession.js`:**
- Track `lastFireTime` per player in a Map
- In `handleFire()`, check if at least 100ms has passed since last fire
- Ignore fire requests that come too fast
- No client changes needed — server just silently drops spam

**Files:** `server/GameSession.js`

## 2. Enemy Targeting: Nearest Player

**Problem:** `GameSim.spawnEnemy()` picks a random alive player. One player can get swarmed while the other is ignored.

**Fix in `src/simulation/GameSim.js` → `spawnEnemy()`:**
- After choosing spawn position, calculate distance to each alive player
- Aim at the nearest alive player instead of a random one
- This naturally distributes enemies between players based on proximity to edges

**Files:** `src/simulation/GameSim.js`

## 3. Spectator Mode

**Problem:** When a player dies in 2-player, they see "You Died!" overlay blocking the view. They can't watch the remaining player.

**Fix in `src/networkGame.js`:**
- When `playerDied` and other player is alive: show a small banner at top ("You Died! Watching...") instead of the full overlay
- The render loop keeps running — dead player can see the game
- Move the "Try Again" button to the banner so they can still request rematch
- When `gameOver` arrives (all dead): show the full overlay as before

**Files:** `src/networkGame.js`, `index.html` (add spectator banner), `game.css` (style it)

## Verification
1. `npm test` — all tests pass
2. Fire rapidly — projectiles should be capped at ~10/sec
3. In 2-player, enemies visibly target the closer player
4. When one player dies, they see the other player still fighting (no full-screen overlay blocking view)
