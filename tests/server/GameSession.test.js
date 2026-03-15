import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GameSession } from '../../server/GameSession.js'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../src/shared/constants.js'

describe('GameSession', () => {
  let session
  let broadcastedMessages

  beforeEach(() => {
    vi.useFakeTimers()
    broadcastedMessages = []
    session = new GameSession((message) => {
      broadcastedMessages.push(message)
    })
  })

  afterEach(() => {
    if (session) session.destroy()
    vi.useRealTimers()
  })

  describe('initialization and start', () => {
    it('creates a game session and adds the first player', () => {
      session.start('p1')

      const player = session.gameSim.getPlayer('p1')
      expect(player).toBeDefined()
      expect(player.positionX).toBe(CANVAS_WIDTH / 2)
      expect(player.positionY).toBe(CANVAS_HEIGHT / 2)
      expect(player.color).toBe('cyan')
      expect(player.alive).toBe(true)
    })

    it('starts the tick loop and broadcasts state', () => {
      session.start('p1')

      // Advance one tick (~16.67ms)
      vi.advanceTimersByTime(1000 / 60)

      const stateMessages = broadcastedMessages.filter(msg => msg.type === 'state')
      expect(stateMessages.length).toBeGreaterThanOrEqual(1)
      expect(stateMessages[0].state.players).toHaveLength(1)
    })

    it('spawns enemies over time', () => {
      session.start('p1')

      // Advance past the initial spawn delay (1000ms at level 1)
      vi.advanceTimersByTime(1100)

      expect(session.gameSim.enemies.length).toBeGreaterThan(0)
    })

    it('increases level every 10 seconds', () => {
      session.start('p1')
      expect(session.gameSim.currentLevel).toBe(1)

      // Clear enemies each step so the player doesn't die before the level timer fires
      for (let second = 0; second < 11; second++) {
        session.gameSim.enemies.length = 0
        vi.advanceTimersByTime(1000)
      }
      expect(session.gameSim.currentLevel).toBe(2)

      for (let second = 0; second < 11; second++) {
        session.gameSim.enemies.length = 0
        vi.advanceTimersByTime(1000)
      }
      expect(session.gameSim.currentLevel).toBe(3)
    })
  })

  describe('input handling', () => {
    it('stores player input and applies it on tick', () => {
      session.start('p1')
      session.handleInput('p1', { directionX: 1, directionY: 0 })

      const initialX = session.gameSim.getPlayer('p1').positionX

      vi.advanceTimersByTime(1000 / 60)

      expect(session.gameSim.getPlayer('p1').positionX).toBeGreaterThan(initialX)
    })
  })

  describe('fire handling', () => {
    it('creates a projectile when player fires', () => {
      session.start('p1')
      session.handleFire('p1', 800, 300)

      expect(session.gameSim.projectiles).toHaveLength(1)
      expect(session.gameSim.projectiles[0].ownerId).toBe('p1')
    })
  })

  describe('handleJoinGame (arcade drop-in)', () => {
    it('adds a second player to the game', () => {
      session.start('p1')
      const sentMessages = []
      session.handleJoinGame('p2', (msg) => sentMessages.push(msg))

      expect(session.gameSim.players).toHaveLength(2)
      expect(session.gameSim.getPlayer('p2')).toBeDefined()
      expect(session.gameSim.getPlayer('p2').color).toBe('magenta')
    })

    it('pauses the game during announcement', () => {
      session.start('p1')
      session.handleJoinGame('p2', () => {})

      expect(session.paused).toBe(true)
    })

    it('sends gameStart to the joining player', () => {
      session.start('p1')
      const sentMessages = []
      session.handleJoinGame('p2', (msg) => sentMessages.push(msg))

      const gameStartMsg = sentMessages.find(msg => msg.type === 'gameStart')
      expect(gameStartMsg).toBeDefined()
      expect(gameStartMsg.yourPlayerId).toBe('p2')
      expect(gameStartMsg.state.players).toHaveLength(2)
    })

    it('broadcasts challengerJoined to all players', () => {
      session.start('p1')
      session.handleJoinGame('p2', () => {})

      const challengerMsg = broadcastedMessages.find(msg => msg.type === 'challengerJoined')
      expect(challengerMsg).toBeDefined()
      expect(challengerMsg.newPlayerId).toBe('p2')
      expect(challengerMsg.playerColor).toBe('magenta')
    })

    it('resumes after 2500ms and broadcasts challengerReady', () => {
      session.start('p1')
      session.handleJoinGame('p2', () => {})

      expect(session.paused).toBe(true)

      vi.advanceTimersByTime(2500)

      expect(session.paused).toBe(false)
      const readyMsg = broadcastedMessages.find(msg => msg.type === 'challengerReady')
      expect(readyMsg).toBeDefined()
    })

    it('spawns player 2 on the opposite side from player 1', () => {
      session.start('p1')
      // Player 1 is at center (CANVAS_WIDTH/2, CANVAS_HEIGHT/2)
      session.handleJoinGame('p2', () => {})

      const player2 = session.gameSim.getPlayer('p2')
      const player1 = session.gameSim.getPlayer('p1')

      // Player 2 should not be at the same position as Player 1
      const distance = Math.hypot(
        player2.positionX - player1.positionX,
        player2.positionY - player1.positionY
      )
      expect(distance).toBeGreaterThan(100)
    })
  })

  describe('game over detection', () => {
    it('broadcasts gameOver when all players die', () => {
      session.start('p1')

      // Kill the player
      session.gameSim.getPlayer('p1').alive = false

      // Advance a tick so the game-over check runs
      vi.advanceTimersByTime(1000 / 60)

      const gameOverMsg = broadcastedMessages.find(msg => msg.type === 'gameOver')
      expect(gameOverMsg).toBeDefined()
      expect(gameOverMsg.reason).toBe('allDead')
    })

    it('does not trigger gameOver when one of two players is still alive', () => {
      session.start('p1')
      session.handleJoinGame('p2', () => {})
      session.paused = false // skip the pause for this test

      session.gameSim.getPlayer('p1').alive = false

      vi.advanceTimersByTime(1000 / 60)

      const gameOverMsg = broadcastedMessages.find(msg => msg.type === 'gameOver')
      expect(gameOverMsg).toBeUndefined()
    })
  })

  describe('removePlayer', () => {
    it('marks player as dead and removes their input', () => {
      session.start('p1')
      session.handleInput('p1', { directionX: 1, directionY: 0 })

      session.removePlayer('p1')

      expect(session.gameSim.getPlayer('p1').alive).toBe(false)
      expect(session.playerInputs.has('p1')).toBe(false)
    })
  })

  describe('restart', () => {
    it('resets the game with fresh state', () => {
      session.start('p1')
      session.gameSim.scores.p1 = 500
      session.gameSim.currentLevel = 5

      const state = session.restart(['p1', 'p2'])

      expect(session.gameSim.scores.p1).toBe(0)
      expect(session.gameSim.scores.p2).toBe(0)
      expect(session.gameSim.currentLevel).toBe(1)
      expect(state.players).toHaveLength(2)
    })

    it('positions players at spread-out starting positions', () => {
      session.start('p1')
      const state = session.restart(['p1', 'p2'])

      const player1 = state.players.find(p => p.id === 'p1')
      const player2 = state.players.find(p => p.id === 'p2')

      expect(player1.positionX).not.toBe(player2.positionX)
    })
  })

  describe('getStateSnapshot', () => {
    it('returns the current game state', () => {
      session.start('p1')
      const snapshot = session.getStateSnapshot()

      expect(snapshot.players).toHaveLength(1)
      expect(snapshot.players[0].id).toBe('p1')
      expect(snapshot.level).toBe(1)
    })
  })

  describe('destroy', () => {
    it('stops all loops', () => {
      session.start('p1')
      session.destroy()

      const messageCountBefore = broadcastedMessages.length
      vi.advanceTimersByTime(5000)

      // No new state messages should be broadcast after destroy
      const newStateMessages = broadcastedMessages
        .slice(messageCountBefore)
        .filter(msg => msg.type === 'state')
      expect(newStateMessages).toHaveLength(0)
    })
  })
})
