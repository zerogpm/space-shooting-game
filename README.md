<div id="top"></div>

[![LinkedIn][linkedin-shield]][linkedin-url]

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#how-to-play">How to Play</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#license">License</a></li>
  </ol>
</details>

## About The Project
<div id="about-the-project"></div>

Browser-based 2D space shooting game with **2-player networked multiplayer**. Player 1 starts playing solo — Player 2 can drop in mid-game arcade-style with a dramatic "A NEW CHALLENGER HAS ENTERED THE RING!" announcement. Both players fight enemies and each other (PvP + enemies).

Built with vanilla JavaScript, HTML5 Canvas, and WebSocket. No framework.

<p align="right">(<a href="#top">back to top</a>)</p>

## Getting Started
<div id="getting-started"></div>

### Prerequisites

* Docker and Docker Compose installed on your machine

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/zerogpm/space-shooting-game.git
   ```
2. Build and start the game
   ```sh
   ./game.sh build && ./game.sh start
   ```
3. Open the URL shown in the terminal (e.g., `http://localhost:8325`)

4. (Optional) Add audio files — create a `sounds/` folder and add your own audio files with these exact names:

   | File | Purpose |
   |------|---------|
   | `sounds/bgm.mp3` | Background music (loops during gameplay) |
   | `sounds/shoot.mp3` | Player fires a projectile |
   | `sounds/hit.mp3` | Projectile hits an enemy (shrink) |
   | `sounds/kill.mp3` | Enemy destroyed |
   | `sounds/player-hit.mp3` | Player takes damage |
   | `sounds/death.mp3` | Player dies |
   | `sounds/challenger.mp3` | "A NEW CHALLENGER" announcement moment |

   Audio files are not included in the repo due to size. The game works fine without them — any missing sound is simply skipped.

### Server Commands

| Command | Description |
|---------|-------------|
| `./game.sh start` | Start the game server in the background |
| `./game.sh stop` | Stop the game server |
| `./game.sh restart` | Stop and start the game server |
| `./game.sh build` | Build the Docker image |
| `./game.sh status` | Show container status |
| `./game.sh logs` | Show server logs |

<p align="right">(<a href="#top">back to top</a>)</p>

## How to Play
<div id="how-to-play"></div>

### Controls
- **WASD / Arrow Keys** — Move
- **Q/E/Z/C** — Diagonal movement
- **Mouse Click / Spacebar** — Shoot toward cursor
- **Escape** — Pause / Unpause

### Multiplayer
- **Player 1** opens the game URL — starts playing immediately
- **Player 2** opens the same URL from another computer on the same network — sees "Join Game" button
- On join, Player 1 sees **"A NEW CHALLENGER HAS ENTERED THE RING!"**
- Both players fight enemies AND each other

### Game Mechanics
- **Health**: 100 HP. Bigger enemies deal more damage (damage = enemy radius). Player projectiles deal 20 damage.
- **Scoring**: +10 for shrinking an enemy, +100 for destroying one
- **Difficulty**: Level increases every 10 seconds — enemies spawn faster and move quicker
- **Knockback**: Collisions push entities apart physically
- **Spectator**: When you die, you can watch the other player and request a rematch

<p align="right">(<a href="#top">back to top</a>)</p>

## Roadmap

- [x] Fix docker compose set up
- [x] Create a Basic Base Defense Game
    - [x] shoot projectiles
    - [x] create enemies
    - [x] detect collision
    - [x] remove offscreen projectiles
    - [x] colorize game
    - [x] shrink Enemies on Hit
    - [x] create particle explosion on hit
    - [x] add Score
    - [x] add game over ui
    - [x] add restart button

- [x] Modularize Codebase
    - [x] break monolithic index.js into ES modules (src/ folder)
    - [x] separate classes into Player.js, Enemy.js, Projectile.js
    - [x] create InputHandler.js for keyboard input
    - [x] create ScoreManager.js for HUD display
    - [x] create game.js for game loop orchestration

- [ ] Movement, Enemies, and Enhanced Interaction
    - [x] player movement (WASD, arrow keys, Q/E/Z/C diagonals)
    - [x] shoot with spacebar or mouse click
    - [x] difficulty progression (level system with scaling enemy speed and spawn rate)
    - [x] background music and sound effects
    - [x] health system with dynamic damage
    - [x] knockback physics on collisions
    - [x] pause/unpause (Escape key)
    - [ ] homing enemies
    - [ ] spinning enemies
    - [ ] power ups
    - [ ] screen resizing
    - [ ] mobile events

- [x] 2-Player Networked Multiplayer (PvP + Enemies)
    - [x] Phase 1: Separate simulation from rendering
    - [x] Phase 2+3: WebSocket server + arcade drop-in multiplayer
    - [x] Phase 4: Polish (fire rate limiting, nearest-player targeting, spectator mode)
    - [ ] Phase 5: Network optimization (optional/future)

See the [open issues](https://github.com/zerogpm/space-shooting-game/issues) for a full list of proposed features (and known issues).

<p align="right">(<a href="#top">back to top</a>)</p>

## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://www.linkedin.com/in/jiansu/
