# Add background music

## Context
`sounds/bgm.mp3` is ready. Wire it into the game — looping, lower volume, starts when gameplay begins.

## Plan
- Create `src/SoundManager.js` — handles audio playback. Methods: `playBGM()`, `stopBGM()`, `setVolume()`, `mute()`/`unmute()`.
- Call `playBGM()` when `gameStart` message arrives in `networkGame.js` and when `startGame()` runs in `game.js` (offline).
- Browsers block autoplay until user interaction — start music on first click/keypress if needed.
- Add a mute button to the UI (small speaker icon in corner).

## Files
- `src/SoundManager.js` (new)
- `src/networkGame.js` (play on gameStart)
- `src/game.js` (play on start for offline)
- `index.html` (add mute button)
- `game.css` (style mute button)
