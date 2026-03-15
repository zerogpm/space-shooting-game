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

start_game() {
  echo "Starting game server..."
  docker compose up -d --remove-orphans
  echo "Game running at http://localhost"
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
