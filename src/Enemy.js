/**
 * Enemy — Hostile circles that spawn at the canvas edges and move toward the player.
 *
 * Each enemy gets a random size and color when created. Its velocity is calculated
 * at spawn time using atan2 to aim at wherever the player is at that moment.
 * After spawning, the enemy travels in a straight line (it does NOT track the player).
 * This makes movement predictable so the player can dodge strategically.
 *
 * This class wraps EnemySim (pure logic) and adds canvas rendering.
 * EnemySim can run on the server without a canvas; this class is client-only.
 */
import { EnemySim } from './simulation/EnemySim.js'

export class Enemy {
  constructor(context, positionX, positionY, radius, color, velocity) {
    this.context = context
    this.sim = new EnemySim(null, positionX, positionY, radius, color, velocity)
  }

  // Proxy properties so existing code that reads enemy.positionX etc. still works
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
