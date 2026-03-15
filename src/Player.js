/**
 * Player — The ship you control in the game.
 *
 * The player is a circle that can move around the canvas using keyboard input.
 * Projectiles are fired from the player's position, and the game ends
 * if any enemy touches the player.
 *
 * This class wraps PlayerSim (pure logic) and adds canvas rendering.
 * PlayerSim can run on the server without a canvas; this class is client-only.
 */
import { PlayerSim } from './simulation/PlayerSim.js'

export class Player {
  constructor(context, positionX, positionY, radius, color) {
    this.context = context
    this.sim = new PlayerSim(positionX, positionY, radius, color)
  }

  // Proxy properties so existing code that reads player.positionX etc. still works
  get positionX() { return this.sim.positionX }
  set positionX(value) { this.sim.positionX = value }
  get positionY() { return this.sim.positionY }
  set positionY(value) { this.sim.positionY = value }
  get radius() { return this.sim.radius }
  set radius(value) { this.sim.radius = value }
  get color() { return this.sim.color }
  set color(value) { this.sim.color = value }
  get speed() { return this.sim.speed }
  set speed(value) { this.sim.speed = value }
  get alive() { return this.sim.alive }
  set alive(value) { this.sim.alive = value }

  draw() {
    this.context.beginPath()
    this.context.arc(this.sim.positionX, this.sim.positionY, this.sim.radius, 0, Math.PI * 2, false)
    this.context.fillStyle = this.sim.color
    this.context.fill()
  }

  /**
   * Move the player based on keyboard input direction, then draw.
   *
   * @param {Object} direction - A normalized vector { directionX, directionY } from InputHandler.
   * @param {number} canvasWidth - Used to clamp the player inside the canvas.
   * @param {number} canvasHeight - Used to clamp the player inside the canvas.
   */
  update(direction, canvasWidth, canvasHeight) {
    this.sim.update(direction, canvasWidth, canvasHeight)
    this.draw()
  }
}
