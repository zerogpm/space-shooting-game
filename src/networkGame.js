/**
 * networkGame.js — Multiplayer client game loop.
 *
 * Replaces game.js for networked play. The server runs the simulation;
 * this module sends inputs and renders the state snapshots the server broadcasts.
 * Particles are managed client-side only (visual effects, not gameplay).
 */
import { InputHandler } from './InputHandler.js'
import { Particle } from './Particle.js'
import { drawPlayers, drawEnemies, drawProjectiles, drawHUD } from './StateRenderer.js'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './shared/constants.js'

/**
 * Start the networked game client.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {CanvasRenderingContext2D} context
 * @param {import('./NetworkClient.js').NetworkClient} networkClient
 * @param {string} myPlayerId
 * @param {Object} initialState - First state snapshot from server.
 */
export function startNetworkGame(canvas, context, networkClient, myPlayerId, initialState) {
  const input = new InputHandler()
  let latestState = initialState
  let animationId = null
  let lastSentDirection = null

  // Particles are client-side only — spawned from server hit events
  const particles = []

  // Scale factors to map server coordinates to client canvas
  const scaleX = canvas.width / CANVAS_WIDTH
  const scaleY = canvas.height / CANVAS_HEIGHT

  // Track mouse position for firing (in server coordinate space)
  let mouseServerX = CANVAS_WIDTH / 2
  let mouseServerY = CANVAS_HEIGHT / 2

  // ─── Overlay Elements ───────────────────────────────────────
  const gameOverScreen = document.getElementById('game-over-screen')
  const finalScoreText = document.getElementById('final-score')
  const restartButton = document.getElementById('restart-button')
  const challengerScreen = document.getElementById('challenger-screen')
  const joinGameScreen = document.getElementById('join-game-screen')

  // ─── Server Message Handling ────────────────────────────────
  networkClient.onMessage((message) => {
    switch (message.type) {
      case 'state':
        latestState = message.state
        // Spawn particles from hit events
        if (message.events && message.events.hits) {
          for (const hit of message.events.hits) {
            spawnExplosion(hit.positionX, hit.positionY, hit.color, hit.particleCount)
          }
        }
        break

      case 'challengerJoined':
        showChallengerAnnouncement(message.newPlayerId === myPlayerId)
        break

      case 'challengerReady':
        hideChallengerAnnouncement()
        break

      case 'gameStart':
        latestState = message.state
        // Hide join screen if it was showing
        if (joinGameScreen) joinGameScreen.classList.remove('visible')
        if (gameOverScreen) gameOverScreen.classList.remove('visible')
        break

      case 'playerDied':
        if (message.playerId === myPlayerId) {
          // Check if other players are still alive
          const otherAlive = latestState.players.some(
            player => player.id !== myPlayerId && player.alive
          )
          if (otherAlive) {
            showDeathMessage()
          }
        }
        break

      case 'gameOver':
        showGameOver(message.scores)
        break

      case 'playerDisconnected':
        // Could show a notification — for now, the game just continues
        break
    }
  })

  networkClient.onDisconnect(() => {
    cleanup()
    // Show a disconnect message in the game-over overlay
    if (finalScoreText) finalScoreText.textContent = 'Connection lost'
    if (gameOverScreen) {
      gameOverScreen.querySelector('h1').textContent = 'Disconnected'
      gameOverScreen.classList.add('visible')
    }
  })

  // ─── Particle Explosions (Client-Side Only) ─────────────────
  function spawnExplosion(serverX, serverY, color, particleCount) {
    // Convert server coordinates to screen coordinates for rendering
    const screenX = serverX * scaleX
    const screenY = serverY * scaleY

    for (let index = 0; index < particleCount; index++) {
      const randomAngle = Math.random() * Math.PI * 2
      const randomSpeed = Math.random() * 5 + 1
      const velocity = {
        horizontal: Math.cos(randomAngle) * randomSpeed,
        vertical: Math.sin(randomAngle) * randomSpeed
      }
      const particleRadius = Math.random() * 2 + 1
      particles.push(new Particle(context, screenX, screenY, particleRadius, color, velocity))
    }
  }

  // ─── Render Loop ────────────────────────────────────────────
  function animate() {
    animationId = requestAnimationFrame(animate)

    // Send input to server (only when direction changes)
    const movementDirection = input.getDirection()
    if (!lastSentDirection ||
        movementDirection.directionX !== lastSentDirection.directionX ||
        movementDirection.directionY !== lastSentDirection.directionY) {
      networkClient.sendInput(movementDirection)
      lastSentDirection = { ...movementDirection }
    }

    // Clear canvas
    context.fillStyle = 'black'
    context.fillRect(0, 0, canvas.width, canvas.height)

    // Render game state from server snapshot
    if (latestState) {
      drawEnemies(context, latestState.enemies, scaleX, scaleY)
      drawProjectiles(context, latestState.projectiles, scaleX, scaleY)
      drawPlayers(context, latestState.players, myPlayerId, scaleX, scaleY)

      // Update and draw particles (client-side only)
      for (let particleIndex = particles.length - 1; particleIndex >= 0; particleIndex--) {
        const particle = particles[particleIndex]
        particle.update()
        if (particle.alpha <= 0) {
          particles.splice(particleIndex, 1)
        }
      }

      drawHUD(context, latestState.scores, latestState.level, myPlayerId, latestState.players, canvas.width)
    }
  }

  // ─── Firing ─────────────────────────────────────────────────
  function handleMouseMove(moveEvent) {
    // Convert screen coordinates to server coordinate space
    mouseServerX = moveEvent.clientX / scaleX
    mouseServerY = moveEvent.clientY / scaleY
  }

  function handleCanvasClick(clickEvent) {
    const targetX = clickEvent.clientX / scaleX
    const targetY = clickEvent.clientY / scaleY
    networkClient.sendFire(targetX, targetY)
  }

  function handleSpacebarFire(keyEvent) {
    if (keyEvent.code === 'Space') {
      keyEvent.preventDefault()
      networkClient.sendFire(mouseServerX, mouseServerY)
    }
  }

  canvas.addEventListener('click', handleCanvasClick)
  canvas.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('keydown', handleSpacebarFire)

  // ─── UI Overlays ────────────────────────────────────────────
  function showChallengerAnnouncement(isJoiningPlayer) {
    if (challengerScreen) {
      const textElement = challengerScreen.querySelector('h1')
      if (textElement) {
        textElement.textContent = isJoiningPlayer
          ? 'YOU HAVE ENTERED THE RING!'
          : 'A NEW CHALLENGER HAS ENTERED THE RING!'
      }
      challengerScreen.classList.add('visible')

      // Use GSAP for dramatic animation if available
      if (typeof gsap !== 'undefined' && textElement) {
        gsap.fromTo(textElement,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
        )
      }
    }
  }

  function hideChallengerAnnouncement() {
    if (challengerScreen) {
      challengerScreen.classList.remove('visible')
    }
  }

  function showDeathMessage() {
    if (finalScoreText) finalScoreText.textContent = `Score: ${latestState.scores[myPlayerId] || 0}`
    if (gameOverScreen) {
      gameOverScreen.querySelector('h1').textContent = 'You Died!'
      gameOverScreen.classList.add('visible')
    }
  }

  function showGameOver(scores) {
    if (gameOverScreen) {
      gameOverScreen.querySelector('h1').textContent = 'Game Over'

      // Show all player scores
      const scoreLines = Object.entries(scores)
        .map(([playerId, score]) => `${playerId.toUpperCase()}: ${score}`)
        .join(' | ')
      if (finalScoreText) finalScoreText.textContent = scoreLines

      gameOverScreen.classList.add('visible')
    }
  }

  // ─── Restart ────────────────────────────────────────────────
  if (restartButton) {
    restartButton.onclick = () => {
      gameOverScreen.classList.remove('visible')
      context.fillStyle = 'black'
      context.fillRect(0, 0, canvas.width, canvas.height)
      networkClient.sendRestart()
    }
  }

  // ─── Cleanup ────────────────────────────────────────────────
  function cleanup() {
    if (animationId) cancelAnimationFrame(animationId)
    canvas.removeEventListener('click', handleCanvasClick)
    canvas.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('keydown', handleSpacebarFire)
    input.destroy()
  }

  // ─── Start ──────────────────────────────────────────────────
  animate()
}
