/**
 * StateRenderer — Draws the game state from server snapshots onto the canvas.
 *
 * This replaces the per-entity draw() methods for networked play.
 * Instead of each entity drawing itself, we render everything from
 * the state snapshot data the server sends each tick.
 */

/**
 * Draw all alive players as circles with labels.
 *
 * @param {CanvasRenderingContext2D} context
 * @param {Array} players - Player objects from state snapshot.
 * @param {string} myPlayerId - This client's player ID (for the "YOU" label).
 * @param {number} scaleX - Horizontal scale factor (clientWidth / serverWidth).
 * @param {number} scaleY - Vertical scale factor (clientHeight / serverHeight).
 */
export function drawPlayers(context, players, myPlayerId, scaleX, scaleY) {
  for (const player of players) {
    if (!player.alive) continue

    const screenX = player.positionX * scaleX
    const screenY = player.positionY * scaleY
    const screenRadius = player.radius * Math.min(scaleX, scaleY)

    // Draw the player circle
    context.beginPath()
    context.arc(screenX, screenY, screenRadius, 0, Math.PI * 2, false)
    context.fillStyle = player.color
    context.fill()

    // Draw the health bar above the player.
    // Color shifts from green (healthy) to yellow (hurt) to red (critical).
    const barWidth = screenRadius * 4
    const barHeight = Math.max(4, screenRadius * 0.4)
    const barX = screenX - barWidth / 2
    const barY = screenY - screenRadius - barHeight - 4
    const healthPercent = (player.health || 0) / (player.maxHealth || 100)

    // Background (dark gray)
    context.fillStyle = 'rgba(50, 50, 50, 0.8)'
    context.fillRect(barX, barY, barWidth, barHeight)

    // Health fill — green to yellow to red
    if (healthPercent > 0.6) {
      context.fillStyle = '#22cc22'
    } else if (healthPercent > 0.3) {
      context.fillStyle = '#cccc22'
    } else {
      context.fillStyle = '#cc2222'
    }
    context.fillRect(barX, barY, barWidth * healthPercent, barHeight)

    // Border
    context.strokeStyle = 'rgba(255, 255, 255, 0.5)'
    context.lineWidth = 1
    context.strokeRect(barX, barY, barWidth, barHeight)

    // Draw a label above the health bar
    const label = player.id === myPlayerId ? 'YOU' : player.id.toUpperCase()
    context.fillStyle = 'white'
    context.font = `${Math.round(12 * Math.min(scaleX, scaleY))}px sans-serif`
    context.textAlign = 'center'
    context.textBaseline = 'bottom'
    context.fillText(label, screenX, barY - 2)
  }
}

/**
 * Draw all enemies as circles.
 * Uses local visual radii (from GSAP tweens) for smooth shrink animations
 * when available, falling back to the server's radius otherwise.
 *
 * @param {CanvasRenderingContext2D} context
 * @param {Array} enemies - Enemy objects from state snapshot.
 * @param {number} scaleX
 * @param {number} scaleY
 * @param {Map} [enemyVisualRadii] - Optional map of enemyId → { radius } for smooth animations.
 */
export function drawEnemies(context, enemies, scaleX, scaleY, enemyVisualRadii) {
  for (const enemy of enemies) {
    const screenX = enemy.positionX * scaleX
    const screenY = enemy.positionY * scaleY

    // Use the local visual radius if GSAP is animating it, otherwise use server value
    const visual = enemyVisualRadii && enemyVisualRadii.get(enemy.id)
    const radius = visual ? visual.radius : enemy.radius
    const screenRadius = radius * Math.min(scaleX, scaleY)

    context.beginPath()
    context.arc(screenX, screenY, screenRadius, 0, Math.PI * 2, false)
    context.fillStyle = enemy.color
    context.fill()
  }
}

/**
 * Draw all projectiles as circles.
 */
export function drawProjectiles(context, projectiles, scaleX, scaleY) {
  for (const projectile of projectiles) {
    const screenX = projectile.positionX * scaleX
    const screenY = projectile.positionY * scaleY
    const screenRadius = projectile.radius * Math.min(scaleX, scaleY)

    context.beginPath()
    context.arc(screenX, screenY, screenRadius, 0, Math.PI * 2, false)
    context.fillStyle = projectile.color
    context.fill()
  }
}

/**
 * Draw the score and level HUD.
 * Single player: top-left. Two players: P1 top-left, P2 top-right, level centered.
 */
export function drawHUD(context, scores, level, myPlayerId, players, canvasWidth) {
  const fontSize = 24
  context.font = `${fontSize}px sans-serif`
  context.textBaseline = 'top'

  const alivePlayers = players.filter(player => player.alive || scores[player.id] > 0)

  if (alivePlayers.length <= 1) {
    // Single player HUD — same position as original game
    context.fillStyle = 'white'
    context.textAlign = 'left'
    context.fillText(`Score: ${scores[myPlayerId] || 0}`, 16, 16)
    context.fillText(`Level: ${level}`, 16, 48)
  } else {
    // Two-player HUD
    const player1 = players.find(player => player.id === 'p1')
    const player2 = players.find(player => player.id === 'p2')

    // Player 1 score — top left in their color
    if (player1) {
      context.fillStyle = player1.color
      context.textAlign = 'left'
      context.fillText(`P1: ${scores.p1 || 0}`, 16, 16)
    }

    // Player 2 score — top right in their color
    if (player2) {
      context.fillStyle = player2.color
      context.textAlign = 'right'
      context.fillText(`P2: ${scores.p2 || 0}`, canvasWidth - 16, 16)
    }

    // Level — centered
    context.fillStyle = 'white'
    context.textAlign = 'center'
    context.fillText(`Level: ${level}`, canvasWidth / 2, 16)
  }
}
