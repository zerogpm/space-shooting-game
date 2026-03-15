/**
 * EnemySim — Pure simulation logic for an enemy entity.
 * No canvas dependency — this class can run on both client and server.
 *
 * Enemies move in a straight line at a fixed velocity set at spawn time.
 * The id field lets the server track individual enemies and clients match them.
 */
export class EnemySim {
  constructor(id, positionX, positionY, radius, color, velocity) {
    this.id = id
    this.positionX = positionX
    this.positionY = positionY
    this.radius = radius
    this.color = color
    // velocity is an object { horizontal, vertical } — pixels moved per frame on each axis
    this.velocity = velocity

    // Knockback — temporary velocity from projectile hits, decays via friction
    this.knockbackVelocityX = 0
    this.knockbackVelocityY = 0
    this.knockbackFriction = 0.85
  }

  /**
   * Apply a knockback impulse from a projectile hit.
   */
  applyKnockback(velocityX, velocityY) {
    this.knockbackVelocityX += velocityX
    this.knockbackVelocityY += velocityY
  }

  update() {
    this.positionX += this.velocity.horizontal + this.knockbackVelocityX
    this.positionY += this.velocity.vertical + this.knockbackVelocityY

    // Decay knockback
    this.knockbackVelocityX *= this.knockbackFriction
    this.knockbackVelocityY *= this.knockbackFriction

    if (Math.abs(this.knockbackVelocityX) < 0.1) this.knockbackVelocityX = 0
    if (Math.abs(this.knockbackVelocityY) < 0.1) this.knockbackVelocityY = 0
  }
}
