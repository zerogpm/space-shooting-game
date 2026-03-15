import { describe, it, expect } from 'vitest'
import { ProjectileSim } from '../../src/simulation/ProjectileSim.js'

describe('ProjectileSim', () => {
  it('initializes with correct properties including id and ownerId', () => {
    const projectile = new ProjectileSim(7, 100, 200, 5, 'cyan', { horizontal: 3, vertical: -4 }, 'player1')

    expect(projectile.id).toBe(7)
    expect(projectile.positionX).toBe(100)
    expect(projectile.positionY).toBe(200)
    expect(projectile.radius).toBe(5)
    expect(projectile.color).toBe('cyan')
    expect(projectile.velocity.horizontal).toBe(3)
    expect(projectile.velocity.vertical).toBe(-4)
    expect(projectile.ownerId).toBe('player1')
  })

  it('moves according to velocity each update', () => {
    const projectile = new ProjectileSim(1, 400, 300, 5, 'white', { horizontal: 5, vertical: 0 }, 'p1')
    projectile.update()

    expect(projectile.positionX).toBe(405)
    expect(projectile.positionY).toBe(300)
  })

  it('accumulates position over multiple updates', () => {
    const projectile = new ProjectileSim(1, 0, 0, 5, 'white', { horizontal: 5, vertical: 5 }, 'p1')

    for (let frame = 0; frame < 20; frame++) {
      projectile.update()
    }

    expect(projectile.positionX).toBe(100)
    expect(projectile.positionY).toBe(100)
  })

  it('has no canvas or draw dependency', () => {
    const projectile = new ProjectileSim(1, 0, 0, 5, 'white', { horizontal: 0, vertical: 0 }, 'p1')

    expect(projectile.context).toBeUndefined()
    expect(projectile.draw).toBeUndefined()
  })
})
