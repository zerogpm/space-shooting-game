/**
 * GameSession — Manages a single game instance on the server.
 *
 * Wraps GameSim with server lifecycle: tick loop, enemy spawning,
 * level progression, and player management. Takes a broadcast callback
 * for sending messages to connected clients.
 */
import { GameSim } from '../src/simulation/GameSim.js'
import { CANVAS_WIDTH, CANVAS_HEIGHT, TICK_RATE, PLAYER_COLORS, PLAYER_RADIUS } from '../src/shared/constants.js'

export class GameSession {
  constructor(broadcast, sendToPlayer) {
    this.broadcast = broadcast
    // sendToPlayer(playerId, message) — sends to a specific player
    this.sendToPlayer = sendToPlayer
    this.gameSim = new GameSim(CANVAS_WIDTH, CANVAS_HEIGHT)
    this.playerInputs = new Map()
    this.paused = false
    this.pendingRematchFrom = null // playerId requesting rematch while other is alive

    this.tickIntervalId = null
    this.spawnTimerId = null
    this.levelTimerId = null
  }

  /**
   * Start the game session with the first player.
   * Sets up the tick loop, enemy spawning, and level progression.
   */
  start(playerId) {
    const color = PLAYER_COLORS[playerId] || 'white'
    const centerX = CANVAS_WIDTH / 2
    const centerY = CANVAS_HEIGHT / 2
    this.gameSim.addPlayer(playerId, centerX, centerY, color)

    this.startTickLoop()
    this.startSpawnLoop()
    this.startLevelTimer()
  }

  startTickLoop() {
    this.tickIntervalId = setInterval(() => {
      if (this.paused) return

      // Convert Map to plain object for GameSim.tick()
      const inputs = {}
      for (const [playerId, direction] of this.playerInputs) {
        inputs[playerId] = { direction }
      }

      const events = this.gameSim.tick(inputs)
      const state = this.gameSim.getStateSnapshot()

      this.broadcast({ type: 'state', state, events })

      // Check for deaths and notify
      for (const death of events.deaths) {
        this.broadcast({
          type: 'playerDied',
          playerId: death.playerId,
          killedBy: death.killedBy,
          attackerId: death.attackerId || null
        })
      }

      // Check if all players are dead
      const allDead = this.gameSim.players.every(player => !player.alive)
      if (allDead && this.gameSim.players.length > 0) {
        this.broadcast({
          type: 'gameOver',
          scores: { ...this.gameSim.scores },
          reason: 'allDead'
        })
        this.stopLoops()
      }
    }, 1000 / TICK_RATE)
  }

  startSpawnLoop() {
    const scheduleNext = () => {
      this.spawnTimerId = setTimeout(() => {
        if (!this.paused) {
          this.gameSim.spawnEnemy()
        }
        scheduleNext()
      }, this.gameSim.getSpawnDelay())
    }
    scheduleNext()
  }

  startLevelTimer() {
    this.levelTimerId = setInterval(() => {
      if (!this.paused) {
        this.gameSim.currentLevel++
      }
    }, 10000)
  }

  stopLoops() {
    if (this.tickIntervalId) clearInterval(this.tickIntervalId)
    if (this.spawnTimerId) clearTimeout(this.spawnTimerId)
    if (this.levelTimerId) clearInterval(this.levelTimerId)
    this.tickIntervalId = null
    this.spawnTimerId = null
    this.levelTimerId = null
  }

  /**
   * Handle Player 2 dropping into an active game.
   * Pauses the game, adds the player, triggers the challenger announcement,
   * then resumes after a dramatic delay.
   *
   * @param {string} playerId - The joining player's ID.
   * @param {Function} sendToPlayer - Callback to send a message to the joining player specifically.
   * @returns {Object} The state snapshot for the joining player.
   */
  handleJoinGame(playerId, sendToPlayer) {
    // Guard: don't add a player that already exists (e.g., after restart)
    if (this.gameSim.getPlayer(playerId)) {
      sendToPlayer({
        type: 'gameStart',
        state: this.gameSim.getStateSnapshot(),
        yourPlayerId: playerId
      })
      return this.gameSim.getStateSnapshot()
    }

    // Calculate a safe spawn position — opposite side from Player 1
    const player1 = this.gameSim.players[0]
    let spawnX = CANVAS_WIDTH / 4
    let spawnY = CANVAS_HEIGHT / 2

    if (player1 && player1.alive) {
      // Spawn on the opposite side of the canvas from Player 1
      spawnX = player1.positionX < CANVAS_WIDTH / 2
        ? CANVAS_WIDTH * 3 / 4
        : CANVAS_WIDTH / 4
      spawnY = player1.positionY < CANVAS_HEIGHT / 2
        ? CANVAS_HEIGHT * 3 / 4
        : CANVAS_HEIGHT / 4
    }

    const color = PLAYER_COLORS[playerId] || 'white'
    this.gameSim.addPlayer(playerId, spawnX, spawnY, color)

    // Pause the game for the dramatic announcement
    this.paused = true

    const state = this.gameSim.getStateSnapshot()

    // Send game state to the joining player
    sendToPlayer({
      type: 'gameStart',
      state,
      yourPlayerId: playerId
    })

    // Broadcast challenger announcement to all players
    this.broadcast({
      type: 'challengerJoined',
      newPlayerId: playerId,
      playerColor: color
    })

    // Resume after dramatic pause
    setTimeout(() => {
      this.paused = false
      this.broadcast({ type: 'challengerReady' })
    }, 2500)

    return state
  }

