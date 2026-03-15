/**
 * Projectile — Bullets fired by the player toward the mouse click position.
 *
 * When the player clicks, we calculate the angle from the player to the click
 * using atan2, then create a velocity vector in that direction.
 * The projectile travels in a straight line until it hits an enemy or leaves the screen.
 *
 * This class wraps ProjectileSim (pure logic) and adds canvas rendering.
 * ProjectileSim can run on the server without a canvas; this class is client-only.
 */
import { ProjectileSim } from './simulation/ProjectileSim.js'

export class Projectile {
  constructor(context, positionX, positionY, radius, color, velocity) {
    this.context = context
    this.sim = new ProjectileSim(null, positionX, positionY, radius, color, velocity, null)
  }

  // Proxy properties so existing code that reads projectile.positionX etc. still works
  get positionX() { return this.sim.positionX }
  set positionX(value) { this.sim.positionX = value }
  get positionY() { return this.sim.positionY }
  set positionY(value) { this.sim.positionY = value }
  get radius() { return this.sim.radius }
  set radius(value) { this.sim.radius = value }
  get color() { return this.sim.color }
  set color(value) { this.sim.color = value }
  get velocity() { return this.sim.velocity }
  set velocity(value) { this.sim.velocity = value }

  draw() {
    this.context.beginPath()
    this.context.arc(this.sim.positionX, this.sim.positionY, this.sim.radius, 0, Math.PI * 2, false)
    this.context.fillStyle = this.sim.color
    this.context.fill()
  }

  update() {
    this.draw()
    this.sim.update()
  }
}
