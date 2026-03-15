import { describe, it, expect } from 'vitest'
import { Player } from '../src/Player.js'
import { createMockContext } from './helpers/mockContext.js'

describe('Player', () => {
  const canvasWidth = 800
  const canvasHeight = 600

  function createPlayer(positionX = 400, positionY = 300) {
    return new Player(createMockContext(), positionX, positionY, 10, 'white')
  }

  it('moves right when given positive directionX', () => {
    const player = createPlayer()
    player.update({ directionX: 1, directionY: 0 }, canvasWidth, canvasHeight)

    expect(player.positionX).toBe(403) // 400 + speed(3) * 1
    expect(player.positionY).toBe(300)
  })

  it('moves left when given negative directionX', () => {
    const player = createPlayer()
    player.update({ directionX: -1, directionY: 0 }, canvasWidth, canvasHeight)

    expect(player.positionX).toBe(397)
    expect(player.positionY).toBe(300)
  })

  it('moves up when given negative directionY', () => {
    const player = createPlayer()
    player.update({ directionX: 0, directionY: -1 }, canvasWidth, canvasHeight)

    expect(player.positionX).toBe(400)
    expect(player.positionY).toBe(297)
  })

  it('moves down when given positive directionY', () => {
    const player = createPlayer()
    player.update({ directionX: 0, directionY: 1 }, canvasWidth, canvasHeight)

    expect(player.positionX).toBe(400)
    expect(player.positionY).toBe(303)
  })

  it('moves diagonally with normalized input', () => {
    const player = createPlayer()
    const diagonal = 1 / Math.sqrt(2)
    player.update({ directionX: diagonal, directionY: diagonal }, canvasWidth, canvasHeight)

    const expectedMove = 3 * diagonal
    expect(player.positionX).toBeCloseTo(400 + expectedMove)
    expect(player.positionY).toBeCloseTo(300 + expectedMove)
  })

  it('stays still when direction is zero', () => {
    const player = createPlayer()
    player.update({ directionX: 0, directionY: 0 }, canvasWidth, canvasHeight)

    expect(player.positionX).toBe(400)
    expect(player.positionY).toBe(300)
  })

  it('clamps to left edge', () => {
    const player = createPlayer(5, 300) // near left edge, radius = 10
    player.update({ directionX: -1, directionY: 0 }, canvasWidth, canvasHeight)

    expect(player.positionX).toBe(10) // clamped to radius
  })

  it('clamps to right edge', () => {
    const player = createPlayer(795, 300) // near right edge
    player.update({ directionX: 1, directionY: 0 }, canvasWidth, canvasHeight)

    expect(player.positionX).toBe(790) // clamped to canvasWidth - radius
  })

  it('clamps to top edge', () => {
    const player = createPlayer(400, 5)
    player.update({ directionX: 0, directionY: -1 }, canvasWidth, canvasHeight)

    expect(player.positionY).toBe(10) // clamped to radius
  })

  it('clamps to bottom edge', () => {
    const player = createPlayer(400, 595)
    player.update({ directionX: 0, directionY: 1 }, canvasWidth, canvasHeight)

    expect(player.positionY).toBe(590) // clamped to canvasHeight - radius
  })

  it('clamps in corner when moving diagonally', () => {
    const player = createPlayer(5, 5)
    player.update({ directionX: -1, directionY: -1 }, canvasWidth, canvasHeight)

    expect(player.positionX).toBe(10)
    expect(player.positionY).toBe(10)
  })

  it('initializes with correct properties', () => {
    const player = createPlayer()

    expect(player.radius).toBe(10)
    expect(player.color).toBe('white')
    expect(player.speed).toBe(3)
  })
})
