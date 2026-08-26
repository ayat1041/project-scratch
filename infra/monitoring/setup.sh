#!/usr/bin/env bash
# Run once before the first `docker compose up`
# Creates the external Docker network and named volumes that docker-compose.yml expects.
set -euo pipefail

NETWORK="monitoring-stack-network"
VOLUMES=(monit-grafana-data monit-prometheus-data monit-loki-data monit-tempo-data)

echo "==> Creating Docker network: $NETWORK"
if docker network inspect "$NETWORK" &>/dev/null; then
  echo "    Already exists — skipping"
else
  docker network create "$NETWORK"
  echo "    Created"
fi

echo "==> Creating Docker volumes"
for vol in "${VOLUMES[@]}"; do
  if docker volume inspect "$vol" &>/dev/null; then
    echo "    $vol — already exists, skipping"
  else
    docker volume create "$vol"
    echo "    $vol — created"
  fi
done

echo ""
echo "==> Setup complete. Next steps:"
echo "    1. cp .env.example .env"
echo "    2. Edit .env and set GF_ADMIN_PASSWORD"
echo "    3. docker compose up -d"
