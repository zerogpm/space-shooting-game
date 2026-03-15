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
import { SoundManager } from './SoundManager.js'

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
  const sound = new SoundManager()
  let latestState = initialState
  let animationId = null
  let lastSentDirection = null

  // Particles are client-side only — spawned from server hit events
  const particles = []

  // ─── Local Smooth Animations ──────────────────────────────
  // The server sends instant radius changes for enemy shrinks.
  // Each client tracks visual radii locally and uses GSAP to tween smoothly.
  // No extra network traffic — both clients animate independently.
  // Maps enemyId → { radius: currentVisualRadius }
  const enemyVisualRadii = new Map()

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
  const rematchScreen = document.getElementById('rematch-screen')
  const acceptRematchButton = document.getElementById('accept-rematch-button')
  const declineRematchButton = document.getElementById('decline-rematch-button')
  const spectatorBanner = document.getElementById('spectator-banner')
  const spectatorText = document.getElementById('spectator-text')
  const spectatorRetryButton = document.getElementById('spectator-retry-button')
  const pauseScreen = document.getElementById('pause-screen')
  const pauseMessage = document.getElementById('pause-message')
  const resumeButton = document.getElementById('resume-button')
  const pauseButton = document.getElementById('pause-button')

  // ─── Server Message Handling ────────────────────────────────
  networkClient.onMessage((message) => {
    switch (message.type) {
      case 'state':
        latestState = message.state
        // Handle hit events — spawn particles and animate shrinks locally
        if (message.events && message.events.hits) {
          for (const hit of message.events.hits) {
            spawnExplosion(hit.positionX, hit.positionY, hit.color, hit.particleCount)

            // Play sound effects based on hit type
            if (hit.type === 'shrink') {
              sound.playEffect('sounds/hit.mp3', 0.4)
            }

            // Smooth shrink animation using GSAP — runs locally on each client
            if (hit.type === 'shrink' && typeof gsap !== 'undefined') {
              const visual = enemyVisualRadii.get(hit.enemyId)
              if (visual) {
                gsap.to(visual, { radius: hit.newRadius, duration: 0.3, ease: 'power2.out' })
              } else {
                // First time seeing this enemy shrink — start from old radius
                const entry = { radius: hit.newRadius + 10 }
                enemyVisualRadii.set(hit.enemyId, entry)
                gsap.to(entry, { radius: hit.newRadius, duration: 0.3, ease: 'power2.out' })
              }
            }

            // Clean up visual tracking for killed enemies
            if (hit.type === 'kill') {
              enemyVisualRadii.delete(hit.enemyId)
            }
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
        enemyVisualRadii.clear()
        // Hide all overlays and reset button state
        if (joinGameScreen) joinGameScreen.classList.remove('visible')
        if (gameOverScreen) gameOverScreen.classList.remove('visible')
        if (rematchScreen) rematchScreen.classList.remove('visible')
        if (spectatorBanner) spectatorBanner.classList.remove('visible')
        if (pauseScreen) pauseScreen.classList.remove('visible')
        if (pauseButton) pauseButton.textContent = 'Pause'
        if (restartButton) {
          restartButton.textContent = 'Try Again'
          restartButton.disabled = false
        }
        if (spectatorRetryButton) {
          spectatorRetryButton.textContent = 'Try Again'
          spectatorRetryButton.disabled = false
        }
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

      case 'rematchRequested':
        // The other player wants a rematch — show accept/decline UI
        showRematchRequest(message.fromPlayerId)
        break

      case 'rematchDeclined':
        // The alive player declined — update the death screen
        if (finalScoreText) finalScoreText.textContent += ' — Rematch declined'
        break

      case 'gamePaused':
        if (pauseScreen) {
          const pausedBySelf = message.byPlayerId === myPlayerId
          if (pauseMessage) {
            pauseMessage.textContent = pausedBySelf
              ? 'Press Escape or click Resume to continue'
              : `Paused by ${message.byPlayerId.toUpperCase()}`
          }
          pauseScreen.classList.add('visible')
        }
        if (pauseButton) pauseButton.textContent = 'Resume'
        sound.stopBGM()
        break

      case 'gameUnpaused':
        if (pauseScreen) pauseScreen.classList.remove('visible')
        if (pauseButton) pauseButton.textContent = 'Pause'
        sound.playBGM()
        break

      case 'joinRequested':
        // Player 2 wants to join while game is paused — ask for consent
        showJoinRequest(message.fromPlayerId)
        break

      case 'joinDeclined':
        // Player 1 declined the join request
        break

      case 'playerDisconnected':
        // Hide rematch/pause screens if they were showing
        if (rematchScreen) rematchScreen.classList.remove('visible')
        if (pauseScreen) pauseScreen.classList.remove('visible')
        break
    }
  })

  networkClient.onDisconnect(() => {
    cleanup()
    // Show a brief disconnect message, then auto-reload to reconnect.
    // This handles server restarts cleanly — the page reloads and either
    // starts a new game or shows the join screen if another player is active.
    if (gameOverScreen) {
      gameOverScreen.querySelector('h1').textContent = 'Connection Lost'
      if (finalScoreText) finalScoreText.textContent = 'Reconnecting...'
      gameOverScreen.classList.add('visible')
      if (restartButton) restartButton.style.display = 'none'
    }
    setTimeout(() => window.location.reload(), 2000)
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
      drawEnemies(context, latestState.enemies, scaleX, scaleY, enemyVisualRadii)
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
    sound.playEffect('sounds/shoot.mp3', 0.3)
  }

  function handleSpacebarFire(keyEvent) {
    if (keyEvent.code === 'Space') {
      keyEvent.preventDefault()
      networkClient.sendFire(mouseServerX, mouseServerY)
      sound.playEffect('sounds/shoot.mp3', 0.3)
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
    // Show small spectator banner instead of full overlay so the player can watch
    if (spectatorBanner) {
      if (spectatorText) spectatorText.textContent = `You Died! Score: ${latestState.scores[myPlayerId] || 0} — Watching...`
      spectatorBanner.classList.add('visible')
    }
  }

  function showGameOver(scores) {
    // Hide spectator banner — full game over overlay takes over
    if (spectatorBanner) spectatorBanner.classList.remove('visible')

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

  // ─── Restart / Rematch ──────────────────────────────────────
  if (restartButton) {
    restartButton.onclick = () => {
      // Send restart request — server decides if it's instant or needs consent
      networkClient.sendRestart()
      // Update button text to show we're waiting
      restartButton.textContent = 'Waiting...'
      restartButton.disabled = true
    }
  }

  // ─── Request UI (shown to Player 1 for rematch or join requests) ────────
  let pendingRequestType = null // 'rematch' or 'join'

  function showRematchRequest(fromPlayerId) {
    pendingRequestType = 'rematch'
    if (rematchScreen) {
      rematchScreen.querySelector('h1').textContent = 'Rematch Requested!'
      const msg = rematchScreen.querySelector('#rematch-message')
      if (msg) msg.textContent = 'The other player wants a rematch.'
      rematchScreen.classList.add('visible')
    }
  }

  function showJoinRequest(fromPlayerId) {
    pendingRequestType = 'join'
    if (rematchScreen) {
      rematchScreen.querySelector('h1').textContent = 'Player Wants to Join!'
      const msg = rematchScreen.querySelector('#rematch-message')
      if (msg) msg.textContent = `${fromPlayerId.toUpperCase()} wants to join the game.`
      rematchScreen.classList.add('visible')
    }
  }

  if (spectatorRetryButton) {
    spectatorRetryButton.onclick = () => {
      networkClient.sendRestart()
      spectatorRetryButton.textContent = 'Waiting...'
      spectatorRetryButton.disabled = true
    }
  }

  if (acceptRematchButton) {
    acceptRematchButton.onclick = () => {
      if (rematchScreen) rematchScreen.classList.remove('visible')
      if (pendingRequestType === 'join') {
        networkClient.send({ type: 'acceptJoin' })
      } else {
        networkClient.sendAcceptRematch()
      }
      pendingRequestType = null
    }
  }

  if (declineRematchButton) {
    declineRematchButton.onclick = () => {
      if (rematchScreen) rematchScreen.classList.remove('visible')
      if (pendingRequestType === 'join') {
        networkClient.send({ type: 'declineJoin' })
      } else {
        networkClient.sendDeclineRematch()
      }
      pendingRequestType = null
    }
  }

  // ─── Cleanup ────────────────────────────────────────────────
  function cleanup() {
    if (animationId) cancelAnimationFrame(animationId)
    canvas.removeEventListener('click', handleCanvasClick)
    canvas.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('keydown', handleSpacebarFire)
    window.removeEventListener('keydown', handleEscapeKey)
    input.destroy()
    sound.destroy()
  }

  // ─── Pause Controls ────────────────────────────────────────
  function handleEscapeKey(keyEvent) {
    if (keyEvent.code === 'Escape') {
      networkClient.sendTogglePause()
    }
  }
  window.addEventListener('keydown', handleEscapeKey)

  if (pauseButton) {
    pauseButton.onclick = () => {
      networkClient.sendTogglePause()
    }
  }

  if (resumeButton) {
    resumeButton.onclick = () => {
      networkClient.sendTogglePause()
    }
  }

  // ─── Mute Button ───────────────────────────────────────────
  const muteButton = document.getElementById('mute-button')
  if (muteButton) {
    muteButton.onclick = () => {
      const muted = sound.toggleMute()
      muteButton.textContent = muted ? 'Unmute' : 'Mute'
    }
  }

  // ─── Start ──────────────────────────────────────────────────
  sound.playBGM()
  animate()
}
