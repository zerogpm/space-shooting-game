/**
 * Shared constants used by both the server and client.
 * The server uses these for GameSim dimensions and player config.
 * The client uses these for scaling rendering to match the server's coordinate space.
 */

export const CANVAS_WIDTH = 1024
export const CANVAS_HEIGHT = 576
export const TICK_RATE = 60
export const PLAYER_RADIUS = 10

export const PLAYER_COLORS = {
  p1: 'cyan',
  p2: 'magenta'
}
