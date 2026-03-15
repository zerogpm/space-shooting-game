import { describe, it, expect } from 'vitest'
import { EnemySim } from '../../src/simulation/EnemySim.js'

describe('EnemySim', () => {
  it('initializes with correct properties including id', () => {
    const enemy = new EnemySim(42, 100, 200, 15, 'red', { horizontal: 1, vertical: -1 })

    expect(enemy.id).toBe(42)
    expect(enemy.positionX).toBe(100)
    expect(enemy.positionY).toBe(200)
    expect(enemy.radius).toBe(15)
    expect(enemy.color).toBe('red')
    expect(enemy.velocity.horizontal).toBe(1)
    expect(enemy.velocity.vertical).toBe(-1)
  })

  it('moves according to velocity each update', () => {
    const enemy = new EnemySim(1, 100, 100, 10, 'red', { horizontal: 2, vertical: 3 })
    enemy.update()

    expect(enemy.positionX).toBe(102)
    expect(enemy.positionY).toBe(103)
  })

  it('accumulates position over multiple updates', () => {
    const enemy = new EnemySim(1, 0, 0, 10, 'red', { horizontal: 1.5, vertical: -0.5 })

    for (let frame = 0; frame < 10; frame++) {
      enemy.update()
    }

    expect(enemy.positionX).toBeCloseTo(15)
    expect(enemy.positionY).toBeCloseTo(-5)
  })

  it('has no canvas or draw dependency', () => {
    const enemy = new EnemySim(1, 0, 0, 10, 'red', { horizontal: 0, vertical: 0 })

    expect(enemy.context).toBeUndefined()
    expect(enemy.draw).toBeUndefined()
  })
})
