/**
 * Particle — A tiny circle that flies outward from an explosion point and fades away.
 *
 * When a projectile hits an enemy, we spawn a burst of particles at the collision point.
 * Each particle flies in a random direction at a random speed, then gradually slows down
 * (via friction) and fades out (via decreasing alpha). Once fully transparent, the particle
 * is removed from the game.
 *
 * Particles use the same color as the enemy they came from, creating a satisfying
 * visual effect that makes it look like the enemy is breaking apart.
 */
export class Particle {
  /**
   * @param {CanvasRenderingContext2D} context - The drawing context.
   * @param {number} positionX - Starting X position (where the collision happened).
   * @param {number} positionY - Starting Y position (where the collision happened).
   * @param {number} radius - Size of the particle (randomized by the caller).
   * @param {string} color - Color of the particle (matches the enemy's color).
   * @param {Object} velocity - Initial direction and speed { horizontal, vertical }.
   */
  constructor(context, positionX, positionY, radius, color, velocity) {
    this.context = context
    this.positionX = positionX
    this.positionY = positionY
    this.radius = radius
    this.color = color
    this.velocity = velocity

    // Alpha controls transparency: 1 = fully visible, 0 = invisible.
    // We decrease it each frame so the particle gradually fades out.
    this.alpha = 1

    // Friction slows the particle down each frame by multiplying velocity.
    // A value of 0.98 means each frame retains 98% of the previous speed,
    // creating a natural deceleration like air resistance.
    this.friction = 0.98
  }

  draw() {
    // Save the current canvas state so we can change globalAlpha
    // without affecting other drawings in the same frame
    this.context.save()
    this.context.globalAlpha = this.alpha
    this.context.beginPath()
    this.context.arc(this.positionX, this.positionY, this.radius, 0, Math.PI * 2, false)
    this.context.fillStyle = this.color
    this.context.fill()
    // Restore the canvas state so globalAlpha goes back to normal
    this.context.restore()
  }

  update() {
    this.draw()

    // Apply friction to slow the particle down each frame
    this.velocity.horizontal *= this.friction
    this.velocity.vertical *= this.friction

    // Move the particle
    this.positionX += this.velocity.horizontal
    this.positionY += this.velocity.vertical

    // Fade out gradually. The rate (0.01) controls how long particles
    // stay visible — at 60fps, a particle lasts about 100 frames (~1.7 seconds).
    this.alpha -= 0.01
  }
}
