# Fix restart/rematch flow

## Context
Current bug: Player 2 can reset Player 1's active game without consent. Need proper rematch flow with consent.

## Flow
1. **P2 dies, P1 alive** → P2 clicks "Try Again" → server sends `rematchRequested` to P1 → P1 sees "Player 2 wants a rematch — Accept?" → P1 accepts → full reset + challenger announcement
2. **Both dead** → Either clicks "Try Again" → instant reset, no consent needed

## New messages
- Client→Server: `requestRestart` (unchanged, but server now checks if other player is alive)
- Server→Client: `rematchRequested { fromPlayerId }` (sent to alive player)
- Client→Server: `acceptRematch` / `declineRematch`
- Server→Client: `rematchDeclined` (sent to dead player if declined)

## Files
- `server/GameSession.js` — add rematch request/accept/decline logic
- `server/server.js` — route new message types
- `src/networkGame.js` — show accept/decline UI for P1, show "waiting" for P2
- `index.html` — add rematch request overlay
- `game.css` — style it
