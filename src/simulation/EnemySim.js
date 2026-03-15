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
  }

  update() {
    this.positionX += this.velocity.horizontal
    this.positionY += this.velocity.vertical
  }
}
