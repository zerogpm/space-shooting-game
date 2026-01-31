/**
 * Projectile — Bullets fired by the player toward the mouse click position.
 *
 * When the player clicks, we calculate the angle from the player to the click
 * using atan2, then create a velocity vector in that direction.
 * The projectile travels in a straight line until it hits an enemy or leaves the screen.
 */
export class Projectile {
  constructor(context, positionX, positionY, radius, color, velocity) {
    this.context = context
    this.positionX = positionX
    this.positionY = positionY
    this.radius = radius
    this.color = color
    // velocity is an object { horizontal, vertical } — pixels moved per frame on each axis
    this.velocity = velocity
  }

  draw() {
    this.context.beginPath()
    this.context.arc(this.positionX, this.positionY, this.radius, 0, Math.PI * 2, false)
    this.context.fillStyle = this.color
    this.context.fill()
  }

  update() {
    this.draw()
    this.positionX = this.positionX + this.velocity.horizontal
    this.positionY = this.positionY + this.velocity.vertical
  }
}
