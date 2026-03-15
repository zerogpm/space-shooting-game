import { describe, it, expect } from 'vitest'
import { ScoreManager } from '../src/ScoreManager.js'
import { createMockContext } from './helpers/mockContext.js'

describe('ScoreManager', () => {
  function createScoreManager() {
    return new ScoreManager(createMockContext())
  }

  it('starts at score 0 and level 1', () => {
    const scoreManager = createScoreManager()

    expect(scoreManager.score).toBe(0)
    expect(scoreManager.level).toBe(1)
  })

  it('addShrinkPoints adds 10', () => {
    const scoreManager = createScoreManager()
    scoreManager.addShrinkPoints()

    expect(scoreManager.score).toBe(10)
  })

  it('addKillPoints adds 100', () => {
    const scoreManager = createScoreManager()
    scoreManager.addKillPoints()

    expect(scoreManager.score).toBe(100)
  })

  it('scores accumulate correctly', () => {
    const scoreManager = createScoreManager()
    scoreManager.addShrinkPoints()
    scoreManager.addShrinkPoints()
    scoreManager.addShrinkPoints()
    scoreManager.addKillPoints()

    expect(scoreManager.score).toBe(130) // 10*3 + 100
  })

  it('setLevel updates the level', () => {
    const scoreManager = createScoreManager()
    scoreManager.setLevel(5)

    expect(scoreManager.level).toBe(5)
  })

  it('draw does not throw', () => {
    const scoreManager = createScoreManager()
    scoreManager.addKillPoints()
    scoreManager.setLevel(3)

    expect(() => scoreManager.draw()).not.toThrow()
  })
})
