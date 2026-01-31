/**
 * ScoreManager — Tracks and displays the player's score and current level on the canvas.
 *
 * Points are awarded for damaging enemies:
 *   - Shrinking an enemy (hitting a large one): +10 points
 *   - Destroying an enemy completely:           +100 points
 *
 * The HUD is drawn directly on the canvas (not as an HTML element)
 * so it stays part of the game's visual layer and works with the trail effect.
 * It's rendered last each frame so it always appears on top of everything else.
 */
export class ScoreManager {
  constructor(context) {
    this.context = context
    this.score = 0
    this.level = 1
  }

  /** Award points for shrinking an enemy (partial hit on a large enemy) */
  addShrinkPoints() {
    this.score += 10
  }

  /** Award points for completely destroying an enemy */
  addKillPoints() {
    this.score += 100
  }

  /** Update the displayed level number */
  setLevel(newLevel) {
    this.level = newLevel
  }

  /**
   * Draw the score and level in the top-left corner of the canvas.
   * Called once per frame at the end of the game loop so it renders
   * on top of all game entities.
   */
  draw() {
    this.context.fillStyle = 'white'
    this.context.font = '24px sans-serif'
    this.context.textAlign = 'left'
    this.context.textBaseline = 'top'
    this.context.fillText(`Score: ${this.score}`, 16, 16)
    // Show the level below the score so the player knows
    // the game is getting progressively harder
    this.context.fillText(`Level: ${this.level}`, 16, 48)
  }
}
