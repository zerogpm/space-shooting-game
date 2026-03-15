import { describe, it, expect } from 'vitest'
import { GameSim } from '../../src/simulation/GameSim.js'
import { EnemySim } from '../../src/simulation/EnemySim.js'
import { ProjectileSim } from '../../src/simulation/ProjectileSim.js'

describe('GameSim', () => {
  const canvasWidth = 800
  const canvasHeight = 600

  function createGame() {
    const game = new GameSim(canvasWidth, canvasHeight)
    game.addPlayer('p1', 200, 300, 'cyan')
    game.addPlayer('p2', 600, 300, 'magenta')
    return game
  }

  describe('initialization', () => {
    it('creates a game with correct dimensions', () => {
      const game = new GameSim(canvasWidth, canvasHeight)

      expect(game.canvasWidth).toBe(800)
      expect(game.canvasHeight).toBe(600)
      expect(game.players).toHaveLength(0)
      expect(game.enemies).toHaveLength(0)
      expect(game.projectiles).toHaveLength(0)
      expect(game.currentLevel).toBe(1)
    })

    it('adds players with correct properties', () => {
      const game = createGame()

      expect(game.players).toHaveLength(2)
      expect(game.players[0].id).toBe('p1')
      expect(game.players[0].positionX).toBe(200)
      expect(game.players[0].color).toBe('cyan')
      expect(game.players[1].id).toBe('p2')
      expect(game.players[1].positionX).toBe(600)
      expect(game.scores.p1).toBe(0)
      expect(game.scores.p2).toBe(0)
    })

    it('getPlayer returns the correct player', () => {
      const game = createGame()

      expect(game.getPlayer('p1').positionX).toBe(200)
      expect(game.getPlayer('p2').positionX).toBe(600)
      expect(game.getPlayer('nonexistent')).toBeUndefined()
    })
  })

  describe('difficulty scaling', () => {
    it('level 1: spawn delay 1000ms, speed 1.0', () => {
      const game = new GameSim(canvasWidth, canvasHeight)

      expect(game.getSpawnDelay()).toBe(1000)
      expect(game.getEnemySpeed()).toBe(1)
    })

    it('level 5: spawn delay 700ms, speed 1.8', () => {
      const game = new GameSim(canvasWidth, canvasHeight)
      game.currentLevel = 5

      expect(game.getSpawnDelay()).toBe(700)
      expect(game.getEnemySpeed()).toBeCloseTo(1.8)
    })

    it('spawn delay has a minimum of 200ms', () => {
      const game = new GameSim(canvasWidth, canvasHeight)
      game.currentLevel = 20

      expect(game.getSpawnDelay()).toBe(200)
    })
  })

  describe('enemy spawning', () => {
    it('spawns an enemy and adds it to the array', () => {
      const game = createGame()
      const enemy = game.spawnEnemy()

      expect(enemy).not.toBeNull()
      expect(game.enemies).toHaveLength(1)
      expect(enemy.id).toBe(1)
    })

    it('assigns incrementing IDs to enemies', () => {
      const game = createGame()
      const enemy1 = game.spawnEnemy()
      const enemy2 = game.spawnEnemy()

      expect(enemy1.id).toBe(1)
      expect(enemy2.id).toBe(2)
    })

    it('returns null when no alive players', () => {
      const game = createGame()
      game.players[0].alive = false
      game.players[1].alive = false

      expect(game.spawnEnemy()).toBeNull()
    })

    it('spawns enemy with valid radius between 4 and 30', () => {
      const game = createGame()

      for (let attempt = 0; attempt < 20; attempt++) {
        const enemy = game.spawnEnemy()
        expect(enemy.radius).toBeGreaterThanOrEqual(4)
        expect(enemy.radius).toBeLessThanOrEqual(30)
      }
    })
  })

  describe('firing projectiles', () => {
    it('creates a projectile from the player position', () => {
      const game = createGame()
      const projectile = game.fireProjectile('p1', 400, 300)

      expect(projectile).not.toBeNull()
      expect(game.projectiles).toHaveLength(1)
      expect(projectile.positionX).toBe(200) // player p1 position
      expect(projectile.positionY).toBe(300)
      expect(projectile.ownerId).toBe('p1')
    })

    it('assigns incrementing IDs to projectiles', () => {
      const game = createGame()
      const proj1 = game.fireProjectile('p1', 500, 300)
      const proj2 = game.fireProjectile('p2', 100, 300)

      expect(proj1.id).toBe(1)
      expect(proj2.id).toBe(2)
    })

    it('returns null for dead player', () => {
      const game = createGame()
      game.players[0].alive = false

      expect(game.fireProjectile('p1', 500, 300)).toBeNull()
    })

    it('returns null for nonexistent player', () => {
      const game = createGame()

      expect(game.fireProjectile('nobody', 500, 300)).toBeNull()
    })

    it('projectile velocity points toward target', () => {
      const game = createGame()
      // p1 is at (200, 300), fire toward (700, 300) — straight right
      const projectile = game.fireProjectile('p1', 700, 300)

      expect(projectile.velocity.horizontal).toBeCloseTo(5)
      expect(projectile.velocity.vertical).toBeCloseTo(0)
    })
  })

  describe('tick — player movement', () => {
    it('moves player based on input', () => {
      const game = createGame()
      game.tick({ p1: { direction: { directionX: 1, directionY: 0 } } })

      expect(game.getPlayer('p1').positionX).toBe(203) // 200 + 3
    })

    it('does not move dead player', () => {
      const game = createGame()
      game.players[0].alive = false
      game.tick({ p1: { direction: { directionX: 1, directionY: 0 } } })

      expect(game.getPlayer('p1').positionX).toBe(200) // unchanged
    })

    it('does not move player without input', () => {
      const game = createGame()
      game.tick({})

      expect(game.getPlayer('p1').positionX).toBe(200)
    })
  })

  describe('tick — projectile removal', () => {
    it('removes off-screen projectiles', () => {
      const game = createGame()
      game.fireProjectile('p1', 700, 300) // fires rightward

      // Move projectile far off screen
      game.projectiles[0].positionX = canvasWidth + 100

      const events = game.tick({})

      expect(game.projectiles).toHaveLength(0)
      expect(events.removedProjectiles).toHaveLength(1)
    })
  })

  describe('tick — enemy-player collision', () => {
    it('kills player when enemy overlaps', () => {
      const game = createGame()
      // Place enemy right on top of player 1
      game.enemies.push(
        new EnemySim(99, 200, 300, 10, 'red', { horizontal: 0, vertical: 0 })
      )

      const events = game.tick({})

      expect(game.getPlayer('p1').alive).toBe(false)
      expect(events.deaths).toHaveLength(1)
      expect(events.deaths[0].playerId).toBe('p1')
      expect(events.deaths[0].killedBy).toBe('enemy')
    })
  })

  describe('tick — projectile-enemy collision (shrink)', () => {
    it('shrinks large enemy on hit and awards 10 points', () => {
      const game = createGame()

      game.enemies.push(new EnemySim(99, 500, 500, 25, 'blue', { horizontal: 0, vertical: 0 }))
      game.projectiles.push(new ProjectileSim(99, 500, 500, 5, 'cyan', { horizontal: 0, vertical: 0 }, 'p1'))

      const events = game.tick({})

      expect(game.enemies).toHaveLength(1) // enemy survives
      expect(game.enemies[0].radius).toBe(15) // shrunk by 10
      expect(game.scores.p1).toBe(10)
      expect(events.hits).toHaveLength(1)
      expect(events.hits[0].type).toBe('shrink')
      expect(game.projectiles).toHaveLength(0) // projectile consumed
    })
  })

  describe('tick — projectile-enemy collision (kill)', () => {
    it('destroys small enemy on hit and awards 100 points', () => {
      const game = createGame()

      game.enemies.push(new EnemySim(99, 500, 500, 8, 'blue', { horizontal: 0, vertical: 0 }))
      game.projectiles.push(new ProjectileSim(99, 500, 500, 5, 'cyan', { horizontal: 0, vertical: 0 }, 'p1'))

      const events = game.tick({})

      expect(game.enemies).toHaveLength(0) // enemy destroyed
      expect(game.scores.p1).toBe(100)
      expect(events.hits).toHaveLength(1)
      expect(events.hits[0].type).toBe('kill')
      expect(events.hits[0].particleCount).toBe(24)
    })
  })

  describe('tick — PvP projectile-player collision', () => {
    it('kills player when hit by opponent projectile', () => {
      const game = createGame()
      // p1's projectile placed right on p2
      game.projectiles.push(new ProjectileSim(99, 600, 300, 5, 'cyan', { horizontal: 0, vertical: 0 }, 'p1'))

      const events = game.tick({})

      expect(game.getPlayer('p2').alive).toBe(false)
      expect(events.deaths).toHaveLength(1)
      expect(events.deaths[0].playerId).toBe('p2')
      expect(events.deaths[0].killedBy).toBe('player')
      expect(events.deaths[0].attackerId).toBe('p1')
    })

    it('player own projectile does not hit themselves', () => {
      const game = createGame()
      // p1's projectile placed right on p1 — should NOT hit
      game.projectiles.push(new ProjectileSim(99, 200, 300, 5, 'cyan', { horizontal: 0, vertical: 0 }, 'p1'))

      const events = game.tick({})

      expect(game.getPlayer('p1').alive).toBe(true)
      expect(events.deaths).toHaveLength(0)
    })
  })

  describe('getStateSnapshot', () => {
    it('returns serializable state with all entities', () => {
      const game = createGame()
      game.spawnEnemy()
      game.fireProjectile('p1', 500, 300)
      game.scores.p1 = 50

      const snapshot = game.getStateSnapshot()

      expect(snapshot.players).toHaveLength(2)
      expect(snapshot.players[0].id).toBe('p1')
      expect(snapshot.enemies).toHaveLength(1)
      expect(snapshot.projectiles).toHaveLength(1)
      expect(snapshot.projectiles[0].ownerId).toBe('p1')
      expect(snapshot.scores.p1).toBe(50)
      expect(snapshot.level).toBe(1)
    })

    it('snapshot is JSON-serializable', () => {
      const game = createGame()
      const snapshot = game.getStateSnapshot()

      const serialized = JSON.stringify(snapshot)
      const deserialized = JSON.parse(serialized)

      expect(deserialized.players).toHaveLength(2)
      expect(deserialized.scores.p1).toBe(0)
    })
  })
})
