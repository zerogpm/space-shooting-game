/**
 * game.js — The heart of the game. Orchestrates the game loop, enemy spawning,
 * collision detection, scoring, and user input.
 *
 * Everything comes together here: the Player moves based on keyboard input,
 * Projectiles fly toward mouse clicks, Enemies spawn at edges and march inward,
 * and the ScoreManager tracks how well the player is doing.
 */
import { Player } from './Player.js'
import { Projectile } from './Projectile.js'
import { Enemy } from './Enemy.js'
import { Particle } from './Particle.js'
import { InputHandler } from './InputHandler.js'
import { ScoreManager } from './ScoreManager.js'

/**
 * Initialize and start the game.
 * Can be called multiple times — each call sets up a fresh game session.
 *
 * @param {HTMLCanvasElement} canvas - The canvas element to draw on.
 * @param {CanvasRenderingContext2D} context - The 2D drawing context for the canvas.
 */
export function startGame(canvas, context) {
  // Create the player at the center of the screen
  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
  const player = new Player(context, centerX, centerY, 10, 'white')

  // Set up keyboard input tracking and score display
  const input = new InputHandler()
  const scoreManager = new ScoreManager(context)

  // Grab the game-over overlay elements from the HTML so we can show/hide them
  const gameOverScreen = document.getElementById('game-over-screen')
  const finalScoreText = document.getElementById('final-score')
  const restartButton = document.getElementById('restart-button')

  // These arrays hold all active projectiles, enemies, and explosion particles.
  // Entities are added when created and removed when they collide, leave the screen, or fade out.
  const projectiles = []
  const enemies = []
  const particles = []

  // We store these IDs so we can stop them when the game ends
  let animationId = null
  let spawnTimerId = null
  let levelTimerId = null

  // ─── Difficulty Progression ───────────────────────────────────────
  // The game gets harder over time by increasing the level every 10 seconds.
  // Each level makes enemies spawn faster and move quicker, creating a natural
  // escalation that keeps the player engaged and challenged.
  let currentLevel = 1

  function startLevelTimer() {
    levelTimerId = setInterval(() => {
      currentLevel++
      scoreManager.setLevel(currentLevel)
    }, 10000) // level up every 10 seconds
  }

  /**
   * Calculate how often enemies spawn at the current level.
   * Starts at 1000ms (1 per second) and decreases by 75ms each level,
   * but never goes below 200ms — that's already 5 enemies per second
   * which is plenty overwhelming.
   */
  function getSpawnDelay() {
    return Math.max(200, 1000 - (currentLevel - 1) * 75)
  }

  /**
   * Calculate how fast enemies move at the current level.
   * Starts at 1x speed and increases by 0.2 each level.
   * By level 5, enemies move at 1.8x speed — noticeably faster
   * but still dodgeable for a skilled player.
   */
  function getEnemySpeed() {
    return 1 + (currentLevel - 1) * 0.2
  }

  // ─── Enemy Spawning ─────────────────────────────────────────────
  // We use recursive setTimeout instead of setInterval so the delay
  // can change dynamically as the level increases. setInterval locks
  // in a fixed delay when first called and can't be adjusted.
  function spawnOneEnemy() {
    // Random radius between 4 and 30 pixels — bigger enemies are harder to destroy
    const radius = Math.random() * (30 - 4) + 4

    let spawnX
    let spawnY

    // Randomly choose whether the enemy appears on a vertical edge (left/right)
    // or a horizontal edge (top/bottom). This gives an even spread around the screen.
    if (Math.random() < 0.5) {
      // Spawn on left or right edge — offset by radius so the enemy starts fully off-screen
      spawnX = Math.random() < 0.5 ? 0 - radius : canvas.width + radius
      spawnY = Math.random() * canvas.height
    } else {
      // Spawn on top or bottom edge
      spawnX = Math.random() * canvas.width
      spawnY = Math.random() < 0.5 ? 0 - radius : canvas.height + radius
    }

    // Each enemy gets a unique hue using HSL color space.
    // Math.random() * 360 picks a random hue angle (0-360 on the color wheel).
    const color = `hsl(${Math.random() * 360}, 50%, 50%)`

    // Calculate the angle from the spawn point toward the player's CURRENT position.
    // Math.atan2(deltaY, deltaX) returns the angle in radians between the positive X axis
    // and the line from the origin to the point (deltaX, deltaY).
    // We aim at the player's position at spawn time — enemies do NOT track the player
    // after spawning. This makes their paths predictable so the player can dodge.
    const angleToPlayer = Math.atan2(
      player.positionY - spawnY,
      player.positionX - spawnX
    )

    // Convert the angle to a velocity vector, scaled by the current level's speed.
    // cos(angle) gives the horizontal component, sin(angle) gives the vertical component.
    // Together they create a unit vector (length 1) pointing toward the player,
    // then multiplied by the speed factor so higher levels produce faster enemies.
    const speedMultiplier = getEnemySpeed()
    const velocity = {
      horizontal: Math.cos(angleToPlayer) * speedMultiplier,
      vertical: Math.sin(angleToPlayer) * speedMultiplier
    }

    enemies.push(new Enemy(context, spawnX, spawnY, radius, color, velocity))
  }

  function scheduleNextSpawn() {
    // Each call reads the current spawn delay, so as the level increases
    // enemies spawn more frequently without needing to restart the timer
    spawnTimerId = setTimeout(() => {
      spawnOneEnemy()
      scheduleNextSpawn()
    }, getSpawnDelay())
  }

  // ─── Particle Explosion ────────────────────────────────────────
  // When a projectile hits an enemy, we create a burst of tiny particles
  // at the collision point. Each particle flies in a random direction,
  // matching the enemy's color so it looks like the enemy is shattering.
  //
  // More particles = bigger visual impact:
  //   - Shrink hit (enemy survives): 8 particles — a small "chip" effect
  //   - Kill hit (enemy destroyed):  24 particles — a satisfying explosion
  function spawnExplosion(positionX, positionY, color, particleCount) {
    for (let index = 0; index < particleCount; index++) {
      // Each particle flies in a random direction (0 to 2π radians = full circle)
      const randomAngle = Math.random() * Math.PI * 2
      // Random speed between 1 and 6 gives variety — some particles fly far,
      // others stay close, making the explosion look organic rather than uniform
      const randomSpeed = Math.random() * 5 + 1
      const velocity = {
        horizontal: Math.cos(randomAngle) * randomSpeed,
        vertical: Math.sin(randomAngle) * randomSpeed
      }
      // Particle radius between 1 and 3 pixels — small enough to look like debris
      const particleRadius = Math.random() * 2 + 1
      particles.push(new Particle(context, positionX, positionY, particleRadius, color, velocity))
    }
  }

  // ─── Game Loop ──────────────────────────────────────────────────
  // This function runs ~60 times per second via requestAnimationFrame.
  // Each frame: clear screen → update all entities → check collisions → draw score.
  function animate() {
    animationId = requestAnimationFrame(animate)

    // Clear the entire canvas to a solid black background each frame.
    // This gives a clean render with no leftover artifacts from previous frames.
    context.fillStyle = 'black'
    context.fillRect(0, 0, canvas.width, canvas.height)

    // Move the player based on which keys are currently pressed
    const movementDirection = input.getDirection()
    player.update(movementDirection, canvas.width, canvas.height)

    // ── Update projectiles ──
    // We iterate backwards (from last to first) so we can safely remove items with splice.
    // When you splice index 5 out of an array, items at index 6+ shift down by one.
    // If we iterated forwards, we'd skip the item that shifted into the removed slot.
    // Iterating backwards avoids this because items at lower indices are unaffected.
    for (let projectileIndex = projectiles.length - 1; projectileIndex >= 0; projectileIndex--) {
      const projectile = projectiles[projectileIndex]
      projectile.update()

      // Remove projectiles that have left the visible screen area.
      // We check all four edges, accounting for the projectile's radius
      // so it's fully off-screen before removal (not just the center point).
      const isOffScreen =
        projectile.positionX + projectile.radius < 0 ||
        projectile.positionX - projectile.radius > canvas.width ||
        projectile.positionY + projectile.radius < 0 ||
        projectile.positionY - projectile.radius > canvas.height

      if (isOffScreen) {
        projectiles.splice(projectileIndex, 1)
      }
    }

    // ── Update particles ──
    // Particles fade out over time. Once fully transparent (alpha <= 0),
    // they are removed. We iterate backwards for safe splicing, same as projectiles.
    for (let particleIndex = particles.length - 1; particleIndex >= 0; particleIndex--) {
      const particle = particles[particleIndex]
      particle.update()

      if (particle.alpha <= 0) {
        particles.splice(particleIndex, 1)
      }
    }

    // ── Update enemies and check collisions ──
    for (let enemyIndex = enemies.length - 1; enemyIndex >= 0; enemyIndex--) {
      const enemy = enemies[enemyIndex]
      enemy.update()

      // Check if this enemy has reached the player.
      // Math.hypot calculates the straight-line distance between two points.
      // If the distance minus both radii is less than 1 pixel, the circles are touching.
      const distanceToPlayer = Math.hypot(
        player.positionX - enemy.positionX,
        player.positionY - enemy.positionY
      )

      if (distanceToPlayer - player.radius - enemy.radius < 1) {
        // Game over — stop the loop, stop all timers, clean up all event listeners
        cancelAnimationFrame(animationId)
        clearTimeout(spawnTimerId)
        clearInterval(levelTimerId)
        canvas.removeEventListener('click', handleCanvasClick)
        canvas.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('keydown', handleSpacebarFire)
        input.destroy()

        // Show the game-over overlay with the player's final score
        endGame(scoreManager.score)
        return
      }

      // Check if any projectile has hit this enemy
      for (let projectileIndex = projectiles.length - 1; projectileIndex >= 0; projectileIndex--) {
        const projectile = projectiles[projectileIndex]
        const distanceBetween = Math.hypot(
          projectile.positionX - enemy.positionX,
          projectile.positionY - enemy.positionY
        )

        // Collision detected — the projectile and enemy circles are overlapping
        if (distanceBetween - enemy.radius - projectile.radius < 1) {
          if (enemy.radius - 10 > 5) {
            // Enemy is big enough to survive: shrink it by 10px using GSAP animation.
            // GSAP smoothly interpolates the radius value over several frames,
            // creating a satisfying visual "crunch" effect instead of an instant size change.
            gsap.to(enemy, { radius: enemy.radius - 10 })
            scoreManager.addShrinkPoints()
            // Small chip explosion — 8 particles since the enemy survives
            spawnExplosion(enemy.positionX, enemy.positionY, enemy.color, 8)
            projectiles.splice(projectileIndex, 1)
          } else {
            // Enemy is too small to shrink further — destroy it completely
            scoreManager.addKillPoints()
            // Big explosion — 24 particles for a satisfying destruction effect
            spawnExplosion(enemy.positionX, enemy.positionY, enemy.color, 24)
            enemies.splice(enemyIndex, 1)
            projectiles.splice(projectileIndex, 1)
            // Break out of the projectile loop because this enemy no longer exists.
            // Continuing to check other projectiles against a removed enemy would cause bugs.
            break
          }
        }
      }
    }

    // Draw the score last so it always appears on top of all game entities
    scoreManager.draw()
  }

  // ─── Firing Projectiles ─────────────────────────────────────────
  // The player can shoot in two ways:
  //   1. Left-click on the canvas — fires toward where you clicked
  //   2. Spacebar — fires toward the current mouse cursor position
  // Both methods use the same fireProjectile function, just with different trigger events.

  // Track the mouse position so spacebar knows where to aim.
  // We update this every time the mouse moves over the canvas.
  let mousePositionX = centerX
  let mousePositionY = centerY

  function handleMouseMove(moveEvent) {
    mousePositionX = moveEvent.clientX
    mousePositionY = moveEvent.clientY
  }

  /**
   * Create a projectile that flies from the player toward a target point.
   * Used by both click and spacebar firing methods.
   */
  function fireProjectile(targetX, targetY) {
    // Calculate the angle from the player's current position to the target.
    // Math.atan2 returns the angle in radians, which we then convert
    // to horizontal and vertical velocity components using cos and sin.
    const angleToTarget = Math.atan2(
      targetY - player.positionY,
      targetX - player.positionX
    )

    // Multiply the unit direction vector by 5 to set the projectile speed.
    // Higher multiplier = faster projectiles. The value 5 means the projectile
    // moves 5 pixels per frame (~300 pixels per second at 60fps).
    const velocity = {
      horizontal: Math.cos(angleToTarget) * 5,
      vertical: Math.sin(angleToTarget) * 5
    }

    // Projectile starts at the player's current position
    projectiles.push(new Projectile(
      context,
      player.positionX,
      player.positionY,
      5,
      'white',
      velocity
    ))
  }

  // Left-click on the canvas fires toward where you clicked.
  // We attach to the canvas (not window) so clicks on UI buttons like "Try Again"
  // don't accidentally fire projectiles.
  function handleCanvasClick(clickEvent) {
    fireProjectile(clickEvent.clientX, clickEvent.clientY)
  }

  // Spacebar fires toward wherever the mouse cursor is currently pointing.
  // This lets the player keep shooting rapidly without clicking repeatedly.
  function handleSpacebarFire(keyEvent) {
    if (keyEvent.code === 'Space') {
      // Prevent the browser from scrolling the page when spacebar is pressed
      keyEvent.preventDefault()
      fireProjectile(mousePositionX, mousePositionY)
    }
  }

  canvas.addEventListener('click', handleCanvasClick)
  canvas.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('keydown', handleSpacebarFire)

  // ─── Game Over ──────────────────────────────────────────────────
  // Show the overlay with the final score and set up the restart button.
  function endGame(finalScore) {
    finalScoreText.textContent = `Score: ${finalScore}`

    // Add the "visible" class to show the overlay with flexbox centering.
    // We use a class toggle instead of setting display directly so that
    // all the layout rules stay in CSS where they belong.
    gameOverScreen.classList.add('visible')

    // Use onclick (assignment) instead of addEventListener to guarantee
    // only one handler exists — even if startGame is called multiple times,
    // each call replaces the previous handler rather than stacking them.
    restartButton.onclick = () => {
      gameOverScreen.classList.remove('visible')

      // Clear the canvas completely before restarting so there's no
      // leftover trail from the previous game
      context.fillStyle = 'black'
      context.fillRect(0, 0, canvas.width, canvas.height)

      // Start a fresh game with the same canvas
      startGame(canvas, context)
    }
  }

  // ─── Start the game ─────────────────────────────────────────────
  animate()
  scheduleNextSpawn()
  startLevelTimer()
}
