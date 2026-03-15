/**
 * NetworkClient — Thin WebSocket wrapper for game communication.
 *
 * Handles connection, JSON serialization, and message routing.
 * Knows nothing about game logic — purely transport.
 */
export class NetworkClient {
  constructor(url) {
    this.url = url || `ws://${window.location.host}`
    this.webSocket = null
    this.messageHandler = null
    this.disconnectHandler = null
  }

  /**
   * Open the WebSocket connection.
   * Resolves with the initial "welcome" message from the server.
   */
  connect() {
    return new Promise((resolve, reject) => {
      this.webSocket = new WebSocket(this.url)

      this.webSocket.onopen = () => {
        // Wait for the welcome message before resolving
      }

      this.webSocket.onmessage = (event) => {
        const message = JSON.parse(event.data)

        // The first message is always "welcome" — resolve the connect promise
        if (message.type === 'welcome' && resolve) {
          const resolveOnce = resolve
          resolve = null
          resolveOnce(message)
        }

        if (this.messageHandler) {
          this.messageHandler(message)
        }
      }

      this.webSocket.onclose = () => {
        if (this.disconnectHandler) {
          this.disconnectHandler()
        }
      }

      this.webSocket.onerror = () => {
        if (resolve) {
          const rejectOnce = reject
          resolve = null
          rejectOnce(new Error('WebSocket connection failed'))
        }
      }
    })
  }

  /**
   * Register a handler for all incoming messages (including welcome).
   */
  onMessage(callback) {
    this.messageHandler = callback
  }

  /**
   * Register a handler for connection close.
   */
  onDisconnect(callback) {
    this.disconnectHandler = callback
  }

  /**
   * Send the player's current movement direction.
   */
  sendInput(direction) {
    this.send({ type: 'input', direction })
  }

  /**
   * Send a fire event toward a target position.
   */
  sendFire(targetX, targetY) {
    this.send({ type: 'fire', targetX, targetY })
  }

  /**
   * Request to join an in-progress game.
   */
  sendJoinGame() {
    this.send({ type: 'joinGame' })
  }

  /**
   * Request a game restart after game over.
   */
  sendRestart() {
    this.send({ type: 'requestRestart' })
  }

  /**
   * Send a JSON message to the server.
   */
  send(message) {
    if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
      this.webSocket.send(JSON.stringify(message))
    }
  }

  /**
   * Close the connection.
   */
  disconnect() {
    if (this.webSocket) {
      this.webSocket.close()
      this.webSocket = null
    }
  }
}
