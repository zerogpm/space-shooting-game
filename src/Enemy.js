/**
 * Enemy — Hostile circles that spawn at the canvas edges and move toward the player.
 *
 * Each enemy gets a random size and color when created. Its velocity is calculated
 * at spawn time using atan2 to aim at wherever the player is at that moment.
 * After spawning, the enemy travels in a straight line (it does NOT track the player).
 * This makes movement predictable so the player can dodge strategically.
 */
export class Enemy {
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
