import { describe, it, expect } from 'vitest'

/**
 * Mirrors the collision detection formula from game.js (lines 224-228 and 247-253).
 * This will be extracted to src/simulation/CollisionHelper.js in Phase 1.
 */
function circlesCollide(entityA, entityB) {
  const distance = Math.hypot(
    entityA.positionX - entityB.positionX,
    entityA.positionY - entityB.positionY
  )
  return distance - entityA.radius - entityB.radius < 1
}

describe('Collision Detection', () => {
  it('detects overlapping circles', () => {
    const circleA = { positionX: 100, positionY: 100, radius: 20 }
    const circleB = { positionX: 110, positionY: 100, radius: 20 }

    expect(circlesCollide(circleA, circleB)).toBe(true)
  })

  it('detects circles at the same position', () => {
    const circleA = { positionX: 100, positionY: 100, radius: 10 }
    const circleB = { positionX: 100, positionY: 100, radius: 10 }

    expect(circlesCollide(circleA, circleB)).toBe(true)
  })

  it('detects circles just touching (distance equals sum of radii)', () => {
    const circleA = { positionX: 0, positionY: 0, radius: 10 }
    const circleB = { positionX: 20, positionY: 0, radius: 10 }

    // distance(20) - r1(10) - r2(10) = 0, which is < 1
    expect(circlesCollide(circleA, circleB)).toBe(true)
  })

  it('no collision when circles are far apart', () => {
    const circleA = { positionX: 0, positionY: 0, radius: 10 }
    const circleB = { positionX: 500, positionY: 500, radius: 10 }

    expect(circlesCollide(circleA, circleB)).toBe(false)
  })

  it('no collision when barely separated', () => {
    const circleA = { positionX: 0, positionY: 0, radius: 10 }
    const circleB = { positionX: 21.5, positionY: 0, radius: 10 }

    // distance(21.5) - r1(10) - r2(10) = 1.5, which is >= 1
    expect(circlesCollide(circleA, circleB)).toBe(false)
  })

  it('detects collision with different sized circles', () => {
    const largeEnemy = { positionX: 100, positionY: 100, radius: 30 }
    const smallProjectile = { positionX: 125, positionY: 100, radius: 5 }

    // distance(25) - r1(30) - r2(5) = -10, which is < 1
    expect(circlesCollide(largeEnemy, smallProjectile)).toBe(true)
  })

  it('handles zero-radius circles at same position', () => {
    const circleA = { positionX: 50, positionY: 50, radius: 0 }
    const circleB = { positionX: 50, positionY: 50, radius: 0 }

    // distance(0) - 0 - 0 = 0, which is < 1
    expect(circlesCollide(circleA, circleB)).toBe(true)
  })

  it('works with diagonal distances', () => {
    const circleA = { positionX: 0, positionY: 0, radius: 10 }
    const circleB = { positionX: 10, positionY: 10, radius: 10 }

    // distance = Math.hypot(10, 10) ≈ 14.14, minus 10 minus 10 = -5.86 < 1
    expect(circlesCollide(circleA, circleB)).toBe(true)
  })

  it('handles collision at the 1-pixel threshold boundary', () => {
    const circleA = { positionX: 0, positionY: 0, radius: 10 }
    // Place circleB so distance - r1 - r2 = exactly 1.0
    const circleB = { positionX: 21, positionY: 0, radius: 10 }

    // distance(21) - 10 - 10 = 1, which is NOT < 1
    expect(circlesCollide(circleA, circleB)).toBe(false)
  })
})
