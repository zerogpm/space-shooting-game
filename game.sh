#!/usr/bin/env bash

# game.sh — Start, stop, and restart the game via Docker Compose.
# Usage: ./game.sh {start|stop|restart|status}

set -e

show_help() {
  echo "Space Shooting Game - Docker Management"
  echo ""
  echo "Usage: ./game.sh <command>"
  echo ""
  echo "Commands:"
  echo "  start     Start the game server in the background"
  echo "  stop      Stop the game server"
  echo "  restart   Stop and start the game server"
  echo "  build     Build the Docker image"
  echo "  status    Show the current container status"
  echo "  logs      Show server logs"
  echo "  -h, --help  Show this help message"
}

get_port() {
  # Read the host port from docker-compose.yml (e.g., "- 8325:3000" → "8325")
  grep -oE '[0-9]+:[0-9]+' docker-compose.yml | head -1 | cut -d: -f1
}

get_local_ip() {
  # Get the LAN IP address for other players to connect
  ipconfig 2>/dev/null | grep "IPv4" | head -1 | sed 's/.*: //'
}

start_game() {
  echo "Starting game server..."
  docker compose up -d --remove-orphans

  local port
  port=$(get_port)
  local ip
  ip=$(get_local_ip)

  echo ""
  echo "Game is running!"
  echo "  Player 1 (this PC):    http://localhost:${port}"
  echo "  Player 2 (other PC):   http://${ip}:${port}"
}

stop_game() {
  echo "Stopping game server..."
  docker compose down --remove-orphans
  echo "Game stopped."
}

case "${1}" in
  build)
    echo "Building game server image..."
    docker compose build
    echo "Build complete."
    ;;
  start)
    start_game
    ;;
  stop)
    stop_game
    ;;
  restart)
    stop_game
    start_game
    ;;
  status)
    docker compose ps
    ;;
  logs)
    docker compose logs -f
    ;;
  -h|--help)
    show_help
    ;;
  *)
    show_help
    exit 1
    ;;
esac
