# Fix Docker container conflict

## Context
The old Nginx container named `space-shooting` is still running from the previous docker-compose.yml config. The new `docker-compose.yml` renamed the service from `nginx` to `game-server` but kept the same `container_name`, causing a conflict. Also the `version` key is obsolete.

## Fix
1. Remove `version: "3.9"` from docker-compose.yml (obsolete, causes warning)
2. Update `stop_game()` in game.sh to use `--remove-orphans` flag to clean up old containers
3. Add `--remove-orphans` to `start_game()` too for safety

## Files
- `docker-compose.yml` (remove version)
- `game.sh` (add --remove-orphans to stop and start)
