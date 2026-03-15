import { describe, it, expect } from 'vitest'
import { Projectile } from '../src/Projectile.js'
import { createMockContext } from './helpers/mockContext.js'

describe('Projectile', () => {
  function createProjectile(positionX, positionY, velocity) {
    return new Projectile(
      createMockContext(),
      positionX,
      positionY,
      5,
      'white',
      velocity
    )
  }

  it('moves according to velocity each update', () => {
    const projectile = createProjectile(400, 300, { horizontal: 5, vertical: 0 })
    projectile.update()

    expect(projectile.positionX).toBe(405)
    expect(projectile.positionY).toBe(300)
  })

  it('moves diagonally with both velocity components', () => {
    const projectile = createProjectile(0, 0, { horizontal: 3, vertical: -4 })
    projectile.update()

    expect(projectile.positionX).toBe(3)
    expect(projectile.positionY).toBe(-4)
  })

  it('accumulates position over multiple updates', () => {
    const projectile = createProjectile(100, 100, { horizontal: 5, vertical: 5 })

    for (let frame = 0; frame < 20; frame++) {
      projectile.update()
    }

    expect(projectile.positionX).toBe(200)
    expect(projectile.positionY).toBe(200)
  })

  it('can move in negative direction', () => {
    const projectile = createProjectile(500, 500, { horizontal: -5, vertical: -3 })
    projectile.update()

    expect(projectile.positionX).toBe(495)
    expect(projectile.positionY).toBe(497)
  })

  it('stores its properties correctly', () => {
    const projectile = createProjectile(100, 200, { horizontal: 3, vertical: 4 })

    expect(projectile.radius).toBe(5)
    expect(projectile.color).toBe('white')
  })
})
