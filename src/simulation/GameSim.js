/**
 * GameSim — Server-ready game simulation with no rendering dependencies.
 *
 * Manages the authoritative game state: players, enemies, projectiles,
 * scoring, difficulty progression, and collision detection.
 * The server runs tick() each frame; the client can also use it for prediction.
 *
 * No canvas, no DOM, no GSAP — pure game logic.
 */
import { PlayerSim } from './PlayerSim.js'
import { EnemySim } from './EnemySim.js'
import { ProjectileSim } from './ProjectileSim.js'
import { circlesCollide } from './CollisionHelper.js'

export class GameSim {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight

    this.players = []
    this.enemies = []
    this.projectiles = []

    this.scores = {}
    this.currentLevel = 1

    // Auto-incrementing IDs for tracking entities across the network
    this.nextEnemyId = 1
    this.nextProjectileId = 1
  }

  /**
   * Add a player to the simulation.
   *
   * @param {string} playerId - Unique identifier for this player.
   * @param {number} positionX - Starting X position.
   * @param {number} positionY - Starting Y position.
   * @param {string} color - Player color for rendering.
   */
  addPlayer(playerId, positionX, positionY, color) {
    const playerSim = new PlayerSim(positionX, positionY, 10, color)
    playerSim.id = playerId
    this.players.push(playerSim)
    this.scores[playerId] = 0
  }

  /**
   * Get a player by their ID.
   *
   * @param {string} playerId - The player's unique identifier.
   * @returns {PlayerSim|undefined}
   */
  getPlayer(playerId) {
    return this.players.find(player => player.id === playerId)
  }

  /**
   * Calculate how often enemies spawn at the current level.
   * Starts at 1000ms and decreases by 75ms each level, minimum 200ms.
   */
  getSpawnDelay() {
    return Math.max(200, 1000 - (this.currentLevel - 1) * 75)
  }

  /**
   * Calculate how fast enemies move at the current level.
   * Starts at 1x speed and increases by 0.2 each level.
   */
  getEnemySpeed() {
    return 1 + (this.currentLevel - 1) * 0.2
  }

  /**
   * Spawn an enemy at a random canvas edge, aimed at a random alive player.
   * Returns the spawned enemy for event broadcasting, or null if no alive players.
   */
  spawnEnemy() {
    const alivePlayers = this.players.filter(player => player.alive)
    if (alivePlayers.length === 0) return null

    // Pick a random alive player to aim at
    const targetPlayer = alivePlayers[Math.floor(Math.random() * alivePlayers.length)]

    const radius = Math.random() * (30 - 4) + 4

    let spawnX
    let spawnY

    if (Math.random() < 0.5) {
      spawnX = Math.random() < 0.5 ? 0 - radius : this.canvasWidth + radius
      spawnY = Math.random() * this.canvasHeight
    } else {
      spawnX = Math.random() * this.canvasWidth
      spawnY = Math.random() < 0.5 ? 0 - radius : this.canvasHeight + radius
    }

    const color = `hsl(${Math.random() * 360}, 50%, 50%)`

    const angleToTarget = Math.atan2(
      targetPlayer.positionY - spawnY,
      targetPlayer.positionX - spawnX
    )

    const speedMultiplier = this.getEnemySpeed()
    const velocity = {
      horizontal: Math.cos(angleToTarget) * speedMultiplier,
      vertical: Math.sin(angleToTarget) * speedMultiplier
    }

    const enemyId = this.nextEnemyId++
    const enemy = new EnemySim(enemyId, spawnX, spawnY, radius, color, velocity)
    this.enemies.push(enemy)
    return enemy
  }

  /**
   * Create a projectile fired by a player toward a target position.
   *
   * @param {string} playerId - Who fired this projectile.
   * @param {number} targetX - Target X coordinate.
   * @param {number} targetY - Target Y coordinate.
   * @returns {ProjectileSim} The created projectile.
   */
  fireProjectile(playerId, targetX, targetY) {
    const player = this.getPlayer(playerId)
    if (!player || !player.alive) return null

    const angleToTarget = Math.atan2(
      targetY - player.positionY,
      targetX - player.positionX
    )

    const velocity = {
      horizontal: Math.cos(angleToTarget) * 5,
      vertical: Math.sin(angleToTarget) * 5
    }

    const projectileId = this.nextProjectileId++
    const projectile = new ProjectileSim(
      projectileId,
      player.positionX,
      player.positionY,
      5,
      player.color,
      velocity,
      playerId
    )
    this.projectiles.push(projectile)
    return projectile
  }

  /**
   * Run one frame of the game simulation.
   * Updates all entities, checks collisions, and returns events that occurred.
   *
   * @param {Object} playerInputs - Map of playerId → { direction: { directionX, directionY } }
   * @returns {Object} Events from this tick: { hits: [], deaths: [], removedProjectiles: [], removedEnemies: [] }
   */
  tick(playerInputs = {}) {
    const events = {
      hits: [],
      deaths: [],
      removedProjectiles: [],
      removedEnemies: []
    }

    // Update players from their inputs
    for (const player of this.players) {
      if (!player.alive) continue
      const input = playerInputs[player.id]
      if (input && input.direction) {
        player.update(input.direction, this.canvasWidth, this.canvasHeight)
      }
    }

    // Update projectiles, remove off-screen ones
    for (let index = this.projectiles.length - 1; index >= 0; index--) {
      const projectile = this.projectiles[index]
      projectile.update()

      const isOffScreen =
        projectile.positionX + projectile.radius < 0 ||
        projectile.positionX - projectile.radius > this.canvasWidth ||
        projectile.positionY + projectile.radius < 0 ||
        projectile.positionY - projectile.radius > this.canvasHeight

      if (isOffScreen) {
        events.removedProjectiles.push(projectile.id)
        this.projectiles.splice(index, 1)
      }
    }

    // Update enemies and check collisions
    for (let enemyIndex = this.enemies.length - 1; enemyIndex >= 0; enemyIndex--) {
      const enemy = this.enemies[enemyIndex]
      enemy.update()

      // Check enemy-player collisions
      for (const player of this.players) {
        if (!player.alive) continue
        if (circlesCollide(player, enemy)) {
          player.alive = false
          events.deaths.push({ playerId: player.id, killedBy: 'enemy', enemyId: enemy.id })
        }
      }

      // Check projectile-enemy collisions
      for (let projIndex = this.projectiles.length - 1; projIndex >= 0; projIndex--) {
        const projectile = this.projectiles[projIndex]

        if (circlesCollide(projectile, enemy)) {
          if (enemy.radius - 10 > 5) {
            // Shrink the enemy — no GSAP on server, instant change
            enemy.radius -= 10
            this.scores[projectile.ownerId] = (this.scores[projectile.ownerId] || 0) + 10
            events.hits.push({
              type: 'shrink',
              enemyId: enemy.id,
              positionX: enemy.positionX,
              positionY: enemy.positionY,
              color: enemy.color,
              particleCount: 8,
              newRadius: enemy.radius
            })
            events.removedProjectiles.push(projectile.id)
            this.projectiles.splice(projIndex, 1)
          } else {
            // Destroy the enemy
            this.scores[projectile.ownerId] = (this.scores[projectile.ownerId] || 0) + 100
            events.hits.push({
              type: 'kill',
              enemyId: enemy.id,
              positionX: enemy.positionX,
              positionY: enemy.positionY,
              color: enemy.color,
              particleCount: 24
            })
            events.removedEnemies.push(enemy.id)
            events.removedProjectiles.push(projectile.id)
            this.enemies.splice(enemyIndex, 1)
            this.projectiles.splice(projIndex, 1)
            break
          }
        }
      }
    }

    // Check projectile-player collisions (PvP — a player's projectile can hit the other player)
    for (let projIndex = this.projectiles.length - 1; projIndex >= 0; projIndex--) {
      const projectile = this.projectiles[projIndex]

      for (const player of this.players) {
        if (!player.alive) continue
        // A player's own projectiles can't hit themselves
        if (projectile.ownerId === player.id) continue

        if (circlesCollide(projectile, player)) {
          player.alive = false
          events.deaths.push({ playerId: player.id, killedBy: 'player', attackerId: projectile.ownerId })
          events.removedProjectiles.push(projectile.id)
          this.projectiles.splice(projIndex, 1)
          break
        }
      }
    }

    return events
  }

  /**
   * Get a serializable snapshot of the entire game state.
   * Used for sending state to clients over WebSocket.
   */
  getStateSnapshot() {
    return {
      players: this.players.map(player => ({
        id: player.id,
        positionX: player.positionX,
        positionY: player.positionY,
        radius: player.radius,
        color: player.color,
        alive: player.alive
      })),
      enemies: this.enemies.map(enemy => ({
        id: enemy.id,
        positionX: enemy.positionX,
        positionY: enemy.positionY,
        radius: enemy.radius,
        color: enemy.color
      })),
      projectiles: this.projectiles.map(projectile => ({
        id: projectile.id,
        positionX: projectile.positionX,
        positionY: projectile.positionY,
        radius: projectile.radius,
        color: projectile.color,
        ownerId: projectile.ownerId
      })),
      scores: { ...this.scores },
      level: this.currentLevel
    }
  }
}
