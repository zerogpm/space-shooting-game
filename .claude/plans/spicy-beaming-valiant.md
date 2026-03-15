# Pause Feature

## Context
Need a pause button that freezes the game for both players. Either player can pause/unpause.

## Plan
- Press `Escape` or click a pause button to toggle pause
- Client sends `pause`/`unpause` message to server
- Server sets `this.paused = true` (already exists in GameSession) and broadcasts `gamePaused { byPlayerId }` / `gameUnpaused`
- Both clients show "Game Paused" overlay, game state stops updating
- Either player can unpause

## New messages
- Client→Server: `togglePause`
- Server→Client: `gamePaused { byPlayerId }`, `gameUnpaused`

## Files
- `server/GameSession.js` — add `handleTogglePause(playerId)`
- `server/server.js` — route `togglePause` message
- `src/networkGame.js` — handle pause messages, Escape key, pause button
- `index.html` — add pause overlay + pause button
- `game.css` — style them
