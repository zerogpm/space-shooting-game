# Fix: Auto-reconnect on server restart

## Context
When `game.sh restart` runs, the WebSocket drops. Player 2's client freezes showing "Disconnected" and requires a manual browser refresh.

## Fix
On disconnect, show "Connection lost — Reconnecting..." and auto-reload the page after 2 seconds. This gives the server time to come back up, and the player gets a fresh connection + join screen.

## Files
- `src/networkGame.js` — update onDisconnect handler
