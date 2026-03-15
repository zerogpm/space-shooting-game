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

    // Health system — player can take multiple hits before dying.
    // Damage is dynamic: bigger enemies deal more damage, projectiles deal fixed damage.
    this.maxHealth = 100
    this.health = 100

    // Knockback — temporary velocity applied on collision, decays via friction.
    // Makes hits feel physical instead of just subtracting health.
    this.knockbackVelocityX = 0
    this.knockbackVelocityY = 0
    this.knockbackFriction = 0.85

    // Multiplayer needs to track whether this player is still in the game
    this.alive = true
  }

  /**
   * Apply a knockback impulse. The velocity decays each frame via friction.
   *
   * @param {number} velocityX - Horizontal knockback force.
   * @param {number} velocityY - Vertical knockback force.
   */
  applyKnockback(velocityX, velocityY) {
    this.knockbackVelocityX += velocityX
    this.knockbackVelocityY += velocityY
  }

  /**
   * Apply damage to this player. If health drops to 0 or below, the player dies.
   *
   * @param {number} amount - Damage to deal (e.g., enemy.radius for size-based, or fixed for projectiles).
   * @returns {boolean} True if this damage killed the player.
   */
  takeDamage(amount) {
    if (!this.alive) return false

    this.health = Math.max(0, this.health - amount)
    if (this.health <= 0) {
      this.alive = false
      return true
    }
    return false
  }

  /**
   * Move the player based on a normalized direction vector, clamped to canvas bounds.
   *
   * @param {Object} direction - { directionX, directionY } normalized vector from input.
   * @param {number} canvasWidth - Right boundary for clamping.
   * @param {number} canvasHeight - Bottom boundary for clamping.
   */
  update(direction, canvasWidth, canvasHeight) {
    // Apply input movement
    this.positionX += direction.directionX * this.speed
    this.positionY += direction.directionY * this.speed

    // Apply knockback velocity on top of input movement
    this.positionX += this.knockbackVelocityX
    this.positionY += this.knockbackVelocityY

    // Decay knockback — 0.85x per frame makes it feel snappy, not floaty
    this.knockbackVelocityX *= this.knockbackFriction
    this.knockbackVelocityY *= this.knockbackFriction

    // Zero out tiny residual knockback to avoid floating-point drift
    if (Math.abs(this.knockbackVelocityX) < 0.1) this.knockbackVelocityX = 0
    if (Math.abs(this.knockbackVelocityY) < 0.1) this.knockbackVelocityY = 0

    // Clamp so the circle edge stays inside the canvas, not just the center
    this.positionX = Math.max(this.radius, Math.min(canvasWidth - this.radius, this.positionX))
    this.positionY = Math.max(this.radius, Math.min(canvasHeight - this.radius, this.positionY))
  }
}
