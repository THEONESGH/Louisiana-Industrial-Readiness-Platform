#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"

if [ ! -f "$ROOT/backend/.env" ]; then
  cp "$ROOT/backend/.env.example" "$ROOT/backend/.env"
  echo "Created backend/.env from example. Edit it before going live."
fi
if [ ! -f "$ROOT/frontend/.env" ]; then
  cp "$ROOT/frontend/.env.example" "$ROOT/frontend/.env"
fi

echo "1) Start MongoDB locally (or: docker run -d -p 27017:27017 --name lir-mongo mongo:7)"
echo "2) Backend:  cd backend && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && uvicorn server:app --reload --port 8000"
echo "3) Frontend: cd frontend && npm install --legacy-peer-deps && npm start"
echo
echo "Admin login after first backend start:"
echo "  email from ADMIN_EMAIL in backend/.env"
echo "  password from ADMIN_PASSWORD in backend/.env"
echo
echo "Or run the full stack: docker compose up --build"
