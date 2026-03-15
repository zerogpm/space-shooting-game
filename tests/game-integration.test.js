import { describe, it, expect } from 'vitest'
import { Player } from '../src/Player.js'
import { Enemy } from '../src/Enemy.js'
import { Projectile } from '../src/Projectile.js'
import { Particle } from '../src/Particle.js'
import { ScoreManager } from '../src/ScoreManager.js'
import { createMockContext } from './helpers/mockContext.js'

/**
 * Mirrors the collision formula from game.js.
 */
function circlesCollide(entityA, entityB) {
  const distance = Math.hypot(
    entityA.positionX - entityB.positionX,
    entityA.positionY - entityB.positionY
  )
  return distance - entityA.radius - entityB.radius < 1
}

/**
 * Mirrors the difficulty scaling from game.js (lines 68-80).
 */
function getSpawnDelay(currentLevel) {
  return Math.max(200, 1000 - (currentLevel - 1) * 75)
}

function getEnemySpeed(currentLevel) {
  return 1 + (currentLevel - 1) * 0.2
}

describe('Game Integration', () => {
  const context = createMockContext()
  const canvasWidth = 800
  const canvasHeight = 600

  describe('Projectile hits large enemy — enemy shrinks', () => {
    it('detects collision and enemy survives with smaller radius', () => {
      const enemy = new Enemy(context, 100, 100, 25, 'hsl(0,50%,50%)', { horizontal: 0, vertical: 0 })
      const projectile = new Projectile(context, 100, 100, 5, 'white', { horizontal: 0, vertical: 0 })

      expect(circlesCollide(projectile, enemy)).toBe(true)
      // game.js line 254: if (enemy.radius - 10 > 5) → shrink
      expect(enemy.radius - 10).toBeGreaterThan(5)

      // Simulate the shrink (in game.js this is done via GSAP animation)
      enemy.radius -= 10
      expect(enemy.radius).toBe(15)
    })
  })

  describe('Projectile hits small enemy — enemy destroyed', () => {
    it('detects collision and enemy is too small to shrink', () => {
      const enemy = new Enemy(context, 100, 100, 8, 'hsl(0,50%,50%)', { horizontal: 0, vertical: 0 })
      const projectile = new Projectile(context, 100, 100, 5, 'white', { horizontal: 0, vertical: 0 })

      expect(circlesCollide(projectile, enemy)).toBe(true)
      // game.js line 254: if (enemy.radius - 10 > 5) is false → destroy
      expect(enemy.radius - 10).not.toBeGreaterThan(5)
    })
  })

  describe('Projectile misses enemy', () => {
    it('no collision when far apart', () => {
      const enemy = new Enemy(context, 100, 100, 15, 'hsl(0,50%,50%)', { horizontal: 1, vertical: 0 })
      const projectile = new Projectile(context, 500, 500, 5, 'white', { horizontal: -1, vertical: 0 })

      expect(circlesCollide(projectile, enemy)).toBe(false)
    })
  })

  describe('Enemy reaches player — game over', () => {
    it('detects collision between enemy and player', () => {
      const player = new Player(context, 400, 300, 10, 'white')
      const enemy = new Enemy(context, 405, 300, 10, 'hsl(0,50%,50%)', { horizontal: -1, vertical: 0 })

      expect(circlesCollide(player, enemy)).toBe(true)
    })

    it('no game over when enemy is still far from player', () => {
      const player = new Player(context, 400, 300, 10, 'white')
      const enemy = new Enemy(context, 100, 100, 10, 'hsl(0,50%,50%)', { horizontal: 1, vertical: 1 })

      expect(circlesCollide(player, enemy)).toBe(false)
    })
  })

  describe('Projectile off-screen detection', () => {
    it('detects projectile leaving right edge', () => {
      const projectile = new Projectile(context, canvasWidth + 10, 300, 5, 'white', { horizontal: 5, vertical: 0 })

      const isOffScreen =
        projectile.positionX + projectile.radius < 0 ||
        projectile.positionX - projectile.radius > canvasWidth ||
        projectile.positionY + projectile.radius < 0 ||
        projectile.positionY - projectile.radius > canvasHeight

      expect(isOffScreen).toBe(true)
    })

    it('detects projectile leaving left edge', () => {
      const projectile = new Projectile(context, -10, 300, 5, 'white', { horizontal: -5, vertical: 0 })

      const isOffScreen = projectile.positionX + projectile.radius < 0
      expect(isOffScreen).toBe(true)
    })

    it('projectile on screen is not removed', () => {
      const projectile = new Projectile(context, 400, 300, 5, 'white', { horizontal: 5, vertical: 0 })

      const isOffScreen =
        projectile.positionX + projectile.radius < 0 ||
        projectile.positionX - projectile.radius > canvasWidth ||
        projectile.positionY + projectile.radius < 0 ||
        projectile.positionY - projectile.radius > canvasHeight

      expect(isOffScreen).toBe(false)
    })
  })

  describe('Difficulty scaling', () => {
    it('level 1: spawn delay 1000ms, speed 1.0', () => {
      expect(getSpawnDelay(1)).toBe(1000)
      expect(getEnemySpeed(1)).toBe(1)
    })

    it('level 5: spawn delay 700ms, speed 1.8', () => {
      expect(getSpawnDelay(5)).toBe(700)
      expect(getEnemySpeed(5)).toBeCloseTo(1.8)
    })

    it('level 11: spawn delay 250ms, speed 3.0', () => {
      expect(getSpawnDelay(11)).toBe(250)
      expect(getEnemySpeed(11)).toBeCloseTo(3.0)
    })

    it('level 15+: spawn delay hits minimum 200ms', () => {
      expect(getSpawnDelay(15)).toBe(200)
      expect(getSpawnDelay(20)).toBe(200)
      expect(getEnemySpeed(15)).toBeCloseTo(3.8)
    })
  })

  describe('Score accumulation across multiple hits', () => {
    it('3 shrinks + 1 kill = 130 points', () => {
      const scoreManager = new ScoreManager(context)

      scoreManager.addShrinkPoints()
      scoreManager.addShrinkPoints()
      scoreManager.addShrinkPoints()
      scoreManager.addKillPoints()

      expect(scoreManager.score).toBe(130)
    })
  })

  describe('Particle explosion simulation', () => {
    it('spawning particles at collision point creates burst effect', () => {
      const collisionX = 200
      const collisionY = 150
      const enemyColor = 'hsl(120, 50%, 50%)'
      const particles = []

      // Simulate spawnExplosion from game.js (lines 149-163)
      const particleCount = 24
      for (let index = 0; index < particleCount; index++) {
        const randomAngle = Math.random() * Math.PI * 2
        const randomSpeed = Math.random() * 5 + 1
        const velocity = {
          horizontal: Math.cos(randomAngle) * randomSpeed,
          vertical: Math.sin(randomAngle) * randomSpeed,
        }
        const particleRadius = Math.random() * 2 + 1
        particles.push(new Particle(context, collisionX, collisionY, particleRadius, enemyColor, velocity))
      }

      expect(particles).toHaveLength(24)

      // All particles start at the collision point
      for (const particle of particles) {
        expect(particle.positionX).toBe(collisionX)
        expect(particle.positionY).toBe(collisionY)
        expect(particle.alpha).toBe(1)
      }

      // After one update, particles have moved away from collision point
      for (const particle of particles) {
        particle.update()
      }

      const movedParticles = particles.filter(
        (particle) => particle.positionX !== collisionX || particle.positionY !== collisionY
      )
      expect(movedParticles.length).toBeGreaterThan(0)
    })
  })

  describe('Enemy spawn positioning', () => {
    it('enemy aimed at player moves toward player over time', () => {
      const playerX = 400
      const playerY = 300
      const spawnX = 0
      const spawnY = 300

      // Simulate angle and velocity calculation from game.js (lines 114-127)
      const angleToPlayer = Math.atan2(playerY - spawnY, playerX - spawnX)
      const speedMultiplier = 1
      const velocity = {
        horizontal: Math.cos(angleToPlayer) * speedMultiplier,
        vertical: Math.sin(angleToPlayer) * speedMultiplier,
      }

      const enemy = new Enemy(context, spawnX, spawnY, 10, 'red', velocity)

      // Enemy should move rightward (positive X) toward player at (400, 300)
      expect(velocity.horizontal).toBeGreaterThan(0)
      expect(velocity.vertical).toBeCloseTo(0)

      const initialDistance = Math.hypot(playerX - enemy.positionX, playerY - enemy.positionY)
      for (let frame = 0; frame < 10; frame++) {
        enemy.update()
      }
      const newDistance = Math.hypot(playerX - enemy.positionX, playerY - enemy.positionY)

      expect(newDistance).toBeLessThan(initialDistance)
    })
  })
})
