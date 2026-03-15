/**
 * CollisionHelper — Shared collision detection logic.
 * Extracted from game.js so both client and server use the same formula.
 *
 * Uses circle-circle collision: two circles overlap when the distance
 * between their centers minus both radii is less than 1 pixel.
 */

/**
 * Check if two circular entities are overlapping.
 * Both entities must have positionX, positionY, and radius properties.
 *
 * @param {Object} entityA - First circle { positionX, positionY, radius }
 * @param {Object} entityB - Second circle { positionX, positionY, radius }
 * @returns {boolean} True if the circles are overlapping
 */
export function circlesCollide(entityA, entityB) {
  const distance = Math.hypot(
    entityA.positionX - entityB.positionX,
    entityA.positionY - entityB.positionY
  )
  return distance - entityA.radius - entityB.radius < 1
}
