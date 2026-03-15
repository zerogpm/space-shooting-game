import { describe, it, expect, afterEach } from 'vitest'
import { InputHandler } from '../src/InputHandler.js'

describe('InputHandler', () => {
  let inputHandler

  afterEach(() => {
    if (inputHandler) {
      inputHandler.destroy()
      inputHandler = null
    }
  })

  function pressKey(code) {
    window.dispatchEvent(new KeyboardEvent('keydown', { code }))
  }

  function releaseKey(code) {
    window.dispatchEvent(new KeyboardEvent('keyup', { code }))
  }

  it('returns zero direction when no keys are pressed', () => {
    inputHandler = new InputHandler()
    const direction = inputHandler.getDirection()

    expect(direction.directionX).toBe(0)
    expect(direction.directionY).toBe(0)
  })

  it('W key moves up (negative Y)', () => {
    inputHandler = new InputHandler()
    pressKey('KeyW')
    const direction = inputHandler.getDirection()

    expect(direction.directionX).toBe(0)
    expect(direction.directionY).toBe(-1)
  })

  it('S key moves down (positive Y)', () => {
    inputHandler = new InputHandler()
    pressKey('KeyS')
    const direction = inputHandler.getDirection()

    expect(direction.directionX).toBe(0)
    expect(direction.directionY).toBe(1)
  })

  it('A key moves left (negative X)', () => {
    inputHandler = new InputHandler()
    pressKey('KeyA')
    const direction = inputHandler.getDirection()

    expect(direction.directionX).toBe(-1)
    expect(direction.directionY).toBe(0)
  })

  it('D key moves right (positive X)', () => {
    inputHandler = new InputHandler()
    pressKey('KeyD')
    const direction = inputHandler.getDirection()

    expect(direction.directionX).toBe(1)
    expect(direction.directionY).toBe(0)
  })

  it('arrow keys work like WASD', () => {
    inputHandler = new InputHandler()

    pressKey('ArrowUp')
    expect(inputHandler.getDirection().directionY).toBe(-1)
    releaseKey('ArrowUp')

    pressKey('ArrowDown')
    expect(inputHandler.getDirection().directionY).toBe(1)
    releaseKey('ArrowDown')

    pressKey('ArrowLeft')
    expect(inputHandler.getDirection().directionX).toBe(-1)
    releaseKey('ArrowLeft')

    pressKey('ArrowRight')
    expect(inputHandler.getDirection().directionX).toBe(1)
  })

  it('W + D produces normalized diagonal (up-right)', () => {
    inputHandler = new InputHandler()
    pressKey('KeyW')
    pressKey('KeyD')
    const direction = inputHandler.getDirection()

    const expected = 1 / Math.sqrt(2)
    expect(direction.directionX).toBeCloseTo(expected)
    expect(direction.directionY).toBeCloseTo(-expected)
  })

  it('Q key produces normalized up-left diagonal', () => {
    inputHandler = new InputHandler()
    pressKey('KeyQ')
    const direction = inputHandler.getDirection()

    const expected = 1 / Math.sqrt(2)
    expect(direction.directionX).toBeCloseTo(-expected)
    expect(direction.directionY).toBeCloseTo(-expected)
  })

  it('E key produces normalized up-right diagonal', () => {
    inputHandler = new InputHandler()
    pressKey('KeyE')
    const direction = inputHandler.getDirection()

    const expected = 1 / Math.sqrt(2)
    expect(direction.directionX).toBeCloseTo(expected)
    expect(direction.directionY).toBeCloseTo(-expected)
  })

  it('Z key produces normalized down-left diagonal', () => {
    inputHandler = new InputHandler()
    pressKey('KeyZ')
    const direction = inputHandler.getDirection()

    const expected = 1 / Math.sqrt(2)
    expect(direction.directionX).toBeCloseTo(-expected)
    expect(direction.directionY).toBeCloseTo(expected)
  })

  it('C key produces normalized down-right diagonal', () => {
    inputHandler = new InputHandler()
    pressKey('KeyC')
    const direction = inputHandler.getDirection()

    const expected = 1 / Math.sqrt(2)
    expect(direction.directionX).toBeCloseTo(expected)
    expect(direction.directionY).toBeCloseTo(expected)
  })

  it('releasing a key stops that direction', () => {
    inputHandler = new InputHandler()
    pressKey('KeyW')
    releaseKey('KeyW')
    const direction = inputHandler.getDirection()

    expect(direction.directionX).toBe(0)
    expect(direction.directionY).toBe(0)
  })

  it('destroy stops tracking key events', () => {
    inputHandler = new InputHandler()
    inputHandler.destroy()
    pressKey('KeyW')
    const direction = inputHandler.getDirection()

    expect(direction.directionY).toBe(0)
    inputHandler = null // prevent afterEach from calling destroy again
  })
})
