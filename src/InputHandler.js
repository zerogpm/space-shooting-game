/**
 * InputHandler — Tracks which keyboard keys are currently held down
 * and converts them into a movement direction for the player.
 *
 * Supports three types of movement keys:
 *   - WASD keys for cardinal directions (common in PC gaming)
 *   - Arrow keys for cardinal directions (intuitive for beginners)
 *   - Q, E, Z, C for dedicated diagonal directions
 *
 * When multiple keys are pressed, their effects combine.
 * For example, holding W + D produces the same up-right direction as pressing E.
 *
 * The output direction is always "normalized" — meaning it has a length of 1.
 * Without normalization, diagonal movement (e.g., up + right) would be ~1.41x faster
 * than cardinal movement (just up), because the diagonal of a unit square is √2 ≈ 1.414.
 * Normalizing ensures consistent speed regardless of direction.
 */
export class InputHandler {
  constructor() {
    // A Set is used instead of an object because it cleanly handles
    // add/delete without needing to worry about true/false states
    this.pressedKeys = new Set()

    // We use e.code (physical key position like "KeyW") instead of e.key (character like "w")
    // because e.code is unaffected by caps lock, shift, or non-QWERTY keyboard layouts
    this.handleKeyDown = (keyEvent) => {
      this.pressedKeys.add(keyEvent.code)
    }

    this.handleKeyUp = (keyEvent) => {
      this.pressedKeys.delete(keyEvent.code)
    }

    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
  }

  /**
   * Calculate a normalized movement direction based on all currently pressed keys.
   *
   * @returns {{ directionX: number, directionY: number }}
   *   A unit vector (length 1) pointing in the desired movement direction,
   *   or { 0, 0 } if no movement keys are pressed.
   */
  getDirection() {
    let directionX = 0
    let directionY = 0

    // Cardinal directions — WASD and arrow keys
    if (this.pressedKeys.has('KeyW') || this.pressedKeys.has('ArrowUp'))    directionY -= 1
    if (this.pressedKeys.has('KeyS') || this.pressedKeys.has('ArrowDown'))  directionY += 1
    if (this.pressedKeys.has('KeyA') || this.pressedKeys.has('ArrowLeft'))  directionX -= 1
    if (this.pressedKeys.has('KeyD') || this.pressedKeys.has('ArrowRight')) directionX += 1

    // Diagonal shortcut keys — each one adds both horizontal and vertical components
    if (this.pressedKeys.has('KeyQ')) { directionX -= 1; directionY -= 1 } // up-left
    if (this.pressedKeys.has('KeyE')) { directionX += 1; directionY -= 1 } // up-right
    if (this.pressedKeys.has('KeyZ')) { directionX -= 1; directionY += 1 } // down-left
    if (this.pressedKeys.has('KeyC')) { directionX += 1; directionY += 1 } // down-right

    // Normalize the direction vector so movement speed is the same in every direction.
    // Math.hypot gives us the length (magnitude) of the vector.
    // Dividing each component by the magnitude scales the vector to length 1.
    const magnitude = Math.hypot(directionX, directionY)
    if (magnitude > 0) {
      directionX /= magnitude
      directionY /= magnitude
    }

    return { directionX, directionY }
  }

  /**
   * Remove event listeners. Call this when the game ends to prevent
   * keyboard events from firing after the game loop has stopped.
   */
  destroy() {
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
  }
}
