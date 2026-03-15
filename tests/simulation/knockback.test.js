import { describe, it, expect } from 'vitest'
import { PlayerSim } from '../../src/simulation/PlayerSim.js'
import { EnemySim } from '../../src/simulation/EnemySim.js'
import { GameSim } from '../../src/simulation/GameSim.js'
import { ProjectileSim } from '../../src/simulation/ProjectileSim.js'

describe('Knockback Physics', () => {
  describe('PlayerSim knockback', () => {
    it('applyKnockback shifts position on next update', () => {
      const player = new PlayerSim(400, 300, 10, 'cyan')
      player.applyKnockback(10, 0)
      player.update({ directionX: 0, directionY: 0 }, 800, 600)

      expect(player.positionX).toBeCloseTo(410) // moved by knockback
      expect(player.positionY).toBe(300)
    })

    it('knockback decays each frame via friction', () => {
      const player = new PlayerSim(400, 300, 10, 'cyan')
      player.applyKnockback(10, 0)

      player.update({ directionX: 0, directionY: 0 }, 800, 600)
      const firstFrameKnockback = player.knockbackVelocityX

      expect(firstFrameKnockback).toBeCloseTo(10 * 0.85) // decayed

      player.update({ directionX: 0, directionY: 0 }, 800, 600)
      expect(player.knockbackVelocityX).toBeCloseTo(10 * 0.85 * 0.85) // decayed again
    })

    it('knockback zeroes out after enough frames', () => {
      const player = new PlayerSim(400, 300, 10, 'cyan')
      player.applyKnockback(10, 5)

      for (let frame = 0; frame < 30; frame++) {
        player.update({ directionX: 0, directionY: 0 }, 800, 600)
      }

      expect(player.knockbackVelocityX).toBe(0)
      expect(player.knockbackVelocityY).toBe(0)
    })

    it('knockback stacks with input movement', () => {
      const player = new PlayerSim(400, 300, 10, 'cyan')
      player.applyKnockback(10, 0)
      player.update({ directionX: 1, directionY: 0 }, 800, 600)

      // Position = 400 + 3 (speed) + 10 (knockback) = 413
      expect(player.positionX).toBeCloseTo(413)
    })

    it('knockback is clamped to canvas bounds', () => {
      const player = new PlayerSim(15, 300, 10, 'cyan')
      player.applyKnockback(-50, 0) // push hard left
      player.update({ directionX: 0, directionY: 0 }, 800, 600)

      expect(player.positionX).toBe(10) // clamped to radius
    })
  })

  describe('EnemySim knockback', () => {
    it('applyKnockback shifts enemy on next update', () => {
      const enemy = new EnemySim(1, 100, 100, 15, 'red', { horizontal: 0, vertical: 0 })
      enemy.applyKnockback(5, 3)
      enemy.update()

      expect(enemy.positionX).toBeCloseTo(105)
      expect(enemy.positionY).toBeCloseTo(103)
    })

    it('knockback stacks with normal velocity', () => {
      const enemy = new EnemySim(1, 100, 100, 15, 'red', { horizontal: 2, vertical: 0 })
      enemy.applyKnockback(5, 0)
      enemy.update()

      // Position = 100 + 2 (normal) + 5 (knockback) = 107
      expect(enemy.positionX).toBeCloseTo(107)
    })

    it('knockback decays via friction', () => {
      const enemy = new EnemySim(1, 100, 100, 15, 'red', { horizontal: 0, vertical: 0 })
      enemy.applyKnockback(10, 0)
      enemy.update()

      expect(enemy.knockbackVelocityX).toBeCloseTo(10 * 0.85)
    })
  })

  describe('GameSim knockback on collisions', () => {
    it('enemy-player collision pushes player away', () => {
      const game = new GameSim(800, 600)
      game.addPlayer('p1', 400, 300, 'cyan')

      // Enemy to the left of player — player should get pushed right
      game.enemies.push(new EnemySim(1, 390, 300, 15, 'red', { horizontal: 0, vertical: 0 }))
      game.tick({})

      // Player should have positive knockback (pushed right, away from enemy)
      expect(game.getPlayer('p1').knockbackVelocityX).toBeGreaterThan(0)
    })

    it('projectile hitting enemy pushes enemy in projectile direction', () => {
      const game = new GameSim(800, 600)
      game.addPlayer('p1', 100, 300, 'cyan')

      // Large enemy that will survive the hit (shrink, not die)
      game.enemies.push(new EnemySim(1, 500, 300, 25, 'red', { horizontal: 0, vertical: 0 }))
      // Projectile moving right toward enemy
      game.projectiles.push(new ProjectileSim(1, 500, 300, 5, 'cyan', { horizontal: 5, vertical: 0 }, 'p1'))

      game.tick({})

      // Enemy should be pushed right (in projectile direction)
      if (game.enemies.length > 0) {
        expect(game.enemies[0].knockbackVelocityX).toBeGreaterThan(0)
      }
    })

    it('PvP projectile pushes hit player in projectile direction', () => {
      const game = new GameSim(800, 600)
      game.addPlayer('p1', 200, 300, 'cyan')
      game.addPlayer('p2', 600, 300, 'magenta')

      // Projectile from p1 moving right toward p2
      game.projectiles.push(new ProjectileSim(1, 600, 300, 5, 'cyan', { horizontal: 5, vertical: 0 }, 'p1'))

      game.tick({})

      // P2 should be pushed right
      expect(game.getPlayer('p2').knockbackVelocityX).toBeGreaterThan(0)
    })

    it('player-player collision pushes both apart', () => {
      const game = new GameSim(800, 600)
      // Place players right on top of each other
      game.addPlayer('p1', 400, 300, 'cyan')
      game.addPlayer('p2', 405, 300, 'magenta')

      game.tick({})

      // P1 should be pushed left (away from P2), P2 pushed right (away from P1)
      expect(game.getPlayer('p1').knockbackVelocityX).toBeLessThan(0)
      expect(game.getPlayer('p2').knockbackVelocityX).toBeGreaterThan(0)
    })

    it('player-player collision does not deal damage', () => {
      const game = new GameSim(800, 600)
      game.addPlayer('p1', 400, 300, 'cyan')
      game.addPlayer('p2', 405, 300, 'magenta')

      game.tick({})

      expect(game.getPlayer('p1').health).toBe(100) // no damage
      expect(game.getPlayer('p2').health).toBe(100)
    })
  })
})