  /**
   * Store the latest input direction for a player.
   * Used on the next tick to update that player's position.
   */
  handleInput(playerId, direction) {
    this.playerInputs.set(playerId, direction)
  }

  /**
   * Fire a projectile for a player toward a target.
   */
  handleFire(playerId, targetX, targetY) {
    this.gameSim.fireProjectile(playerId, targetX, targetY)
  }

  /**
   * Remove a player from the game (on disconnect).
   */
  removePlayer(playerId) {
    const player = this.gameSim.getPlayer(playerId)
    if (player) {
      player.alive = false
    }
    this.playerInputs.delete(playerId)
  }

  /**
   * Restart the game with a fresh state.
   * Re-adds all provided player IDs at starting positions.
   *
   * @param {string[]} playerIds - IDs of currently connected players.
   */
  restart(playerIds) {
    this.stopLoops()
    this.gameSim = new GameSim(CANVAS_WIDTH, CANVAS_HEIGHT)
    this.playerInputs.clear()
    this.paused = false

    // Add players at spread-out starting positions
    const positions = [
      { positionX: CANVAS_WIDTH / 3, positionY: CANVAS_HEIGHT / 2 },
      { positionX: (CANVAS_WIDTH * 2) / 3, positionY: CANVAS_HEIGHT / 2 }
    ]

    playerIds.forEach((playerId, index) => {
      const pos = positions[index] || positions[0]
      const color = PLAYER_COLORS[playerId] || 'white'
      this.gameSim.addPlayer(playerId, pos.positionX, pos.positionY, color)
    })

    this.startTickLoop()
    this.startSpawnLoop()
    this.startLevelTimer()

    const state = this.gameSim.getStateSnapshot()
    return state
  }

  /**
   * Handle a restart request. Behavior depends on game state:
   * - All players dead → instant restart (no consent needed)
   * - Requester dead, other alive → ask the alive player for consent
   */
  handleRestartRequest(playerId) {
    const allDead = this.gameSim.players.every(player => !player.alive)

    if (allDead) {
      // Everyone is dead — restart immediately, no consent needed
      return 'restart'
    }

    // Requester is dead but other player is alive — need consent
    const requester = this.gameSim.getPlayer(playerId)
    if (requester && !requester.alive) {
      this.pendingRematchFrom = playerId

      // Find the alive player and ask them
      const alivePlayer = this.gameSim.players.find(player => player.alive)
      if (alivePlayer) {
        this.sendToPlayer(alivePlayer.id, {
          type: 'rematchRequested',
          fromPlayerId: playerId
        })
      }
      return 'pending'
    }

    return 'ignored'
  }

  /**
   * Handle the alive player accepting a rematch request.
   * Triggers a full game reset with challenger announcement.
   */
  handleAcceptRematch() {
    this.pendingRematchFrom = null
    return 'restart'
  }

  /**
   * Handle the alive player declining a rematch request.
   * Notifies the dead player that it was declined.
   */
  handleDeclineRematch() {
    if (this.pendingRematchFrom) {
      this.sendToPlayer(this.pendingRematchFrom, { type: 'rematchDeclined' })
      this.pendingRematchFrom = null
    }
  }

  /**
   * Get the current game state snapshot.
   */
  getStateSnapshot() {
    return this.gameSim.getStateSnapshot()
  }

  /**
   * Clean up all timers and state.
   */
  destroy() {
    this.stopLoops()
    this.playerInputs.clear()
  }
}
