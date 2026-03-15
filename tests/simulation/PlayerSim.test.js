import { describe, it, expect } from 'vitest'
import { PlayerSim } from '../../src/simulation/PlayerSim.js'

describe('PlayerSim', () => {
  const canvasWidth = 800
  const canvasHeight = 600

  function createPlayer(positionX = 400, positionY = 300) {
    return new PlayerSim(positionX, positionY, 10, 'cyan')
  }

  it('initializes with correct properties', () => {
    const player = createPlayer()

    expect(player.positionX).toBe(400)
    expect(player.positionY).toBe(300)
    expect(player.radius).toBe(10)
    expect(player.color).toBe('cyan')
    expect(player.speed).toBe(3)
    expect(player.alive).toBe(true)
  })

  it('moves based on direction vector', () => {
    const player = createPlayer()
    player.update({ directionX: 1, directionY: 0 }, canvasWidth, canvasHeight)

    expect(player.positionX).toBe(403)
    expect(player.positionY).toBe(300)
  })

  it('clamps to canvas bounds', () => {
    const player = createPlayer(5, 5)
    player.update({ directionX: -1, directionY: -1 }, canvasWidth, canvasHeight)

    expect(player.positionX).toBe(10) // clamped to radius
    expect(player.positionY).toBe(10)
  })

  it('clamps to right and bottom edges', () => {
    const player = createPlayer(795, 595)
    player.update({ directionX: 1, directionY: 1 }, canvasWidth, canvasHeight)

    expect(player.positionX).toBe(790) // canvasWidth - radius
    expect(player.positionY).toBe(590) // canvasHeight - radius
  })

  it('stays still with zero direction', () => {
    const player = createPlayer()
    player.update({ directionX: 0, directionY: 0 }, canvasWidth, canvasHeight)

    expect(player.positionX).toBe(400)
    expect(player.positionY).toBe(300)
  })

  it('alive can be set to false', () => {
    const player = createPlayer()
    player.alive = false

    expect(player.alive).toBe(false)
  })

  it('has no canvas or draw dependency', () => {
    const player = createPlayer()

    // PlayerSim should not have context or draw method
    expect(player.context).toBeUndefined()
    expect(player.draw).toBeUndefined()
  })
})
