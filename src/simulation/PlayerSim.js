/**
 * PlayerSim — Pure simulation logic for a player entity.
 * No canvas dependency — this class can run on both client and server.
 *
 * Handles position, movement with clamping, and alive state.
 * The client wraps this in a Player class that adds rendering.
 */
export class PlayerSim {
  constructor(positionX, positionY, radius, color) {
    this.positionX = positionX
    this.positionY = positionY
    this.radius = radius
    this.color = color

    // Movement speed in pixels per frame.
    // At 60fps, a speed of 3 means the player crosses a 1920px screen in ~10 seconds.
    this.speed = 3

    // Multiplayer needs to track whether this player is still in the game
    this.alive = true
  }

  /**
   * Move the player based on a normalized direction vector, clamped to canvas bounds.
   *
   * @param {Object} direction - { directionX, directionY } normalized vector from input.
   * @param {number} canvasWidth - Right boundary for clamping.
   * @param {number} canvasHeight - Bottom boundary for clamping.
   */
  update(direction, canvasWidth, canvasHeight) {
    this.positionX += direction.directionX * this.speed
    this.positionY += direction.directionY * this.speed

    // Clamp so the circle edge stays inside the canvas, not just the center
    this.positionX = Math.max(this.radius, Math.min(canvasWidth - this.radius, this.positionX))
    this.positionY = Math.max(this.radius, Math.min(canvasHeight - this.radius, this.positionY))
  }
}
