/**
 * Player — The ship you control in the game.
 *
 * The player is a circle that can move around the canvas using keyboard input.
 * Projectiles are fired from the player's position, and the game ends
 * if any enemy touches the player.
 */
export class Player {
  constructor(context, positionX, positionY, radius, color) {
    this.context = context
    this.positionX = positionX
    this.positionY = positionY
    this.radius = radius
    this.color = color

    // Movement speed in pixels per frame.
    // At 60fps, a speed of 3 means the player crosses a 1920px screen in ~10 seconds —
    // fast enough to dodge enemies but slow enough to feel controllable.
    this.speed = 3
  }

  draw() {
    this.context.beginPath()
    this.context.arc(this.positionX, this.positionY, this.radius, 0, Math.PI * 2, false)
    this.context.fillStyle = this.color
    this.context.fill()
  }

  /**
   * Move the player based on keyboard input direction, then draw.
   *
   * @param {Object} direction - A normalized vector { directionX, directionY } from InputHandler.
   *   "Normalized" means the vector's length is always 1 (or 0 if no keys pressed),
   *   so the player moves at the same speed whether going straight or diagonally.
   * @param {number} canvasWidth - Used to clamp the player inside the canvas.
   * @param {number} canvasHeight - Used to clamp the player inside the canvas.
   */
  update(direction, canvasWidth, canvasHeight) {
    this.positionX += direction.directionX * this.speed
    this.positionY += direction.directionY * this.speed

    // Clamp position so the player circle never leaves the visible canvas area.
    // We account for the radius so the edge of the circle stays inside, not just the center.
    this.positionX = Math.max(this.radius, Math.min(canvasWidth - this.radius, this.positionX))
    this.positionY = Math.max(this.radius, Math.min(canvasHeight - this.radius, this.positionY))

    this.draw()
  }
}
