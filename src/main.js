/**
 * main.js — Entry point for the game.
 *
 * Attempts to connect to the game server for networked multiplayer.
 * If the server is unavailable, falls back to offline single-player mode.
 */
import { startGame } from './game.js'
import { startNetworkGame } from './networkGame.js'
import { NetworkClient } from './NetworkClient.js'

// Select the <canvas> element from the HTML and size it to fill the whole window.
const canvas = document.querySelector('canvas')
canvas.width = innerWidth
canvas.height = innerHeight

const context = canvas.getContext('2d')

// Grab UI elements for the join screen
const joinGameScreen = document.getElementById('join-game-screen')
const joinGameButton = document.getElementById('join-game-button')

// ─── Attempt Networked Connection ─────────────────────────────
const networkClient = new NetworkClient()

networkClient.connect()
  .then((welcomeMessage) => {
    const { playerId, status } = welcomeMessage

    if (status === 'new') {
      // First player — game starts immediately through the server.
      // Wait for the gameStart message with initial state.
      networkClient.onMessage((message) => {
        if (message.type === 'gameStart') {
          startNetworkGame(canvas, context, networkClient, message.yourPlayerId, message.state)
        }
      })
    } else if (status === 'inProgress') {
      // Game already running — show the join screen
      if (joinGameScreen) joinGameScreen.classList.add('visible')

      if (joinGameButton) {
        joinGameButton.onclick = () => {
          joinGameScreen.classList.remove('visible')
          networkClient.sendJoinGame()

          // Wait for gameStart message after joining
          networkClient.onMessage((message) => {
            if (message.type === 'gameStart') {
              startNetworkGame(canvas, context, networkClient, message.yourPlayerId, message.state)
            }
          })
        }
      }
    }
  })
  .catch(() => {
    // Server unavailable — fall back to offline single-player
    console.log('Server unavailable — starting offline mode')
    startGame(canvas, context)
  })
