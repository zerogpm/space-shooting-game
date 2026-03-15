/**
 * server.js — Game server that serves static files and manages WebSocket connections.
 *
 * Replaces Nginx with a single Node.js process that handles both HTTP (static files)
 * and WebSocket (game state) on port 3000. Docker maps this to port 80.
 */
import { createServer } from 'http'
import { readFile } from 'fs/promises'
import { join, extname } from 'path'
import { fileURLToPath } from 'url'
import { WebSocketServer } from 'ws'
import { GameSession } from './GameSession.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const PROJECT_ROOT = join(__dirname, '..')

// MIME types for static file serving
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg'
}

// ─── HTTP Server (Static Files) ─────────────────────────────────
const httpServer = createServer(async (request, response) => {
  let filePath = request.url === '/' ? '/index.html' : request.url

  // Prevent directory traversal
  if (filePath.includes('..')) {
    response.writeHead(403)
    response.end('Forbidden')
    return
  }

  const fullPath = join(PROJECT_ROOT, filePath)
  const extension = extname(fullPath)
  const contentType = MIME_TYPES[extension] || 'application/octet-stream'

  try {
    const content = await readFile(fullPath)

    // Audio files get long cache headers — browser downloads once, then serves locally.
    // This prevents the 9MB+ BGM from competing with WebSocket traffic on repeat visits.
    const headers = { 'Content-Type': contentType }
    if (['.mp3', '.wav', '.ogg'].includes(extension)) {
      headers['Cache-Control'] = 'public, max-age=604800' // 7 days
    }

    response.writeHead(200, headers)
    response.end(content)
  } catch {
    response.writeHead(404)
    response.end('Not Found')
  }
})

// ─── WebSocket Server ───────────────────────────────────────────
const webSocketServer = new WebSocketServer({ server: httpServer })

let gameSession = null
const connectedPlayers = new Map() // playerId → WebSocket

/**
 * Send a JSON message to a specific WebSocket client.
 */
function sendToClient(webSocket, message) {
  if (webSocket.readyState === webSocket.OPEN) {
    webSocket.send(JSON.stringify(message))
  }
}

/**
 * Broadcast a JSON message to all connected players.
 */
function broadcastToAll(message) {
  const data = JSON.stringify(message)
  for (const [, webSocket] of connectedPlayers) {
    if (webSocket.readyState === webSocket.OPEN) {
      webSocket.send(data)
    }
  }
}

/**
 * Send a JSON message to a specific player by ID.
 */
function sendToPlayerById(playerId, message) {
  const webSocket = connectedPlayers.get(playerId)
  if (webSocket) {
    sendToClient(webSocket, message)
  }
}

/**
 * Assign a player ID to a new connection.
 * Returns "p1" or "p2", or null if the game is full.
 */
function assignPlayerId() {
  if (!connectedPlayers.has('p1')) return 'p1'
  if (!connectedPlayers.has('p2')) return 'p2'
  return null
}

/**
 * Restart the game for all connected players.
 * If showChallenger is true, pauses with the dramatic announcement first.
 */
function performRestart(showChallenger) {
  const playerIds = Array.from(connectedPlayers.keys())
  const state = gameSession.restart(playerIds)

  if (showChallenger && playerIds.length > 1) {
    // Pause the game and show challenger announcement
    gameSession.paused = true

    for (const [pid, ws] of connectedPlayers) {
      sendToClient(ws, {
        type: 'gameStart',
        state,
        yourPlayerId: pid
      })
    }

    broadcastToAll({
      type: 'challengerJoined',
      newPlayerId: playerIds[1],
      playerColor: 'magenta'
    })

    // Resume after dramatic pause
    setTimeout(() => {
      if (gameSession) {
        gameSession.paused = false
        broadcastToAll({ type: 'challengerReady' })
      }
    }, 2500)
  } else {
    // Instant restart (both were dead, or single player)
    for (const [pid, ws] of connectedPlayers) {
      sendToClient(ws, {
        type: 'gameStart',
        state,
        yourPlayerId: pid
      })
    }
  }
}

webSocketServer.on('connection', (webSocket) => {
  const playerId = assignPlayerId()

  if (!playerId) {
    sendToClient(webSocket, { type: 'error', message: 'Game is full' })
    webSocket.close()
    return
  }

  connectedPlayers.set(playerId, webSocket)
  console.log(`Player ${playerId} connected`)

  if (!gameSession) {
    // First player — create a new game session
    gameSession = new GameSession(broadcastToAll, sendToPlayerById)
    gameSession.start(playerId)

    sendToClient(webSocket, { type: 'welcome', playerId, status: 'new' })
    sendToClient(webSocket, {
      type: 'gameStart',
      state: gameSession.getStateSnapshot(),
      yourPlayerId: playerId
    })
  } else {
    // Game already in progress — player can join
    sendToClient(webSocket, { type: 'welcome', playerId, status: 'inProgress' })
  }

  // ─── Message Handling ───────────────────────────────────────
  webSocket.on('message', (data) => {
    let message
    try {
      message = JSON.parse(data)
    } catch {
      return
    }

    if (!gameSession) return

    switch (message.type) {
      case 'input':
        gameSession.handleInput(playerId, message.direction)
        break

      case 'fire':
        gameSession.handleFire(playerId, message.targetX, message.targetY)
        break

      case 'joinGame':
        gameSession.handleJoinGame(playerId, (msg) => sendToClient(webSocket, msg))
        break

      case 'togglePause': {
        const paused = gameSession.handleTogglePause(playerId)
        if (paused) {
          broadcastToAll({ type: 'gamePaused', byPlayerId: playerId })
        } else {
          broadcastToAll({ type: 'gameUnpaused' })
        }
        break
      }

      case 'requestRestart': {
        const result = gameSession.handleRestartRequest(playerId)
        if (result === 'restart') {
          // All players dead — instant restart, no announcement needed
          performRestart(false)
        }
        break
      }

      case 'acceptRematch': {
        const result = gameSession.handleAcceptRematch()
        if (result === 'restart') {
          // Rematch accepted — pause with challenger announcement
          performRestart(true)
        }
        break
      }

      case 'declineRematch':
        gameSession.handleDeclineRematch()
        break

      case 'acceptJoin':
        gameSession.handleAcceptJoin()
        break

      case 'declineJoin':
        gameSession.handleDeclineJoin()
        break
    }
  })

  // ─── Disconnection ──────────────────────────────────────────
  webSocket.on('close', () => {
    console.log(`Player ${playerId} disconnected`)
    connectedPlayers.delete(playerId)

    if (gameSession) {
      gameSession.removePlayer(playerId)
      broadcastToAll({ type: 'playerDisconnected', playerId })

      // If no players left, destroy the session
      if (connectedPlayers.size === 0) {
        gameSession.destroy()
        gameSession = null
        console.log('Game session destroyed — no players')
      }
    }
  })
})

// ─── Start ──────────────────────────────────────────────────────
const PORT = 3000
httpServer.listen(PORT, () => {
  console.log(`Game server running on port ${PORT}`)
})
