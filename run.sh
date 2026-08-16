#!/usr/bin/env bash
# Brings up everything demo-app needs: Postgres (via compose), migrations, seed
# data, then the Next.js dev server. Deliberately paired with docker-compose.yml
# at the repo root so webapp-uat's setup wizard detects this as the start command.
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example (all demo bug toggles off by default)"
fi

docker compose up -d db

echo -n "Waiting for Postgres..."
for i in $(seq 1 30); do
  if docker compose exec -T db pg_isready -U demo -d demo_app > /dev/null 2>&1; then
    echo " ready"
    break
  fi
  echo -n "."
  sleep 1
done

npx prisma migrate deploy
npx prisma db seed

exec npm run dev
