import { describe, it, expect } from 'vitest'
import { Enemy } from '../src/Enemy.js'
import { createMockContext } from './helpers/mockContext.js'

describe('Enemy', () => {
  function createEnemy(positionX, positionY, radius, velocity) {
    return new Enemy(
      createMockContext(),
      positionX,
      positionY,
      radius,
      'hsl(180, 50%, 50%)',
      velocity
    )
  }

  it('moves according to velocity each update', () => {
    const enemy = createEnemy(100, 100, 15, { horizontal: 2, vertical: 3 })
    enemy.update()

    expect(enemy.positionX).toBe(102)
    expect(enemy.positionY).toBe(103)
  })

  it('moves left and up with negative velocity', () => {
    const enemy = createEnemy(200, 200, 10, { horizontal: -1.5, vertical: -2 })
    enemy.update()

    expect(enemy.positionX).toBe(198.5)
    expect(enemy.positionY).toBe(198)
  })

  it('accumulates position over multiple updates', () => {
    const enemy = createEnemy(0, 0, 10, { horizontal: 1, vertical: 0.5 })

    for (let frame = 0; frame < 10; frame++) {
      enemy.update()
    }

    expect(enemy.positionX).toBe(10)
    expect(enemy.positionY).toBe(5)
  })

  it('does not move with zero velocity', () => {
    const enemy = createEnemy(50, 50, 10, { horizontal: 0, vertical: 0 })
    enemy.update()

    expect(enemy.positionX).toBe(50)
    expect(enemy.positionY).toBe(50)
  })

  it('stores its properties correctly', () => {
    const enemy = createEnemy(100, 200, 25, { horizontal: 1, vertical: -1 })

    expect(enemy.radius).toBe(25)
    expect(enemy.color).toBe('hsl(180, 50%, 50%)')
    expect(enemy.velocity.horizontal).toBe(1)
    expect(enemy.velocity.vertical).toBe(-1)
  })
})
