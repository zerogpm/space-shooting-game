import { describe, it, expect } from 'vitest'
import { circlesCollide } from '../../src/simulation/CollisionHelper.js'

describe('CollisionHelper (imported)', () => {
  it('detects overlapping circles', () => {
    const circleA = { positionX: 100, positionY: 100, radius: 20 }
    const circleB = { positionX: 110, positionY: 100, radius: 20 }

    expect(circlesCollide(circleA, circleB)).toBe(true)
  })

  it('detects circles at the same position', () => {
    const circleA = { positionX: 50, positionY: 50, radius: 10 }
    const circleB = { positionX: 50, positionY: 50, radius: 10 }

    expect(circlesCollide(circleA, circleB)).toBe(true)
  })

  it('no collision when far apart', () => {
    const circleA = { positionX: 0, positionY: 0, radius: 10 }
    const circleB = { positionX: 500, positionY: 500, radius: 10 }

    expect(circlesCollide(circleA, circleB)).toBe(false)
  })

  it('no collision at the 1-pixel boundary', () => {
    const circleA = { positionX: 0, positionY: 0, radius: 10 }
    const circleB = { positionX: 21, positionY: 0, radius: 10 }

    // distance(21) - 10 - 10 = 1, which is NOT < 1
    expect(circlesCollide(circleA, circleB)).toBe(false)
  })

  it('works with simulation entities (PlayerSim, EnemySim, ProjectileSim)', () => {
    // These are plain objects with the same shape as sim classes
    const player = { positionX: 400, positionY: 300, radius: 10 }
    const enemy = { positionX: 405, positionY: 300, radius: 10 }

    expect(circlesCollide(player, enemy)).toBe(true)
  })
})
