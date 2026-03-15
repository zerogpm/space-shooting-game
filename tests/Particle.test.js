import { describe, it, expect } from 'vitest'
import { Particle } from '../src/Particle.js'
import { createMockContext } from './helpers/mockContext.js'

describe('Particle', () => {
  function createParticle(velocity = { horizontal: 5, vertical: 3 }) {
    return new Particle(
      createMockContext(),
      100,
      100,
      2,
      'hsl(0, 50%, 50%)',
      velocity
    )
  }

  it('starts with alpha of 1', () => {
    const particle = createParticle()
    expect(particle.alpha).toBe(1)
  })

  it('alpha decreases by 0.01 each update', () => {
    const particle = createParticle()
    particle.update()

    expect(particle.alpha).toBeCloseTo(0.99)
  })

  it('velocity decreases by friction each update', () => {
    const particle = createParticle({ horizontal: 10, vertical: 10 })
    particle.update()

    expect(particle.velocity.horizontal).toBeCloseTo(10 * 0.98)
    expect(particle.velocity.vertical).toBeCloseTo(10 * 0.98)
  })

  it('position changes by current velocity each update', () => {
    const particle = createParticle({ horizontal: 5, vertical: 3 })
    particle.update()

    // Friction is applied before movement in the update method
    expect(particle.positionX).toBeCloseTo(100 + 5 * 0.98)
    expect(particle.positionY).toBeCloseTo(100 + 3 * 0.98)
  })

  it('friction compounds over multiple frames', () => {
    const particle = createParticle({ horizontal: 10, vertical: 0 })
    const friction = 0.98

    for (let frame = 0; frame < 5; frame++) {
      particle.update()
    }

    expect(particle.velocity.horizontal).toBeCloseTo(10 * Math.pow(friction, 5))
  })

  it('alpha reaches approximately 0 after 100 updates', () => {
    const particle = createParticle()

    for (let frame = 0; frame < 100; frame++) {
      particle.update()
    }

    expect(particle.alpha).toBeCloseTo(0, 1)
  })

  it('particle nearly stops after many updates due to friction', () => {
    const particle = createParticle({ horizontal: 10, vertical: 10 })

    for (let frame = 0; frame < 200; frame++) {
      particle.update()
    }

    // After 200 frames: 10 * 0.98^200 ≈ 0.176
    expect(Math.abs(particle.velocity.horizontal)).toBeLessThan(0.2)
    expect(Math.abs(particle.velocity.vertical)).toBeLessThan(0.2)
  })
})
