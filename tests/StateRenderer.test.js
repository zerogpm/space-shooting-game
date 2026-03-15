import { describe, it, expect, vi } from 'vitest'
import { drawPlayers, drawEnemies, drawProjectiles, drawHUD } from '../src/StateRenderer.js'
import { createMockContext } from './helpers/mockContext.js'

describe('StateRenderer', () => {
  const scaleX = 1
  const scaleY = 1

  describe('drawPlayers', () => {
    it('draws alive players as circles', () => {
      const context = createMockContext()
      context.arc = vi.fn()
      context.fill = vi.fn()

      const players = [
        { id: 'p1', positionX: 100, positionY: 200, radius: 10, color: 'cyan', alive: true, health: 100, maxHealth: 100 },
        { id: 'p2', positionX: 300, positionY: 400, radius: 10, color: 'magenta', alive: true, health: 80, maxHealth: 100 }
      ]

      drawPlayers(context, players, 'p1', scaleX, scaleY)

      // Two players = two arc calls (circles)
      expect(context.arc).toHaveBeenCalledTimes(2)
    })

    it('skips dead players', () => {
      const context = createMockContext()
      context.arc = vi.fn()

      const players = [
        { id: 'p1', positionX: 100, positionY: 200, radius: 10, color: 'cyan', alive: false, health: 0, maxHealth: 100 },
        { id: 'p2', positionX: 300, positionY: 400, radius: 10, color: 'magenta', alive: true, health: 100, maxHealth: 100 }
      ]

      drawPlayers(context, players, 'p1', scaleX, scaleY)

      // Only one alive player drawn
      expect(context.arc).toHaveBeenCalledTimes(1)
    })

    it('labels own player as YOU', () => {
      const context = createMockContext()
      context.fillText = vi.fn()

      const players = [
        { id: 'p1', positionX: 100, positionY: 200, radius: 10, color: 'cyan', alive: true, health: 100, maxHealth: 100 }
      ]

      drawPlayers(context, players, 'p1', scaleX, scaleY)

      expect(context.fillText).toHaveBeenCalledWith('YOU', 100, expect.any(Number))
    })

    it('labels other player with their ID', () => {
      const context = createMockContext()
      context.fillText = vi.fn()

      const players = [
        { id: 'p2', positionX: 300, positionY: 400, radius: 10, color: 'magenta', alive: true, health: 100, maxHealth: 100 }
      ]

      drawPlayers(context, players, 'p1', scaleX, scaleY)

      expect(context.fillText).toHaveBeenCalledWith('P2', 300, expect.any(Number))
    })
  })

  describe('drawEnemies', () => {
    it('draws all enemies', () => {
      const context = createMockContext()
      context.arc = vi.fn()

      const enemies = [
        { positionX: 50, positionY: 50, radius: 15, color: 'red' },
        { positionX: 200, positionY: 200, radius: 20, color: 'blue' }
      ]

      drawEnemies(context, enemies, scaleX, scaleY)

      expect(context.arc).toHaveBeenCalledTimes(2)
    })
  })

  describe('drawProjectiles', () => {
    it('draws all projectiles', () => {
      const context = createMockContext()
      context.arc = vi.fn()

      const projectiles = [
        { positionX: 100, positionY: 100, radius: 5, color: 'cyan' },
        { positionX: 200, positionY: 200, radius: 5, color: 'magenta' },
        { positionX: 300, positionY: 300, radius: 5, color: 'cyan' }
      ]

      drawProjectiles(context, projectiles, scaleX, scaleY)

      expect(context.arc).toHaveBeenCalledTimes(3)
    })
  })

  describe('drawHUD', () => {
    it('draws single-player score and level', () => {
      const context = createMockContext()
      context.fillText = vi.fn()

      const players = [{ id: 'p1', alive: true }]
      drawHUD(context, { p1: 150 }, 3, 'p1', players, 800)

      expect(context.fillText).toHaveBeenCalledWith('Score: 150', 16, 16)
      expect(context.fillText).toHaveBeenCalledWith('Level: 3', 16, 48)
    })

    it('draws two-player scores in different positions', () => {
      const context = createMockContext()
      context.fillText = vi.fn()

      const players = [
        { id: 'p1', color: 'cyan', alive: true },
        { id: 'p2', color: 'magenta', alive: true }
      ]
      drawHUD(context, { p1: 100, p2: 200 }, 5, 'p1', players, 800)

      // P1 score top-left
      expect(context.fillText).toHaveBeenCalledWith('P1: 100', 16, 16)
      // P2 score top-right
      expect(context.fillText).toHaveBeenCalledWith('P2: 200', 784, 16)
      // Level centered
      expect(context.fillText).toHaveBeenCalledWith('Level: 5', 400, 16)
    })
  })
})
