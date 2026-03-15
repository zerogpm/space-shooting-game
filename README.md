<div id="top"></div>


<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->

[![LinkedIn][linkedin-shield]][linkedin-url]




<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      (<a href="#about-the-project">About The Project</a>)
    </li>
    <li>
      (<a href="#getting-started">Getting Started</a>)
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project
<div id="about-the-project"></div>
This is a fun little game, just one command and you can lay back and relax. 

Here's why:
* Your time should be focused on creating something amazing. A project that solves a problem and helps others
* You shouldn't be doing the same tasks over and over like setting up wordpress, PHP, MYSQL, Nginx
* You should implement DRY principles to the rest of your life :smile:

<p align="right">(<a href="#top">back to top</a>)</p>


<!-- GETTING STARTED -->
## Getting Started
<div id="getting-started"></div>
This is an example of how you may give instructions on setting up your project locally.
To get a local copy up and running follow these simple example steps.

### Prerequisites

This is an example of how to list things you need to use the software and how to install them.
* docker install on your machine
* docker compose install on your machine

### Installation

_Below is an example of how you can instruct your audience on installing and setting up your app. This template doesn't rely on any external dependencies or services._

1. Clone the repo
   ```sh
   git clone https://github.com/zerogpm/space-shooting-game.git
   ```
2. CD into your downloaded folder
   ```sh
   ./game.sh build && ./game.sh start
   ```
3. (Optional) Add audio files — create a `sounds/` folder and add your own audio files with these exact names:

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

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- ROADMAP -->
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
    - [ ] homing enemies
    - [ ] spinning enemies
    - [ ] homing-spinning enemies
    - [ ] power ups
    - [ ] dynamic score labels
    - [ ] interactive background particles
    - [ ] sound effect
    - [ ] background music
    - [ ] screen resizing
    - [ ] mobile events
    - [ ] enhancing mobile performance

- [ ] 2-Player Networked Multiplayer (PvP + Enemies)
    - [x] Phase 1: Separate simulation from rendering
        - [x] create src/simulation/ with PlayerSim, EnemySim, ProjectileSim (no canvas dependency)
        - [x] create CollisionHelper (extract circle-circle collision logic)
        - [x] create GameSim (server-ready game loop with physics + collisions)
        - [x] wrap existing entity classes around Sim counterparts
    - [x] Phase 2+3: WebSocket server + arcade drop-in multiplayer
        - [x] Node.js WebSocket server replaces Nginx (serves static files + game state)
        - [x] auto-connect on page load, Player 1 plays through server immediately
        - [x] GameSession manages tick loop, enemy spawning, level progression
        - [x] NetworkClient.js (client-side WebSocket wrapper)
        - [x] StateRenderer.js (renders server state snapshots to canvas)
        - [x] networkGame.js (multiplayer client loop — input sending + rendering)
        - [x] Player 2 sees "Game in Progress" with "Join Game" button
        - [x] arcade drop-in: "A NEW CHALLENGER HAS ENTERED THE RING!" announcement
        - [x] 2.5s dramatic pause with GSAP animation on join
        - [x] both players visible with distinct colors (cyan/magenta)
        - [x] dual-player HUD (P1 top-left, P2 top-right, level centered)
        - [x] PvP: projectiles can hit other player, own projectiles pass through self
        - [x] game-over detection (all players dead), restart flow
        - [x] disconnect handling, offline fallback to single-player
        - [x] Dockerfile + updated docker-compose.yml
    - [x] Phase 4: Polish
        - [x] fire rate limiting (server-side, 100ms cooldown per player)
        - [x] enemy targeting balance (aim at nearest player)
        - [x] spectator mode when dead (watch remaining player with banner)
    - [ ] Phase 5: Network optimization (optional/future)
        - [ ] client-side prediction for own player movement
        - [ ] entity interpolation for smooth opponent rendering
        - [ ] delta compression (send only changes)

See the [open issues](https://github.com/zerogpm/space-shooting-game/issues) for a full list of proposed features (and known issues).

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- CONTACT -->
## Contact

Project Link: [https://github.com/zerogpm/space-shooting-game](https://github.com/zerogpm/space-shooting-game)

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

Use this space to list resources you find helpful and would like to give credit to. I've included a few of my favorites to kick things off!

* [Choose an Open Source License](https://choosealicense.com)
* [GitHub Emoji Cheat Sheet](https://www.webpagefx.com/tools/emoji-cheat-sheet)
* [Malven's Flexbox Cheatsheet](https://flexbox.malven.co/)
* [Img Shields](https://shields.io)
* [GitHub Pages](https://pages.github.com)
* [Font Awesome](https://fontawesome.com)
* [React Icons](https://react-icons.github.io/react-icons/search)

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://www.linkedin.com/in/jiansu/