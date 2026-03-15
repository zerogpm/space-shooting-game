import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GameSession } from '../../server/GameSession.js'

describe('GameSession - Phase 4 Polish', () => {
  let session
  let broadcastedMessages

  beforeEach(() => {
    vi.useFakeTimers()
    broadcastedMessages = []
    session = new GameSession(
      (message) => broadcastedMessages.push(message),
      () => {} // sendToPlayer stub
    )
  })

  afterEach(() => {
    if (session) session.destroy()
    vi.useRealTimers()
  })

  describe('fire rate limiting', () => {
    it('allows first shot immediately', () => {
      session.start('p1')
      session.handleFire('p1', 500, 300)

      expect(session.gameSim.projectiles).toHaveLength(1)
    })

    it('blocks shots fired within 100ms', () => {
      session.start('p1')

      session.handleFire('p1', 500, 300)
      vi.advanceTimersByTime(50) // only 50ms later
      session.handleFire('p1', 500, 300)

      expect(session.gameSim.projectiles).toHaveLength(1) // second shot blocked
    })

    it('allows shots after 100ms cooldown', () => {
      session.start('p1')

      // Use real Date.now for fire rate since it uses Date.now not fake timers
      vi.useRealTimers()

      session.handleFire('p1', 500, 300)
      expect(session.gameSim.projectiles).toHaveLength(1)

      // Manually set lastFireTime to 200ms ago to simulate cooldown passed
      session.lastFireTimes.set('p1', Date.now() - 200)
      session.handleFire('p1', 500, 300)
      expect(session.gameSim.projectiles).toHaveLength(2)

      vi.useFakeTimers()
    })

    it('tracks fire times independently per player', () => {
      session.start('p1')
      session.handleJoinGame('p2', () => {})
      session.paused = false

      vi.useRealTimers()

      session.handleFire('p1', 500, 300)
      session.handleFire('p2', 500, 300)

      // Both should fire — they have independent cooldowns
      expect(session.gameSim.projectiles).toHaveLength(2)

      vi.useFakeTimers()
    })

    it('resets fire times on restart', () => {
      session.start('p1')
      session.handleFire('p1', 500, 300)

      session.restart(['p1'])

      expect(session.lastFireTimes.size).toBe(0)
    })
  })
})
