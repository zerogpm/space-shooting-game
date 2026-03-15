/**
 * ProjectileSim — Pure simulation logic for a projectile entity.
 * No canvas dependency — this class can run on both client and server.
 *
 * Projectiles fly in a straight line from a player toward a target.
 * The ownerId field tracks which player fired this projectile,
 * which is needed for multiplayer PvP (your bullets can't hit yourself).
 */
export class ProjectileSim {
  constructor(id, positionX, positionY, radius, color, velocity, ownerId) {
    this.id = id
    this.positionX = positionX
    this.positionY = positionY
    this.radius = radius
    this.color = color
    // velocity is an object { horizontal, vertical } — pixels moved per frame on each axis
    this.velocity = velocity
    this.ownerId = ownerId
  }

  update() {
    this.positionX += this.velocity.horizontal
    this.positionY += this.velocity.vertical
  }
}
