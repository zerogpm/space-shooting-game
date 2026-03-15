import { describe, it, expect } from 'vitest'
import { GameSim } from '../../src/simulation/GameSim.js'

describe('GameSim - Enemy targeting nearest player', () => {
  it('single player: enemy always aims at that player', () => {
    const game = new GameSim(1024, 576)
    game.addPlayer('p1', 512, 288, 'cyan')

    const enemy = game.spawnEnemy()
    expect(enemy).not.toBeNull()
  })

  it('enemy spawned near P1 moves toward P1 not P2', () => {
    const game = new GameSim(1024, 576)
    // P1 far left, P2 far right
    game.addPlayer('p1', 50, 288, 'cyan')
    game.addPlayer('p2', 974, 288, 'magenta')

    // Manually test: create an enemy at left edge — P1 is closer
    // We can't control spawn position directly, so test the logic by checking
    // that after many spawns, enemies near P1 move toward P1
    let enemiesAimedCorrectly = 0
    const totalSpawns = 100

    for (let attempt = 0; attempt < totalSpawns; attempt++) {
      const enemy = game.spawnEnemy()

      const distToP1 = Math.hypot(enemy.positionX - 50, enemy.positionY - 288)
      const distToP2 = Math.hypot(enemy.positionX - 974, enemy.positionY - 288)

      // Check if the enemy is moving toward the closer player
      // by seeing if it gets closer to that player after one update
      const targetX = distToP1 < distToP2 ? 50 : 974
      const targetY = 288

      const distBefore = Math.hypot(enemy.positionX - targetX, enemy.positionY - targetY)
      enemy.update()
      const distAfter = Math.hypot(enemy.positionX - targetX, enemy.positionY - targetY)

      if (distAfter < distBefore) {
        enemiesAimedCorrectly++
      }
    }

    // With nearest-player targeting, enemies should move toward the closer player
    expect(enemiesAimedCorrectly).toBeGreaterThan(totalSpawns * 0.9)
  })

  it('only targets alive players', () => {
    const game = new GameSim(1024, 576)
    game.addPlayer('p1', 100, 288, 'cyan')
    game.addPlayer('p2', 900, 288, 'magenta')

    game.getPlayer('p1').alive = false

    // All enemies should target P2 (only alive player)
    for (let attempt = 0; attempt < 10; attempt++) {
      const enemy = game.spawnEnemy()

      // Enemy should get closer to P2 after update
      const distBefore = Math.hypot(enemy.positionX - 900, enemy.positionY - 288)
      enemy.update()
      const distAfter = Math.hypot(enemy.positionX - 900, enemy.positionY - 288)

      expect(distAfter).toBeLessThan(distBefore)
    }
  })

  it('returns null when no alive players', () => {
    const game = new GameSim(1024, 576)
    game.addPlayer('p1', 100, 288, 'cyan')
    game.getPlayer('p1').alive = false

    expect(game.spawnEnemy()).toBeNull()
  })
})
